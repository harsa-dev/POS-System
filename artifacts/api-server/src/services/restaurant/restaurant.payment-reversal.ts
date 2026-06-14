import type { CashflowAccount, PaymentStatus, Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { buildRestaurantAuditPayload } from "./restaurant.audit.js";
import { RestaurantWriteError } from "./restaurant.order-write.js";
import type {
  RestaurantActorContext,
  RestaurantBusinessScope,
  RestaurantCashflowReversalDto,
  RestaurantOrderDto,
  RestaurantPreviewWarningDto,
  RestaurantTableDto,
} from "./restaurant.types.js";

type RestaurantPaymentReversalAction = "refund" | "void";

export type RestaurantPaymentReversalInput = {
  orderId: string;
  action?: RestaurantPaymentReversalAction | null;
  amount?: number | null;
  reason?: string | null;
};

export type RestaurantPaymentReversalPreviewDto = {
  kind: "payment_reversal";
  generatedAt: string;
  action: RestaurantPaymentReversalAction | null;
  order: RestaurantOrderDto | null;
  paymentStatus: PaymentStatus | null;
  amount: number;
  reason: string | null;
  allowed: boolean;
  cashflowWillBeReversed: boolean;
  paymentWillBeExpired: boolean;
  warnings: RestaurantPreviewWarningDto[];
  source: "preview";
};

export type RestaurantPaymentReversalWriteDto = {
  kind: "payment_reversal";
  generatedAt: string;
  action: RestaurantPaymentReversalAction;
  order: RestaurantOrderDto;
  previousPaymentStatus: PaymentStatus;
  currentPaymentStatus: PaymentStatus;
  amount: number;
  reason: string | null;
  cashflowReversal: RestaurantCashflowReversalDto;
  expectedCashAdjusted: boolean;
  warnings: RestaurantPreviewWarningDto[];
  source: "write";
};

const paymentReversalOrderInclude = {
  table: true,
  payment: true,
  items: {
    include: {
      menuItem: true,
    },
  },
} satisfies Prisma.OrderInclude;

type PaymentReversalOrderRecord = Prisma.OrderGetPayload<{ include: typeof paymentReversalOrderInclude }>;
type RestaurantTransaction = Prisma.TransactionClient;

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

function getPaymentAction(paymentStatus: PaymentStatus | null | undefined, requestedAction?: RestaurantPaymentReversalAction | null) {
  if (requestedAction) return requestedAction;
  if (paymentStatus === "PENDING") return "void";
  if (paymentStatus === "PAID") return "refund";
  return null;
}

function getReversalAmount(order: PaymentReversalOrderRecord | null, input: RestaurantPaymentReversalInput) {
  if (!order) return 0;
  const requestedAmount = typeof input.amount === "number" ? Math.floor(input.amount) : null;
  if (requestedAmount && requestedAmount > 0) return requestedAmount;
  return order.total;
}

function mapTable(table: NonNullable<PaymentReversalOrderRecord["table"]>): RestaurantTableDto {
  return {
    id: table.id,
    name: table.name,
    capacity: table.capacity,
    status: table.status,
    isActive: table.isActive,
    createdAt: table.createdAt.toISOString(),
  };
}

function mapOrder(order: PaymentReversalOrderRecord): RestaurantOrderDto {
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

async function getExistingRefund(businessId: string, orderId: string) {
  return prisma.cashflowEntry.findFirst({
    where: {
      businessId,
      sourceType: "REFUND",
      sourceId: orderId,
    },
  });
}

async function buildPaymentReversalWarnings(
  scope: RestaurantBusinessScope,
  order: PaymentReversalOrderRecord | null,
  input: RestaurantPaymentReversalInput,
) {
  const warnings: RestaurantPreviewWarningDto[] = [];
  const action = getPaymentAction(order?.payment?.status, input.action);
  const amount = getReversalAmount(order, input);

  if (!order) {
    warnings.push({
      key: "order_not_found",
      status: "blocked",
      message: "Order was not found in this Restaurant business.",
    });
    return { action, amount, warnings };
  }

  if (!order.payment) {
    warnings.push({
      key: "payment_not_found",
      status: "blocked",
      message: `Order ${formatOrderNumber(order.orderNumber)} does not have a payment record to reverse.`,
    });
    return { action, amount, warnings };
  }

  if (!action) {
    warnings.push({
      key: "unsupported_payment_status",
      status: "blocked",
      message: `Payment status ${order.payment.status} cannot be reversed by the Restaurant payment reversal workflow.`,
    });
    return { action, amount, warnings };
  }

  if (action === "void" && order.payment.status !== "PENDING") {
    warnings.push({
      key: "void_requires_pending_payment",
      status: "blocked",
      message: "Payment void is only allowed for PENDING payments.",
    });
  }

  if (action === "refund" && order.payment.status !== "PAID") {
    warnings.push({
      key: "refund_requires_paid_payment",
      status: "blocked",
      message: "Payment refund is only allowed for PAID payments.",
    });
  }

  if (action === "refund") {
    const existingRefund = await getExistingRefund(scope.businessId, order.id);

    if (existingRefund) {
      warnings.push({
        key: "refund_already_posted",
        status: "blocked",
        message: `A refund cashflow entry already exists for order ${formatOrderNumber(order.orderNumber)}.`,
      });
    }

    if (amount <= 0) {
      warnings.push({
        key: "invalid_refund_amount",
        status: "blocked",
        message: "Refund amount must be greater than zero.",
      });
    }

    if (amount > order.total) {
      warnings.push({
        key: "refund_amount_too_high",
        status: "blocked",
        message: "Refund amount cannot exceed the order total.",
      });
    }

    if (order.status === "CANCELLED") {
      warnings.push({
        key: "cancelled_order_refund_boundary",
        status: "blocked",
        message: "Cancelled orders should be reversed through the cancellation workflow to keep stock, table, cashflow, and audit aligned.",
      });
    }
  }

  if (!input.reason || normalizeReason(input.reason) === null) {
    warnings.push({
      key: "missing_reason",
      status: "review",
      message: "Payment reversal reason is empty. The write endpoint will still allow it, but audit quality will be weaker.",
    });
  }

  return { action, amount, warnings };
}

function isPreviewAllowed(warnings: RestaurantPreviewWarningDto[]) {
  return !warnings.some((warning) => warning.status === "blocked");
}

async function postRefundCashflow(
  tx: RestaurantTransaction,
  actor: RestaurantActorContext,
  order: PaymentReversalOrderRecord,
  amount: number,
  reason: string | null,
): Promise<RestaurantCashflowReversalDto> {
  const createdRefund = await tx.cashflowEntry.create({
    data: {
      businessId: actor.businessId,
      type: "EXPENSE",
      account: getCashflowAccount(order.paymentMethod),
      amount,
      status: "POSTED",
      occurredAt: new Date(),
      title: `Restaurant order ${formatOrderNumber(order.orderNumber)} payment refund`,
      description: reason ?? "Standalone Restaurant payment refund.",
      sourceType: "REFUND",
      sourceId: order.id,
      reference: `${formatOrderNumber(order.orderNumber)}-REFUND`,
      createdById: actor.userId,
    },
  });

  return {
    posted: true,
    amount: createdRefund.amount,
    account: createdRefund.account,
    sourceType: createdRefund.sourceType,
    entryId: createdRefund.id,
  };
}

async function adjustExpectedCashForRefund(
  tx: RestaurantTransaction,
  actor: RestaurantActorContext,
  order: PaymentReversalOrderRecord,
  amount: number,
) {
  if (order.paymentMethod.toUpperCase() !== "CASH") return false;

  const openShift = await tx.shift.findFirst({
    where: {
      businessId: actor.businessId,
      userId: actor.userId,
      status: "OPEN",
    },
    orderBy: { openedAt: "desc" },
  });

  if (!openShift) return false;

  await tx.shift.update({
    where: { id: openShift.id },
    data: {
      expectedCash: {
        decrement: amount,
      },
    },
  });

  return true;
}

export class RestaurantPaymentReversalService {
  async previewPaymentReversal(scope: RestaurantBusinessScope, input: RestaurantPaymentReversalInput): Promise<RestaurantPaymentReversalPreviewDto> {
    const order = await prisma.order.findFirst({
      where: {
        id: input.orderId,
        businessId: scope.businessId,
      },
      include: paymentReversalOrderInclude,
    });

    const { action, amount, warnings } = await buildPaymentReversalWarnings(scope, order, input);
    const paymentStatus = order?.payment?.status ?? null;

    return {
      kind: "payment_reversal",
      generatedAt: nowIso(),
      action,
      order: order ? mapOrder(order) : null,
      paymentStatus,
      amount,
      reason: normalizeReason(input.reason),
      allowed: isPreviewAllowed(warnings),
      cashflowWillBeReversed: action === "refund" && paymentStatus === "PAID",
      paymentWillBeExpired: action === "void" && paymentStatus === "PENDING",
      warnings,
      source: "preview",
    };
  }

  async reversePayment(actor: RestaurantActorContext, input: RestaurantPaymentReversalInput): Promise<RestaurantPaymentReversalWriteDto> {
    const preview = await this.previewPaymentReversal(actor, input);

    if (!preview.allowed || !preview.order || !preview.action || !preview.paymentStatus) {
      throw new RestaurantWriteError("Restaurant payment cannot be reversed from the current preview state.", 409, preview.warnings);
    }

    const previousPaymentStatus = preview.paymentStatus;
    const reason = normalizeReason(input.reason);

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          id: input.orderId,
          businessId: actor.businessId,
        },
        include: paymentReversalOrderInclude,
      });

      if (!order) {
        throw new RestaurantWriteError("Order was not found in this Restaurant business.", 404);
      }

      if (!order.payment) {
        throw new RestaurantWriteError(`Order ${formatOrderNumber(order.orderNumber)} does not have a payment record to reverse.`, 409);
      }

      if (order.payment.status !== previousPaymentStatus) {
        throw new RestaurantWriteError(`Payment for order ${formatOrderNumber(order.orderNumber)} changed from ${previousPaymentStatus} to ${order.payment.status}. Refresh before reversing payment.`, 409);
      }

      let cashflowReversal: RestaurantCashflowReversalDto = {
        posted: false,
        amount: 0,
        account: null,
        sourceType: null,
        entryId: null,
      };
      let expectedCashAdjusted = false;
      let currentPaymentStatus: PaymentStatus = order.payment.status;

      if (preview.action === "void") {
        const updatedPayment = await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: "EXPIRED",
          },
        });
        currentPaymentStatus = updatedPayment.status;
      }

      if (preview.action === "refund") {
        const existingRefund = await tx.cashflowEntry.findFirst({
          where: {
            businessId: actor.businessId,
            sourceType: "REFUND",
            sourceId: order.id,
          },
        });

        if (existingRefund) {
          throw new RestaurantWriteError(`A refund cashflow entry already exists for order ${formatOrderNumber(order.orderNumber)}.`, 409);
        }

        cashflowReversal = await postRefundCashflow(tx, actor, order, preview.amount, reason);
        expectedCashAdjusted = await adjustExpectedCashForRefund(tx, actor, order, preview.amount);
      }

      const updatedOrder = await tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: paymentReversalOrderInclude,
      });

      await tx.auditLog.create({
        data: {
          businessId: actor.businessId,
          userId: actor.userId,
          action: "UPDATE",
          entityType: "RestaurantPayment",
          entityId: order.payment.id,
          changes: buildRestaurantAuditPayload({
            event: preview.action === "refund" ? "restaurant.payment.refunded" : "restaurant.payment.voided",
            actor,
            references: {
              orderId: order.id,
              paymentId: order.payment.id,
              cashflowReversalId: cashflowReversal.entryId,
            },
            totals: {
              orderTotal: order.total,
              reversalAmount: preview.amount,
              cashflowReversalAmount: cashflowReversal.amount,
            },
            status: {
              from: previousPaymentStatus,
              to: currentPaymentStatus,
            },
            reason,
            metadata: {
              action: preview.action,
              paymentMethod: order.payment.method,
              cashflowReversalPosted: cashflowReversal.posted,
              expectedCashAdjusted,
              orderStatus: order.status,
            },
          }),
        },
      });

      return {
        order: mapOrder(updatedOrder),
        cashflowReversal,
        expectedCashAdjusted,
        currentPaymentStatus,
      };
    });

    return {
      kind: "payment_reversal",
      generatedAt: nowIso(),
      action: preview.action,
      order: result.order,
      previousPaymentStatus,
      currentPaymentStatus: result.currentPaymentStatus,
      amount: preview.amount,
      reason,
      cashflowReversal: result.cashflowReversal,
      expectedCashAdjusted: result.expectedCashAdjusted,
      warnings: preview.warnings,
      source: "write",
    };
  }
}

export const restaurantPaymentReversalService = new RestaurantPaymentReversalService();
