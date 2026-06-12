import { Prisma } from "@prisma/client";
import type { OrderStatus, Role } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import type { RestaurantBusinessContext } from "../../lib/business-context/index.js";
import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import { realtime } from "../../lib/realtime.js";
import { REALTIME_EVENTS } from "../../lib/realtime-events.js";
import { PAYMENT_METHODS } from "../../lib/constants.js";
import { checkOrderStatusTransition } from "./order-status-rules.js";

type OrderStatusActor = {
  id: string;
  role: Role;
};

export type TransitionOrderStatusInput = {
  user: OrderStatusActor;
  businessContext: RestaurantBusinessContext;
  orderId: string;
  nextStatus: OrderStatus;
  cancelReason?: string;
};

export type TransitionOrderStatusResult = {
  id: string;
  orderNumber: number;
  previousStatus: OrderStatus;
  status: OrderStatus;
};

const transitionOrderInclude = {
  items: {
    include: {
      menuItem: {
        include: {
          recipes: {
            include: {
              inventoryItem: true,
            },
          },
        },
      },
    },
  },
  table: true,
} satisfies Prisma.OrderInclude;

type TransitionOrderRecord = Prisma.OrderGetPayload<{
  include: typeof transitionOrderInclude;
}>;

function getNoRecipeProcessingMessage(menuItemName: string) {
  return `Menu item "${menuItemName}" has no recipe configured and cannot be processed. Add at least one ingredient first.`;
}

function assertTransitionAllowed(params: {
  role: Role;
  currentStatus: OrderStatus;
  nextStatus: OrderStatus;
}) {
  const decision = checkOrderStatusTransition(params);

  if (decision.allowed) return;

  if (decision.reason === "FORBIDDEN") {
    throw new AppError({
      statusCode: 403,
      code: errorCodes.forbidden,
      message: "Your role cannot perform this order transition.",
      details: {
        requiredPermission: decision.requiredPermission,
      },
    });
  }

  throw new AppError({
    statusCode: 400,
    code: errorCodes.invalidStateTransition,
    message: `Cannot transition order from ${params.currentStatus} to ${params.nextStatus}.`,
    details: {
      currentStatus: params.currentStatus,
      nextStatus: params.nextStatus,
      allowedNextStatuses: decision.allowedNextStatuses,
    },
  });
}

function assertCancelReason(nextStatus: OrderStatus, cancelReason: string) {
  if (nextStatus !== "CANCELLED") return;

  if (!cancelReason) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: "Cancel reason is required.",
    });
  }
}

async function deductRecipeInventoryForOrder(params: {
  tx: Prisma.TransactionClient;
  order: TransitionOrderRecord;
  restaurantId: string;
}) {
  const { tx, order, restaurantId } = params;

  for (const item of order.items) {
    if (item.menuItem.recipes.length === 0) {
      throw new AppError({
        statusCode: 400,
        code: errorCodes.validationError,
        message: getNoRecipeProcessingMessage(item.menuItem.name),
      });
    }

    for (const recipe of item.menuItem.recipes) {
      const quantity = recipe.quantityNeeded * item.quantity;

      const inventoryItem = await tx.inventoryItem.findFirst({
        where: {
          id: recipe.inventoryItemId,
          restaurantId,
        },
      });

      if (!inventoryItem || inventoryItem.currentStock < quantity) {
        throw new AppError({
          statusCode: 400,
          code: errorCodes.insufficientStock,
          message: `Insufficient stock for ${recipe.inventoryItem.name}.`,
          details: {
            inventoryItemId: recipe.inventoryItemId,
            requiredQuantity: quantity,
            availableQuantity: inventoryItem?.currentStock ?? 0,
          },
        });
      }

      await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: { currentStock: { decrement: quantity } },
      });

      await tx.stockMovement.create({
        data: {
          inventoryItemId: inventoryItem.id,
          type: "OUT",
          quantity,
          reason: "RECIPE_USAGE",
          note: `Order #${order.orderNumber}`,
        },
      });
    }
  }
}

