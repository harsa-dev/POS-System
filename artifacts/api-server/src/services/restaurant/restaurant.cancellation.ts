import type { CashflowAccount, OrderStatus, Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { buildRestaurantAuditPayload } from "./restaurant.audit.js";
import { RestaurantWriteError } from "./restaurant.order-write.js";
import type {
  RestaurantActorContext,
  RestaurantBusinessScope,
  RestaurantCancellationPreviewDto,
  RestaurantCancellationPreviewInput,
  RestaurantCancellationWriteDto,
  RestaurantCashflowReversalDto,
  RestaurantOrderDto,
  RestaurantPreviewWarningDto,
  RestaurantStockMovementWriteDto,
  RestaurantTableDto,
} from "./restaurant.types.js";

const cancellationOrderInclude = {
  table: true,
  payment: true,
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
} satisfies Prisma.OrderInclude;

type CancellationOrderRecord = Prisma.OrderGetPayload<{ include: typeof cancellationOrderInclude }>;
type RestaurantTransaction = Prisma.TransactionClient;

const CANCELLABLE_STATUSES = new Set<OrderStatus>([
  "PENDING_PAYMENT",
  "PAID",
  "PREPARING",
  "READY",
  "SERVED",
]);

function nowIso() {
  return new Date().toISOString();
}

function toIsoDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function formatOrderNumber(orderNumber: number) {
  return `#${String(orderNumber).padStart(4, "0")}`;
}

function normalizeReason(reason: string | null | undefined) {
  const value = String(reason ?? "").trim();
  return value.length > 0 ? value.slice(0, 300) : null;
}

function getCashflowAccount(paymentMethod: string): CashflowAccount {
  const normalized = paymentMethod.toUpperCase();

  if (normalized === "CASH" || normalized === "QRIS" || normalized === "CARD" || normalized === "TRANSFER") {
    return normalized;
  }

  return "OTHER";
}

function mapTable(table: NonNullable<CancellationOrderRecord["table"]>): RestaurantTableDto {
  return {
    id: table.id,
    name: table.name,
    capacity: table.capacity,
    status: table.status,
    isActive: table.isActive,
    createdAt: table.createdAt.toISOString(),
  };
}

function mapOrder(order: CancellationOrderRecord): RestaurantOrderDto {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    code: formatOrderNumber(order.orderNumber),
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    serviceAmount: order.serviceAmount,
    total: order.total,
    paymentMethod: order.paymentMethod,
    amountPaid: order.amountPaid,
    changeAmount: order.changeAmount,
    status: order.status,
    inventoryDeducted: order.inventoryDeducted,
    type: order.type,
    table: order.table ? mapTable(order.table) : null,
    payment: order.payment
      ? {
          id: order.payment.id,
          provider: order.payment.provider,
          method: order.payment.method,
          status: order.payment.status,
          paidAt: toIsoDate(order.payment.paidAt),
          createdAt: order.payment.createdAt.toISOString(),
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      name: item.menuItem.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function orderHasPaidValue(order: CancellationOrderRecord) {
  return order.payment?.status === "PAID" || order.amountPaid > 0 || order.status !== "PENDING_PAYMENT";
}

function buildCancellationWarnings(order: CancellationOrderRecord | null, reason: string | null): RestaurantPreviewWarningDto[] {
  const warnings: RestaurantPreviewWarningDto[] = [];

  if (!order) {
    warnings.push({
      key: "order_not_found",
      status: "blocked",
      message: "Order was not found in this Restaurant business.",
    });
    return warnings;
  }

  if (!CANCELLABLE_STATUSES.has(order.status)) {
    warnings.push({
      key: "terminal_status",
      status: "blocked",
      message: `Order ${formatOrderNumber(order.orderNumber)} is already ${order.status} and cannot be cancelled by the Restaurant cancellation workflow.`,
    });
  }

  if (!reason) {
    warnings.push({
      key: "missing_reason",
      status: "review",
      message: "Cancellation reason is empty. The write endpoint will still allow it, but audit quality will be weaker.",
    });
  }

  if (order.inventoryDeducted) {
    warnings.push({
      key: "stock_reversal",
      status: "review",
      message: "This cancellation will restore recipe inventory stock for the order.",
    });
  }

  if (orderHasPaidValue(order)) {
    warnings.push({
      key: "cashflow_reversal",
      status: "review",
      message: "This cancellation will post a refund cashflow reversal for the paid order value.",
    });
  }

  if (order.tableId) {
    warnings.push({
      key: "table_release",
      status: "info",
      message: "The linked dine-in table will be moved to CLEANING after cancellation.",
    });
  }

  return warnings;
}

function isPreviewAllowed(warnings: RestaurantPreviewWarningDto[]) {
  return !warnings.some((warning) => warning.status === "blocked");
}

async function restoreRecipeStock(
  tx: RestaurantTransaction,
  actor: RestaurantActorContext,
  order: CancellationOrderRecord,
): Promise<RestaurantStockMovementWriteDto[]> {
  if (!order.inventoryDeducted) return [];

  const requirements = new Map<
    string,
    {
      inventoryItem: CancellationOrderRecord["items"][number]["menuItem"]["recipes"][number]["inventoryItem"];
      quantity: number;
      menuNames: Set<string>;
    }
  >();

  for (const item of order.items) {
    for (const recipe of item.menuItem.recipes) {
      const restoreQuantity = recipe.quantityNeeded * item.quantity;
      if (restoreQuantity <= 0) continue;

      const existing = requirements.get(recipe.inventoryItemId);
      if (existing) {
        existing.quantity += restoreQuantity;
        existing.menuNames.add(item.menuItem.name);
        continue;
      }

      requirements.set(recipe.inventoryItemId, {
        inventoryItem: recipe.inventoryItem,
        quantity: restoreQuantity,
        menuNames: new Set([item.menuItem.name]),
      });
    }
  }

  const movements: RestaurantStockMovementWriteDto[] = [];

  for (const [inventoryItemId, requirement] of requirements) {
    const beforeStock = requirement.inventoryItem.currentStock;
    const afterStock = beforeStock + requirement.quantity;

    await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        currentStock: {
          increment: requirement.quantity,
        },
      },
    });

    await tx.stockMovement.create({
      data: {
        businessId: actor.businessId,
        inventoryItemId,
        type: "IN",
        reason: "RETURN",
        source: "ORDER",
        sourceType: "ORDER",
        sourceId: order.id,
        quantity: requirement.quantity,
        note: `Restaurant order cancellation stock restore for ${Array.from(requirement.menuNames).join(", ")}`,
        createdById: actor.userId,
        actorId: actor.userId,
      },
    });

    movements.push({
      inventoryItemId,
      inventoryItemName: requirement.inventoryItem.name,
      quantity: requirement.quantity,
      beforeStock,
      afterStock,
      unit: requirement.inventoryItem.unit,
    });
  }

  return movements;
}

