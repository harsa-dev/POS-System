import { Router } from "express";
import type { OrderStatus, OrderType, Prisma } from "@prisma/client";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { prisma } from "../lib/prisma.js";
import { OPERATIONS_ROLES, PAYMENT_METHODS, READONLY_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";
import { canTransitionOrderStatus } from "../services/permissions/index.js";

const router = Router();

const paymentMethods = new Set<string>(Object.values(PAYMENT_METHODS));
const orderStatuses: readonly OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "PREPARING",
  "READY",
  "SERVED",
  "COMPLETED",
  "CANCELLED",
];

const orderInclude = {
  items: {
    include: {
      menuItem: {
        include: {
          category: true,
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
  shift: true,
  payment: true,
} satisfies Prisma.OrderInclude;

type OrderRecord = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

type BusinessScopedUser = {
  id: string;
  role: Prisma.UserGetPayload<{}>["role"];
  businessId: string | null;
};

type CreateOrderItemInput = {
  menuItemId: string;
  quantity: number;
};

function isOrderStatus(value: string): value is OrderStatus {
  return orderStatuses.includes(value as OrderStatus);
}

function normalizeOrderType(value: unknown): OrderType {
  return value === "DINE_IN" ? "DINE_IN" : "TAKEAWAY";
}

function normalizePaymentMethod(value: unknown) {
  const paymentMethod = String(value ?? "").trim().toUpperCase();

  if (!paymentMethods.has(paymentMethod)) {
    return null;
  }

  return paymentMethod;
}

function toPositiveInteger(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue < 1) {
    return null;
  }

  return numberValue;
}

function parseCreateOrderItems(value: unknown): CreateOrderItemInput[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const groupedItems = new Map<string, number>();

  for (const item of value) {
    if (typeof item !== "object" || item === null) {
      return null;
    }

    const rawItem = item as Record<string, unknown>;
    const menuItemId = String(rawItem.menuItemId ?? "").trim();
    const quantity = toPositiveInteger(rawItem.quantity);

    if (!menuItemId || quantity === null) {
      return null;
    }

    groupedItems.set(menuItemId, (groupedItems.get(menuItemId) ?? 0) + quantity);
  }

  return Array.from(groupedItems.entries()).map(([menuItemId, quantity]) => ({
    menuItemId,
    quantity,
  }));
}

function formatOrderNumber(orderNumber: number) {
  return `#${String(orderNumber).padStart(4, "0")}`;
}

function calculateRateAmount(subtotal: number, rate: number) {
  return Math.round(subtotal * (rate / 100));
}

function assertCashPayment(amountPaid: number, total: number) {
  if (!Number.isFinite(amountPaid) || amountPaid < total) {
    return {
      ok: false,
      message: "Cash amountPaid must be greater than or equal to the order total.",
    };
  }

  return { ok: true };
}

function mapOrder(order: OrderRecord) {
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
    businessId: order.businessId,
    shiftId: order.shiftId,
    tableId: order.tableId,
    type: order.type,
    cancelReason: order.cancelReason,
    cancelledAt: order.cancelledAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    table: order.table,
    shift: order.shift,
    payment: order.payment,
    items: order.items.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
      menuItem: item.menuItem,
    })),
  };
}

async function getBusinessId(user: BusinessScopedUser) {
  const context = await requireBusinessContextForUser(user);
  return context.businessId;
}

async function getBusinessContext(user: BusinessScopedUser) {
  return requireBusinessContextForUser(user);
}

