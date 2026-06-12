import { randomUUID } from "node:crypto";

import type { BusinessContext } from "../../lib/business-context/business-context.types.js";
import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import { prisma } from "../../lib/prisma.js";
import { toCashflowEntryDto, toCashflowEntryDtos } from "./cashflow.dto.js";
import {
  countCashflowEntryRecords,
  createCashflowEntryRecord,
  findCashflowEntryById,
  findCashflowEntryByIdempotencyKey,
  getCashflowCategorySummary,
  getCashflowSummary,
  getCashflowTrend,
  listCashflowEntryRecords,
  voidCashflowEntryRecord,
} from "./cashflow.repository.js";
import {
  requireCashflowCreate,
  requireCashflowSync,
  requireCashflowView,
  requireCashflowVoid,
} from "./cashflow.permissions.js";
import type {
  CashflowActor,
  CashflowDashboardDto,
  CashflowEntryType,
  CashflowQuery,
  CreateCashflowEntryInput,
} from "./cashflow.types.js";
import {
  assertEntryCanBeVoided,
  assertManualEntryType,
  mapPaymentMethodToAccount,
  parseCashflowQuery,
  parseCreateCashflowEntryInput,
} from "./cashflow.validation.js";

function writableBusinessId(businessContext: BusinessContext) {
  return businessContext.businessId !== businessContext.restaurantId
    ? businessContext.businessId
    : null;
}

function getPostedAt(status: "PENDING" | "POSTED" | "VOIDED") {
  return status === "POSTED" ? new Date() : null;
}

function getSignedAmount(type: CashflowEntryType, amount: number) {
  if (type === "EXPENSE" || type === "TRANSFER_OUT") return Math.abs(amount);
  return amount;
}

export function parseCashflowListQuery(rawQuery: Record<string, unknown>) {
  return parseCashflowQuery(rawQuery);
}

export async function listCashflowEntries(params: {
  actor: CashflowActor;
  businessContext: BusinessContext;
  query: CashflowQuery;
}) {
  requireCashflowView(params.actor.role);

  const [entries, totalItems] = await Promise.all([
    listCashflowEntryRecords(prisma, params.businessContext.restaurantId, params.query),
    countCashflowEntryRecords(prisma, params.businessContext.restaurantId, params.query),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / params.query.limit));

  return {
    entries: toCashflowEntryDtos(entries),
    pagination: {
      page: params.query.page,
      limit: params.query.limit,
      totalItems,
      totalPages,
      hasNextPage: params.query.page < totalPages,
      hasPreviousPage: params.query.page > 1,
    },
  };
}

export async function getCashflowDashboard(params: {
  actor: CashflowActor;
  businessContext: BusinessContext;
  query: CashflowQuery;
}): Promise<CashflowDashboardDto> {
  requireCashflowView(params.actor.role);

  const [summary, trend, incomeSources, expenseSources, recentEntries] =
    await Promise.all([
      getCashflowSummary(prisma, params.businessContext.restaurantId, params.query),
      getCashflowTrend(prisma, params.businessContext.restaurantId, params.query),
      getCashflowCategorySummary(
        prisma,
        params.businessContext.restaurantId,
        params.query,
        "income"
      ),
      getCashflowCategorySummary(
        prisma,
        params.businessContext.restaurantId,
        params.query,
        "expense"
      ),
      listCashflowEntryRecords(prisma, params.businessContext.restaurantId, {
        ...params.query,
        page: 1,
        limit: 10,
      }),
    ]);

  return {
    summary,
    trend: trend.map((item) => ({
      period: item.period.toISOString(),
      income: item.income,
      expense: item.expense,
      balance: item.balance,
    })),
    incomeSources,
    expenseSources,
    recentEntries: toCashflowEntryDtos(recentEntries),
  };
}