async function postRefundCashflow(
  tx: RestaurantTransaction,
  actor: RestaurantActorContext,
  order: CancellationOrderRecord,
): Promise<RestaurantCashflowReversalDto> {
  const existingRefund = await tx.cashflowEntry.findFirst({
    where: {
      businessId: actor.businessId,
      sourceType: "REFUND",
      sourceId: order.id,
    },
  });

  const existingPayment = await tx.cashflowEntry.findFirst({
    where: {
      businessId: actor.businessId,
      sourceType: "ORDER_PAYMENT",
      sourceId: order.id,
    },
  });

  const shouldReverse = orderHasPaidValue(order) || Boolean(existingPayment);

  if (!shouldReverse) {
    return {
      posted: false,
      amount: 0,
      account: null,
      sourceType: null,
      entryId: null,
    };
  }

  const data = {
    businessId: actor.businessId,
    type: "EXPENSE" as const,
    account: existingPayment?.account ?? getCashflowAccount(order.paymentMethod),
    amount: order.total,
    status: "POSTED" as const,
    occurredAt: new Date(),
    title: `Restaurant order ${formatOrderNumber(order.orderNumber)} cancellation refund`,
    description: "Cancellation reversal for paid Restaurant order.",
    sourceType: "REFUND" as const,
    sourceId: order.id,
    reference: `${formatOrderNumber(order.orderNumber)}-CANCEL`,
    createdById: actor.userId,
  };

  if (existingRefund) {
    const updatedRefund = await tx.cashflowEntry.update({
      where: { id: existingRefund.id },
      data,
    });

    return {
      posted: true,
      amount: updatedRefund.amount,
      account: updatedRefund.account,
      sourceType: updatedRefund.sourceType,
      entryId: updatedRefund.id,
    };
  }

  const createdRefund = await tx.cashflowEntry.create({ data });

  return {
    posted: true,
    amount: createdRefund.amount,
    account: createdRefund.account,
    sourceType: createdRefund.sourceType,
    entryId: createdRefund.id,
  };
}