router.get("/orders", async (req, res) => {
  try {
    const user = await requireRole(req, res, READONLY_ROLES);
    if (!user) return;

    const businessId = await getBusinessId(user);
    const rawStatus = String(req.query.status ?? "").trim();
    const status = rawStatus && isOrderStatus(rawStatus) ? rawStatus : undefined;
    const type = req.query.type === "DINE_IN" ? "DINE_IN" : req.query.type === "TAKEAWAY" ? "TAKEAWAY" : undefined;
    const tableId = String(req.query.tableId ?? "").trim() || undefined;

    const orders = await prisma.order.findMany({
      where: {
        businessId,
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
        ...(tableId ? { tableId } : {}),
      },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });

    return successResponse(res, {
      data: orders.map(mapOrder),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/orders/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, READONLY_ROLES);
    if (!user) return;

    const businessId = await getBusinessId(user);
    const id = String(req.params.id ?? "").trim();

    const order = await prisma.order.findFirst({
      where: { id, businessId },
      include: orderInclude,
    });

    if (!order) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.orderNotFound,
        message: "Order not found.",
      });
    }

    return successResponse(res, {
      data: mapOrder(order),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/orders", async (req, res) => {
  try {
    const user = await requireRole(req, res, OPERATIONS_ROLES);
    if (!user) return;

    const businessContext = await getBusinessContext(user);
    const businessId = businessContext.businessId;
    const paymentMethod = normalizePaymentMethod(req.body?.paymentMethod);
    const orderType = normalizeOrderType(req.body?.orderType ?? req.body?.type);
    const tableId = req.body?.tableId === null || req.body?.tableId === undefined
      ? null
      : String(req.body.tableId).trim();
    const amountPaid = Number(req.body?.amountPaid ?? 0);
    const items = parseCreateOrderItems(req.body?.items);

    if (!paymentMethod) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Invalid payment method.",
      });
    }

    if (!items) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Order requires at least one valid item.",
      });
    }

    if (orderType === "DINE_IN" && !tableId) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Dine-in order requires tableId.",
      });
    }

    if (orderType === "TAKEAWAY" && tableId) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Takeaway order must not include tableId.",
      });
    }

    const createdOrder = await prisma.$transaction(async (tx) => {
      const menuItems = await tx.menuItem.findMany({
        where: {
          businessId,
          id: { in: items.map((item) => item.menuItemId) },
          isAvailable: true,
        },
        include: {
          category: true,
          recipes: {
            include: {
              inventoryItem: true,
            },
          },
        },
      });

      if (menuItems.length !== items.length) {
        throw new Error("One or more menu items are not available in this business.");
      }

      const menuById = new Map(menuItems.map((item) => [item.id, item]));
      const subtotal = items.reduce((total, item) => {
        const menuItem = menuById.get(item.menuItemId);
        return total + (menuItem?.price ?? 0) * item.quantity;
      }, 0);

      const taxRate = businessContext.business.restaurant?.taxRate ?? 0;
      const serviceRate = businessContext.business.restaurant?.serviceRate ?? 0;
      const taxAmount = calculateRateAmount(subtotal, taxRate);
      const serviceAmount = calculateRateAmount(subtotal, serviceRate);
      const total = subtotal + taxAmount + serviceAmount;
      const normalizedAmountPaid = paymentMethod === PAYMENT_METHODS.CASH ? amountPaid : 0;
      const cashValidation = paymentMethod === PAYMENT_METHODS.CASH
        ? assertCashPayment(normalizedAmountPaid, total)
        : { ok: true };

      if (!cashValidation.ok) {
        throw new Error(cashValidation.message);
      }

      const table = orderType === "DINE_IN" && tableId
        ? await tx.diningTable.findFirst({
            where: {
              id: tableId,
              businessId,
              isActive: true,
            },
          })
        : null;

      if (orderType === "DINE_IN" && !table) {
        throw new Error("Table not found in this business.");
      }

      const openShift = await tx.shift.findFirst({
        where: {
          businessId,
          userId: user.id,
          status: "OPEN",
        },
        orderBy: { openedAt: "desc" },
      });

      const maxOrder = await tx.order.aggregate({
        where: { businessId },
        _max: { orderNumber: true },
      });

      const orderNumber = (maxOrder._max.orderNumber ?? 0) + 1;
      const initialStatus: OrderStatus =
        paymentMethod === PAYMENT_METHODS.CASH ? "PAID" : "PENDING_PAYMENT";

      const order = await tx.order.create({
        data: {
          businessId,
          orderNumber,
          subtotal,
          taxAmount,
          serviceAmount,
          total,
          paymentMethod,
          amountPaid: normalizedAmountPaid,
          changeAmount: paymentMethod === PAYMENT_METHODS.CASH ? normalizedAmountPaid - total : 0,
          status: initialStatus,
          shiftId: openShift?.id ?? null,
          tableId: table?.id ?? null,
          type: orderType,
          items: {
            create: items.map((item) => {
              const menuItem = menuById.get(item.menuItemId);
              const price = menuItem?.price ?? 0;

              return {
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price,
                subtotal: price * item.quantity,
              };
            }),
          },
          payment: {
            create: {
              provider: paymentMethod === PAYMENT_METHODS.CASH ? "CASH" : "PENDING_PROVIDER",
              method: paymentMethod,
              status: paymentMethod === PAYMENT_METHODS.CASH ? "PAID" : "PENDING",
              paidAt: paymentMethod === PAYMENT_METHODS.CASH ? new Date() : null,
            },
          },
        },
        include: orderInclude,
      });

      if (paymentMethod === PAYMENT_METHODS.CASH && openShift) {
        await tx.shift.update({
          where: { id: openShift.id },
          data: { expectedCash: { increment: total } },
        });
      }

      if (table) {
        await tx.diningTable.update({
          where: { id: table.id },
          data: { status: "OCCUPIED" },
        });
      }

      await tx.auditLog.create({
        data: {
          businessId,
          userId: user.id,
          action: "CREATE",
          entityType: "Order",
          entityId: order.id,
          changes: {
            orderNumber,
            total,
            paymentMethod,
            status: initialStatus,
            type: orderType,
            itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
          },
        },
      });

      return order;
    });

    return successResponse(res, {
      status: 201,
      data: mapOrder(createdOrder),
      message: "Order created.",
    });
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: error.message,
      });
    }

    return handleApiError(res, error);
  }
});