export async function createManualCashflowEntry(params: {
  actor: CashflowActor;
  businessContext: BusinessContext;
  input: CreateCashflowEntryInput | unknown;
}) {
  requireCashflowCreate(params.actor.role);

  const parsed = parseCreateCashflowEntryInput(params.input);
  assertManualEntryType(parsed.type);

  return prisma.$transaction(async (tx) => {
    const entry = await createCashflowEntryRecord(tx, {
      id: randomUUID(),
      businessId: writableBusinessId(params.businessContext),
      restaurantId: params.businessContext.restaurantId,
      sourceType: "MANUAL",
      sourceId: null,
      idempotencyKey: null,
      account: parsed.account,
      type: parsed.type,
      status: parsed.status,
      category: parsed.category,
      counterpartyName: parsed.counterpartyName,
      description: parsed.description,
      amount: getSignedAmount(parsed.type, parsed.amount),
      occurredAt: parsed.occurredAt,
      postedAt: getPostedAt(parsed.status),
      createdById: params.actor.id,
      metadata: {
        createdFrom: "manual-entry",
      },
    });

    if (!entry) {
      throw new AppError({
        statusCode: 409,
        code: errorCodes.duplicateCashflowEntry,
        message: "Duplicate cashflow entry.",
      });
    }

    await tx.auditLog.create({
      data: {
        restaurantId: params.businessContext.restaurantId,
        userId: params.actor.id,
        action: "CREATE",
        entityType: "CashflowEntry",
        entityId: entry.id,
        changes: {
          sourceType: entry.sourceType,
          type: entry.type,
          status: entry.status,
          account: entry.account,
          amount: entry.amount,
        },
      },
    });

    return toCashflowEntryDto(entry);
  });
}

export async function syncOrderPaymentToCashflow(params: {
  actor: CashflowActor;
  businessContext: BusinessContext;
  orderId: string;
}) {
  requireCashflowSync(params.actor.role);

  const order = await prisma.order.findFirst({
    where: {
      id: params.orderId,
      restaurantId: params.businessContext.restaurantId,
    },
    include: {
      payment: true,
    },
  });

  if (!order) {
    throw new AppError({
      statusCode: 404,
      code: errorCodes.orderNotFound,
      message: "Order not found.",
    });
  }

  const isPaid =
    order.status !== "PENDING_PAYMENT" &&
    order.status !== "CANCELLED" &&
    (order.payment ? order.payment.status === "PAID" : true);

  if (!isPaid) {
    throw new AppError({
      statusCode: 409,
      code: errorCodes.cashflowSourceNotReady,
      message: "Order payment is not ready to sync to cashflow.",
    });
  }

  const idempotencyKey = `ORDER_PAYMENT:${order.id}`;

  return prisma.$transaction(async (tx) => {
    const created = await createCashflowEntryRecord(tx, {
      id: randomUUID(),
      businessId: writableBusinessId(params.businessContext),
      restaurantId: params.businessContext.restaurantId,
      sourceType: "ORDER_PAYMENT",
      sourceId: order.id,
      idempotencyKey,
      account: mapPaymentMethodToAccount(order.paymentMethod),
      type: "INCOME",
      status: "POSTED",
      category: "Sales",
      counterpartyName: `Order #${order.orderNumber}`,
      description: `Synced payment for order #${order.orderNumber}`,
      amount: order.total,
      occurredAt: order.payment?.paidAt ?? order.createdAt,
      postedAt: order.payment?.paidAt ?? new Date(),
      createdById: params.actor.id,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentId: order.payment?.id ?? null,
        paymentStatus: order.payment?.status ?? null,
        paymentMethod: order.paymentMethod,
      },
    });

    const entry =
      created ??
      (await findCashflowEntryByIdempotencyKey(
        tx,
        params.businessContext.restaurantId,
        idempotencyKey
      ));

    if (!entry) {
      throw new AppError({
        statusCode: 409,
        code: errorCodes.duplicateCashflowEntry,
        message: "Duplicate cashflow entry.",
      });
    }

    if (created) {
      await tx.auditLog.create({
        data: {
          restaurantId: params.businessContext.restaurantId,
          userId: params.actor.id,
          action: "CREATE",
          entityType: "CashflowEntry",
          entityId: created.id,
          changes: {
            sourceType: created.sourceType,
            sourceId: created.sourceId,
            idempotencyKey,
            amount: created.amount,
          },
        },
      });
    }

    return toCashflowEntryDto(entry);
  });
}