export class RestaurantCancellationService {
  async previewCancellation(scope: RestaurantBusinessScope, input: RestaurantCancellationPreviewInput): Promise<RestaurantCancellationPreviewDto> {
    const reason = normalizeReason(input.reason);
    const order = await prisma.order.findFirst({
      where: {
        id: input.orderId,
        businessId: scope.businessId,
      },
      include: cancellationOrderInclude,
    });

    const warnings = buildCancellationWarnings(order, reason);

    return {
      kind: "cancellation",
      generatedAt: nowIso(),
      order: order ? mapOrder(order) : null,
      currentStatus: order?.status ?? null,
      targetStatus: "CANCELLED",
      allowed: isPreviewAllowed(warnings),
      reason,
      stockWillBeRestored: Boolean(order?.inventoryDeducted),
      cashflowWillBeReversed: order ? orderHasPaidValue(order) : false,
      tableWillBeReleased: Boolean(order?.tableId),
      warnings,
      source: "preview",
    };
  }

  async cancelOrder(actor: RestaurantActorContext, input: RestaurantCancellationPreviewInput): Promise<RestaurantCancellationWriteDto> {
    const preview = await this.previewCancellation(actor, input);

    if (!preview.allowed || !preview.order || !preview.currentStatus) {
      throw new RestaurantWriteError("Restaurant order cannot be cancelled from the current preview state.", 409, preview.warnings);
    }

    const reason = normalizeReason(input.reason);
    const previousStatus = preview.currentStatus;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          id: input.orderId,
          businessId: actor.businessId,
        },
        include: cancellationOrderInclude,
      });

      if (!order) {
        throw new RestaurantWriteError("Order was not found in this Restaurant business.", 404);
      }

      if (!CANCELLABLE_STATUSES.has(order.status)) {
        throw new RestaurantWriteError(`Order ${formatOrderNumber(order.orderNumber)} is already ${order.status} and cannot be cancelled.`, 409);
      }

      if (order.status !== previousStatus) {
        throw new RestaurantWriteError(`Order ${formatOrderNumber(order.orderNumber)} changed from ${previousStatus} to ${order.status}. Refresh before cancelling.`, 409);
      }

      const stockMovements = await restoreRecipeStock(tx, actor, order);
      const cashflowReversal = await postRefundCashflow(tx, actor, order);
      const tableStatusUpdated = Boolean(order.tableId);

      if (tableStatusUpdated) {
        await tx.diningTable.update({
          where: { id: order.tableId ?? "" },
          data: { status: "CLEANING" },
        });
      }

      if (order.payment?.status === "PENDING") {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: "EXPIRED" },
        });
      }

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          cancelReason: reason,
          cancelledAt: new Date(),
          inventoryDeducted: false,
        },
        include: cancellationOrderInclude,
      });

      await tx.auditLog.create({
        data: {
          businessId: actor.businessId,
          userId: actor.userId,
          action: "UPDATE",
          entityType: "RestaurantOrder",
          entityId: updatedOrder.id,
          changes: buildRestaurantAuditPayload({
            event: "restaurant.workflow.order_cancelled",
            actor,
            references: {
              orderId: updatedOrder.id,
              tableId: updatedOrder.tableId ?? null,
              cashflowReversalId: cashflowReversal.entryId,
            },
            totals: {
              total: updatedOrder.total,
              restoredStockLines: stockMovements.length,
              restoredQuantity: stockMovements.reduce((sum, movement) => sum + movement.quantity, 0),
              cashflowReversalAmount: cashflowReversal.amount,
            },
            status: {
              from: previousStatus,
              to: "CANCELLED",
            },
            reason,
            metadata: {
              stockRestored: stockMovements.length > 0,
              cashflowReversalPosted: cashflowReversal.posted,
              tableStatusUpdated,
              previousInventoryDeducted: order.inventoryDeducted,
              previousPaymentStatus: order.payment?.status ?? null,
            },
          }),
        },
      });

      return {
        order: mapOrder(updatedOrder),
        stockMovements,
        cashflowReversal,
        tableStatusUpdated,
      };
    });

    return {
      kind: "cancellation",
      generatedAt: nowIso(),
      order: result.order,
      previousStatus,
      currentStatus: "CANCELLED",
      reason,
      stockMovements: result.stockMovements,
      cashflowReversal: result.cashflowReversal,
      tableStatusUpdated: result.tableStatusUpdated,
      warnings: preview.warnings,
      source: "write",
    };
  }
}

export const restaurantCancellationService = new RestaurantCancellationService();