router.patch("/orders/:id/status", async (req, res) => {
  try {
    const user = await requireRole(req, res, OPERATIONS_ROLES);
    if (!user) return;

    const businessContext = await getBusinessContext(user);
    const orderId = String(req.params.id ?? "").trim();
    const nextStatusValue = String(req.body?.status ?? "").trim();
    const cancelReason = String(req.body?.cancelReason ?? "").trim();

    if (!orderId) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Order id is required.",
      });
    }

    if (!isOrderStatus(nextStatusValue)) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Invalid order status.",
      });
    }

    if (!canTransitionOrderStatus(user.role, nextStatusValue)) {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.forbidden,
        message: "Your role cannot update this order status.",
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessId: businessContext.businessId,
      },
      include: orderInclude,
    });

    if (!order) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.orderNotFound,
        message: "Order not found.",
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: nextStatusValue,
        ...(nextStatusValue === "CANCELLED"
          ? {
              cancelReason,
              cancelledAt: new Date(),
            }
          : {}),
      },
      include: orderInclude,
    });

    await prisma.auditLog.create({
      data: {
        businessId: businessContext.businessId,
        userId: user.id,
        action: "UPDATE",
        entityType: "Order",
        entityId: order.id,
        changes: {
          from: order.status,
          to: nextStatusValue,
          ...(nextStatusValue === "CANCELLED" ? { cancelReason } : {}),
        },
      },
    });

    return successResponse(res, {
      data: mapOrder(updatedOrder),
      message: "Order status updated.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/orders/:id/move-table", async (req, res) => {
  try {
    const user = await requireRole(req, res, OPERATIONS_ROLES);
    if (!user) return;

    const businessId = await getBusinessId(user);
    const orderId = String(req.params.id ?? "").trim();
    const tableId = String(req.body?.tableId ?? "").trim();

    if (!tableId) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "tableId is required.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, businessId },
        include: { table: true },
      });

      if (!order) {
        throw new Error("Order not found.");
      }

      const nextTable = await tx.diningTable.findFirst({
        where: {
          id: tableId,
          businessId,
          isActive: true,
        },
      });

      if (!nextTable) {
        throw new Error("Target table not found in this business.");
      }

      if (order.tableId && order.tableId !== nextTable.id) {
        await tx.diningTable.update({
          where: { id: order.tableId },
          data: { status: "AVAILABLE" },
        });
      }

      await tx.diningTable.update({
        where: { id: nextTable.id },
        data: { status: "OCCUPIED" },
      });

      return tx.order.update({
        where: { id: order.id },
        data: {
          tableId: nextTable.id,
          type: "DINE_IN",
        },
        include: orderInclude,
      });
    });

    return successResponse(res, {
      data: mapOrder(result),
      message: "Order table updated.",
    });
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: error.message,
      });
    }

    return handleApiError(res, error);
  }
});

export default router;