export async function syncShiftCloseToCashflow(params: {
  actor: CashflowActor;
  businessContext: BusinessContext;
  shiftId: string;
}) {
  requireCashflowSync(params.actor.role);

  const shift = await prisma.shift.findFirst({
    where: {
      id: params.shiftId,
      restaurantId: params.businessContext.restaurantId,
    },
  });

  if (!shift) {
    throw new AppError({
      statusCode: 404,
      code: errorCodes.notFound,
      message: "Shift not found.",
    });
  }

  if (shift.status !== "CLOSED" || !shift.closedAt) {
    throw new AppError({
      statusCode: 409,
      code: errorCodes.cashflowSourceNotReady,
      message: "Only closed shifts can be synced to cashflow.",
    });
  }

  const closedAt = shift.closedAt;
  const amount = shift.cashDifference ?? 0;
  const idempotencyKey = `SHIFT_CLOSE:${shift.id}`;

  return prisma.$transaction(async (tx) => {
    const created = await createCashflowEntryRecord(tx, {
      id: randomUUID(),
      businessId: writableBusinessId(params.businessContext),
      restaurantId: params.businessContext.restaurantId,
      sourceType: "SHIFT_CLOSE",
      sourceId: shift.id,
      idempotencyKey,
      account: "CASH",
      type: "ADJUSTMENT",
      status: "POSTED",
      category: "Cash Drawer Reconciliation",
      counterpartyName: null,
      description: `Shift close reconciliation for ${shift.id}`,
      amount,
      occurredAt: closedAt,
      postedAt: closedAt,
      createdById: params.actor.id,
      metadata: {
        shiftId: shift.id,
        openingCash: shift.openingCash,
        closingCash: shift.closingCash,
        expectedCash: shift.expectedCash,
        cashDifference: shift.cashDifference,
      },
    });

    const entry =
      created ??
      (await findCashflowEntryByIdempotencyKey(
        tx,
        params.businessContext.restaurantId,
        idempotencyKey
      ));

    if (!entry) {
      throw new AppError({
        statusCode: 409,
        code: errorCodes.duplicateCashflowEntry,
        message: "Duplicate cashflow entry.",
      });
    }

    if (created) {
      await tx.auditLog.create({
        data: {
          restaurantId: params.businessContext.restaurantId,
          userId: params.actor.id,
          action: "CREATE",
          entityType: "CashflowEntry",
          entityId: created.id,
          changes: {
            sourceType: created.sourceType,
            sourceId: created.sourceId,
            idempotencyKey,
            amount: created.amount,
          },
        },
      });
    }

    return toCashflowEntryDto(entry);
  });
}

export async function voidCashflowEntry(params: {
  actor: CashflowActor;
  businessContext: BusinessContext;
  id: string;
}) {
  requireCashflowVoid(params.actor.role);

  return prisma.$transaction(async (tx) => {
    const existing = await findCashflowEntryById(
      tx,
      params.businessContext.restaurantId,
      params.id
    );

    if (!existing) {
      throw new AppError({
        statusCode: 404,
        code: errorCodes.cashflowEntryNotFound,
        message: "Cashflow entry not found.",
      });
    }

    assertEntryCanBeVoided(existing.status);

    const updated = await voidCashflowEntryRecord(
      tx,
      params.businessContext.restaurantId,
      params.id
    );

    if (!updated) {
      throw new AppError({
        statusCode: 404,
        code: errorCodes.cashflowEntryNotFound,
        message: "Cashflow entry not found.",
      });
    }

    await tx.auditLog.create({
      data: {
        restaurantId: params.businessContext.restaurantId,
        userId: params.actor.id,
        action: "UPDATE",
        entityType: "CashflowEntry",
        entityId: updated.id,
        changes: {
          from: existing.status,
          to: updated.status,
          voidedAt: updated.voidedAt?.toISOString() ?? null,
        },
      },
    });

    return toCashflowEntryDto(updated);
  });
}
