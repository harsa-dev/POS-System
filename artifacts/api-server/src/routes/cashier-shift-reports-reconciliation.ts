import { Prisma } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { createBusinessScopeWhere, requireBusinessContextForUser } from "../lib/business-context/index.js";
import { MANAGEMENT_ROLES } from "../lib/constants.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import {
  listLatestShiftSyncAttempts,
  type ShiftSyncAttemptLogRecord,
} from "../lib/shift-sync-attempt-log.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;
const CASH_VARIANCE_REVIEW_THRESHOLD = 0.01;

type ShiftSyncState = "SYNCED" | "READY_TO_SYNC" | "NEEDS_REVIEW" | "BLOCKED_OPEN" | "SYNC_FAILED";

type ShiftWithRelations = Prisma.ShiftGetPayload<{
  include: {
    user: { select: { name: true; email: true } };
    orders: { select: { id: true; total: true; paymentMethod: true; status: true } };
  };
}>;

function parseLimit(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return DEFAULT_LIMIT;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;

  return Math.min(Math.floor(parsed), MAX_LIMIT);
}

function parseDate(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date;
}

function isCountedOrder(order: { status: string }) {
  return order.status !== "CANCELLED" && order.status !== "PENDING_PAYMENT";
}

function isCashOrder(order: { paymentMethod: string; status: string }) {
  return order.paymentMethod === "CASH" && isCountedOrder(order);
}

function getCashierName(shift: ShiftWithRelations) {
  return shift.user?.name ?? shift.user?.email ?? "Unknown Cashier";
}

function getCashStatus(cashDifference: number) {
  if (cashDifference === 0) return "Cash Balanced";
  if (cashDifference > 0) return "Cash Over";
  return "Cash Short";
}

function getSyncState(params: {
  shift: ShiftWithRelations;
  syncedShiftIds: Set<string>;
  cashDifference: number;
  latestAttempt?: ShiftSyncAttemptLogRecord;
}): ShiftSyncState {
  if (params.syncedShiftIds.has(params.shift.id)) return "SYNCED";
  if (params.latestAttempt?.status === "FAILED") return "SYNC_FAILED";
  if (params.shift.status === "OPEN") return "BLOCKED_OPEN";
  if (Math.abs(params.cashDifference) > CASH_VARIANCE_REVIEW_THRESHOLD) return "NEEDS_REVIEW";
  return "READY_TO_SYNC";
}

function getRecommendedAction(syncState: ShiftSyncState) {
  if (syncState === "SYNCED") return "No action required";
  if (syncState === "BLOCKED_OPEN") return "Close shift before syncing";
  if (syncState === "SYNC_FAILED") return "Inspect the latest sync error, then retry";
  if (syncState === "NEEDS_REVIEW") return "Review cash variance, then sync or investigate";
  return "Sync shift to cashflow";
}

function mapLatestAttempt(attempt?: ShiftSyncAttemptLogRecord) {
  if (!attempt) return null;

  return {
    id: attempt.id,
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    errorCode: attempt.errorCode,
    errorMessage: attempt.errorMessage,
    cashflowEntryId: attempt.cashflowEntryId,
    actorId: attempt.actorId,
    actorRole: attempt.actorRole,
    createdAt: attempt.createdAt.toISOString(),
    updatedAt: attempt.updatedAt.toISOString(),
  };
}

function mapShiftForReconciliation(
  shift: ShiftWithRelations,
  syncedShiftIds: Set<string>,
  latestAttempts: Map<string, ShiftSyncAttemptLogRecord>,
) {
  const countedOrders = shift.orders.filter(isCountedOrder);
  const cashOrders = shift.orders.filter(isCashOrder);
  const totalSales = countedOrders.reduce((sum, order) => sum + order.total, 0);
  const cashSales = cashOrders.reduce((sum, order) => sum + order.total, 0);
  const cashDifference = shift.cashDifference ?? 0;
  const latestAttempt = latestAttempts.get(shift.id);
  const syncState = getSyncState({ shift, syncedShiftIds, cashDifference, latestAttempt });

  return {
    shiftId: shift.id,
    cashierName: getCashierName(shift),
    cashierEmail: shift.user?.email ?? null,
    status: shift.status,
    openedAt: shift.openedAt.toISOString(),
    closedAt: shift.closedAt?.toISOString() ?? null,
    totalSales,
    cashSales,
    transactionCount: countedOrders.length,
    cashTransactionCount: cashOrders.length,
    expectedCash: shift.expectedCash,
    closingCash: shift.closingCash,
    cashDifference,
    cashStatus: getCashStatus(cashDifference),
    cashflowSynced: syncState === "SYNCED",
    syncState,
    latestSyncAttempt: mapLatestAttempt(latestAttempt),
    recommendedAction: getRecommendedAction(syncState),
  };
}

function summarizeRows(rows: ReturnType<typeof mapShiftForReconciliation>[]) {
  return {
    totalShifts: rows.length,
    syncedCount: rows.filter((row) => row.syncState === "SYNCED").length,
    readyToSyncCount: rows.filter((row) => row.syncState === "READY_TO_SYNC").length,
    needsReviewCount: rows.filter((row) => row.syncState === "NEEDS_REVIEW").length,
    failedSyncCount: rows.filter((row) => row.syncState === "SYNC_FAILED").length,
    blockedOpenCount: rows.filter((row) => row.syncState === "BLOCKED_OPEN").length,
    unsyncedClosedCount: rows.filter(
      (row) => row.status === "CLOSED" && row.syncState !== "SYNCED",
    ).length,
    totalCashVariance: rows.reduce((sum, row) => sum + row.cashDifference, 0),
    absoluteCashVariance: rows.reduce((sum, row) => sum + Math.abs(row.cashDifference), 0),
  };
}

router.get("/cashier-shift-reports/reconciliation", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const limit = parseLimit(req.query.limit);
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);

    const where: Prisma.ShiftWhereInput = {
      ...createBusinessScopeWhere(businessContext),
    };

    if (from || to) {
      where.openedAt = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        orders: { select: { id: true, total: true, paymentMethod: true, status: true } },
      },
      orderBy: { openedAt: "desc" },
      take: limit,
    });

    const shiftIds = shifts.map((shift) => shift.id);
    const [syncedRows, latestAttempts] = await Promise.all([
      shiftIds.length
        ? prisma.$queryRaw<Array<{ sourceId: string }>>`
            SELECT "sourceId"
            FROM "CashflowEntry"
            WHERE "businessId" = ${businessContext.businessId}
              AND "sourceType" = CAST('SHIFT_CLOSE' AS "CashflowSourceType")
              AND "status" != CAST('VOIDED' AS "CashflowEntryStatus")
              AND "sourceId" IN (${Prisma.join(shiftIds)})
          `
        : Promise.resolve([]),
      listLatestShiftSyncAttempts({
        businessId: businessContext.businessId,
        shiftIds,
      }),
    ]);

    const syncedShiftIds = new Set(syncedRows.map((row) => row.sourceId));
    const rows = shifts.map((shift) => mapShiftForReconciliation(shift, syncedShiftIds, latestAttempts));

    return successResponse(res, {
      data: {
        generatedAt: new Date().toISOString(),
        threshold: {
          cashVarianceReview: CASH_VARIANCE_REVIEW_THRESHOLD,
        },
        filters: {
          from: from?.toISOString() ?? null,
          to: to?.toISOString() ?? null,
          limit,
        },
        summary: summarizeRows(rows),
        rows,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