async function restoreRecipeInventoryForCancelledOrder(params: {
  tx: Prisma.TransactionClient;
  order: TransitionOrderRecord;
}) {
  const { tx, order } = params;

  for (const item of order.items) {
    for (const recipe of item.menuItem.recipes) {
      const quantity = recipe.quantityNeeded * item.quantity;

      await tx.inventoryItem.update({
        where: { id: recipe.inventoryItemId },
        data: { currentStock: { increment: quantity } },
      });

      await tx.stockMovement.create({
        data: {
          inventoryItemId: recipe.inventoryItemId,
          type: "IN",
          quantity,
          reason: "RETURN",
          note: `Order #${order.orderNumber} cancelled`,
        },
      });
    }
  }
}

async function applyTableSideEffect(params: {
  tx: Prisma.TransactionClient;
  order: TransitionOrderRecord;
  nextStatus: OrderStatus;
}) {
  const { tx, order, nextStatus } = params;

  if (nextStatus !== "COMPLETED" && nextStatus !== "CANCELLED") return;
  if (!order.tableId) return;

  await tx.diningTable.update({
    where: { id: order.tableId },
    data: {
      status: nextStatus === "COMPLETED" ? "CLEANING" : "AVAILABLE",
    },
  });
}

export async function transitionOrderStatus({
  user,
  businessContext,
  orderId,
  nextStatus,
  cancelReason = "",
}: TransitionOrderStatusInput): Promise<TransitionOrderStatusResult> {
  const restaurantId = businessContext.restaurantId;
  const trimmedCancelReason = cancelReason.trim();

  assertCancelReason(nextStatus, trimmedCancelReason);

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: orderId,
        restaurantId,
      },
      include: transitionOrderInclude,
    });

    if (!order) {
      throw new AppError({
        statusCode: 404,
        code: errorCodes.orderNotFound,
        message: "Order not found.",
      });
    }

    assertTransitionAllowed({
      role: user.role,
      currentStatus: order.status,
      nextStatus,
    });

    const isProcessingPaidOrder = order.status === "PAID" && nextStatus === "PREPARING";
    const isCancelling = nextStatus === "CANCELLED";
    const shouldRestoreCashShift =
      isCancelling &&
      order.paymentMethod === PAYMENT_METHODS.CASH &&
      order.status !== "PENDING_PAYMENT";

    if (isProcessingPaidOrder && !order.inventoryDeducted) {
      await deductRecipeInventoryForOrder({
        tx,
        order,
        restaurantId,
      });
    }

    if (isCancelling && order.inventoryDeducted) {
      await restoreRecipeInventoryForCancelledOrder({ tx, order });
    }

    if (shouldRestoreCashShift && order.shiftId) {
      await tx.shift.update({
        where: { id: order.shiftId },
        data: { expectedCash: { decrement: order.total } },
      });
    }

    await applyTableSideEffect({
      tx,
      order,
      nextStatus,
    });

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: nextStatus,
        inventoryDeducted: isProcessingPaidOrder ? true : order.inventoryDeducted,
        ...(isCancelling
          ? {
              cancelReason: trimmedCancelReason,
              cancelledAt: new Date(),
            }
          : {}),
      },
    });

    await tx.auditLog.create({
      data: {
        restaurantId,
        userId: user.id,
        action: "UPDATE",
        entityType: "Order",
        entityId: order.id,
        changes: {
          orderNumber: order.orderNumber,
          from: order.status,
          to: nextStatus,
          ...(isCancelling ? { cancelReason: trimmedCancelReason } : {}),
        },
      },
    });

    return {
      id: updatedOrder.id,
      orderNumber: order.orderNumber,
      previousStatus: order.status,
      status: updatedOrder.status,
    };
  });

  realtime.broadcast(businessContext.businessId, REALTIME_EVENTS.ORDER_UPDATED, {
    id: result.id,
    orderNumber: result.orderNumber,
    status: result.status,
  });

  return result;
}
