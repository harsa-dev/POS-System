import { Prisma } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { createBusinessScopeWhere, requireBusinessContextForUser } from "../lib/business-context/index.js";
import { MANAGEMENT_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();
const DEFAULT_LIMIT = 500;
const EXPORT_LIMIT = 5_000;

type ShiftReportStatus = "OPEN" | "CLOSED";
type ShiftReportSyncStatus = "SYNCED" | "UNSYNCED";
type ShiftReportDateRange = "Today" | "This Week" | "This Month" | "Custom Range";

type ShiftWithRelations = Prisma.ShiftGetPayload<{
  include: {
    user: { select: { name: true; email: true } };
    orders: { select: { id: true; total: true; paymentMethod: true; status: true } };
  };
}>;

function parseDate(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date;
}

function parseLimit(value: unknown, fallback = DEFAULT_LIMIT) {
  if (typeof value !== "string" && typeof value !== "number") return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;

  return Math.min(Math.floor(parsed), EXPORT_LIMIT);
}

function parseFormat(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) return "csv";
  return value.trim().toLowerCase();
}

function parseStatus(value: unknown): ShiftReportStatus | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toUpperCase();

  if (normalized === "ACTIVE" || normalized === "OPEN") return "OPEN";
  if (normalized === "COMPLETED" || normalized === "CLOSED") return "CLOSED";

  return undefined;
}

function parseSyncStatus(value: unknown): ShiftReportSyncStatus | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toUpperCase().replace(/[\s_-]/g, "");

  if (normalized === "SYNCED") return "SYNCED";
  if (normalized === "UNSYNCED" || normalized === "NOTSYNCED") return "UNSYNCED";

  return undefined;
}

function parseDateRange(value: unknown): ShiftReportDateRange | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();

  if (
    normalized === "Today" ||
    normalized === "This Week" ||
    normalized === "This Month" ||
    normalized === "Custom Range"
  ) {
    return normalized;
  }

  return undefined;
}

function getDateRangeBounds(dateRange?: ShiftReportDateRange) {
  if (!dateRange || dateRange === "Custom Range") return {};

  const now = new Date();
  const from = new Date(now);
  const to = new Date(now);

  if (dateRange === "Today") {
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  if (dateRange === "This Week") {
    from.setDate(now.getDate() - now.getDay());
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  from.setDate(1);
  from.setHours(0, 0, 0, 0);
  to.setMonth(now.getMonth() + 1, 0);
  to.setHours(23, 59, 59, 999);

  return { from, to };
}

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function isCountedOrder(order: { status: string }) {
  return order.status !== "CANCELLED" && order.status !== "PENDING_PAYMENT";
}

function isCashOrder(order: { paymentMethod: string; status: string }) {
  return order.paymentMethod === "CASH" && isCountedOrder(order);
}

function getCashStatus(cashDifference: number) {
  if (cashDifference === 0) return "Cash Balanced";
  if (cashDifference > 0) return "Cash Over";
  return "Cash Short";
}

function getShiftCashierName(shift: ShiftWithRelations) {
  return shift.user?.name ?? shift.user?.email ?? "Unknown Cashier";
}

function getShiftSummary(shift: ShiftWithRelations, syncedShiftIds: Set<string>) {
  const countedOrders = shift.orders.filter(isCountedOrder);
  const cashOrders = shift.orders.filter(isCashOrder);
  const totalSales = countedOrders.reduce((sum, order) => sum + order.total, 0);
  const cashSales = cashOrders.reduce((sum, order) => sum + order.total, 0);
  const cashDifference = shift.cashDifference ?? 0;
  const endingCash = shift.closingCash ?? shift.expectedCash;
  const cashflowSynced = syncedShiftIds.has(shift.id);

  return {
    totalSales,
    cashSales,
    transactionCount: countedOrders.length,
    cashTransactionCount: cashOrders.length,
    cashOut: Math.max(0, -cashDifference),
    endingCash,
    cashDifference,
    cashStatus: getCashStatus(cashDifference),
    cashflowSynced,
    syncStatus: cashflowSynced ? "Synced" : "Not Synced",
  };
}

function mapShiftForReport(shift: ShiftWithRelations, syncedShiftIds: Set<string>) {
  const summary = getShiftSummary(shift, syncedShiftIds);

  return {
    ...shift,
    cashflowSynced: summary.cashflowSynced,
    report: {
      cashierName: getShiftCashierName(shift),
      businessScope: "Current Business",
      statusLabel: shift.status === "CLOSED" ? "Completed" : "Active",
      ...summary,
    },
  };
}

function summarizeReportRows(rows: ReturnType<typeof mapShiftForReport>[]) {
  return {
    totalShifts: rows.length,
    openShifts: rows.filter((shift) => shift.status === "OPEN").length,
    closedShifts: rows.filter((shift) => shift.status === "CLOSED").length,
    syncedShifts: rows.filter((shift) => shift.cashflowSynced).length,
    unsyncedClosedShifts: rows.filter(
      (shift) => shift.status === "CLOSED" && !shift.cashflowSynced,
    ).length,
    totalSales: rows.reduce((sum, shift) => sum + shift.report.totalSales, 0),
    cashSales: rows.reduce((sum, shift) => sum + shift.report.cashSales, 0),
    netCashDifference: rows.reduce((sum, shift) => sum + shift.report.cashDifference, 0),
  };
}

function reportRowsToCsv(rows: ReturnType<typeof mapShiftForReport>[]) {
  const header = [
    "Shift ID",
    "Cashier",
    "Status",
    "Opened At",
    "Closed At",
    "Opening Cash",
    "Closing Cash",
    "Expected Cash",
    "Cash Difference",
    "Cash Status",
    "Total Sales",
    "Cash Sales",
    "Transactions",
    "Cash Transactions",
    "Cashflow Sync Status",
  ];

  const csvRows = rows.map((shift) => [
    shift.id,
    shift.report.cashierName,
    shift.report.statusLabel,
    shift.openedAt.toISOString(),
    shift.closedAt?.toISOString() ?? "",
    shift.openingCash,
    shift.closingCash ?? "",
    shift.expectedCash,
    shift.report.cashDifference,
    shift.report.cashStatus,
    shift.report.totalSales,
    shift.report.cashSales,
    shift.report.transactionCount,
    shift.report.cashTransactionCount,
    shift.report.syncStatus,
  ]);

  return [header, ...csvRows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

async function listReportRows(params: {
  businessId: string;
  where: Prisma.ShiftWhereInput;
  cashier?: string;
  syncStatus?: ShiftReportSyncStatus;
  limit?: number;
}) {
  const limit = params.limit ?? DEFAULT_LIMIT;
  const shifts = await prisma.shift.findMany({
    where: params.where,
    include: {
      user: { select: { name: true, email: true } },
      orders: { select: { id: true, total: true, paymentMethod: true, status: true } },
    },
    orderBy: { openedAt: "desc" },
    take: limit,
  });

  const shiftIds = shifts.map((shift) => shift.id);
  const syncedRows = shiftIds.length
    ? await prisma.$queryRaw<Array<{ sourceId: string }>>`
        SELECT "sourceId"
        FROM "CashflowEntry"
        WHERE "businessId" = ${params.businessId}
          AND "sourceType" = CAST('SHIFT_CLOSE' AS "CashflowSourceType")
          AND "status" != CAST('VOIDED' AS "CashflowEntryStatus")
          AND "sourceId" IN (${Prisma.join(shiftIds)})
      `
    : [];

  const syncedShiftIds = new Set(syncedRows.map((row) => row.sourceId));
  const cashierNeedle = params.cashier?.trim().toLowerCase();

  return shifts
    .filter((shift) => {
      if (!cashierNeedle || cashierNeedle === "all") return true;

      const cashierName = getShiftCashierName(shift).toLowerCase();
      const cashierEmail = shift.user?.email?.toLowerCase() ?? "";
      return cashierName === cashierNeedle || cashierEmail === cashierNeedle;
    })
    .map((shift) => mapShiftForReport(shift, syncedShiftIds))
    .filter((shift) => {
      if (!params.syncStatus) return true;
      if (params.syncStatus === "SYNCED") return shift.cashflowSynced;
      return !shift.cashflowSynced;
    });
}

function buildShiftWhere(params: {
  businessContext: Awaited<ReturnType<typeof requireBusinessContextForUser>>;
  status?: ShiftReportStatus;
  from?: Date;
  to?: Date;
  dateRange?: ShiftReportDateRange;
}) {
  const dateRangeBounds = getDateRangeBounds(params.dateRange);
  const from = params.from ?? dateRangeBounds.from;
  const to = params.to ?? dateRangeBounds.to;
  const where: Prisma.ShiftWhereInput = {
    ...createBusinessScopeWhere(params.businessContext),
  };

  if (params.status) {
    where.status = params.status;
  }

  if (from || to) {
    where.openedAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }

  return where;
}

function getReportQuery(req: { query: Record<string, unknown> }) {
  const dateRange = parseDateRange(req.query.dateRange);

  return {
    status: parseStatus(req.query.status),
    cashier: typeof req.query.cashier === "string" ? req.query.cashier : undefined,
    syncStatus: parseSyncStatus(req.query.syncStatus),
    dateRange,
    from: parseDate(req.query.from),
    to: parseDate(req.query.to),
    limit: parseLimit(req.query.limit),
  };
}

router.get("/cashier-shift-reports", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const query = getReportQuery(req);
    const rows = await listReportRows({
      businessId: businessContext.businessId,
      where: buildShiftWhere({
        businessContext,
        status: query.status,
        from: query.from,
        to: query.to,
        dateRange: query.dateRange,
      }),
      cashier: query.cashier,
      syncStatus: query.syncStatus,
      limit: query.limit,
    });

    return successResponse(res, {
      data: {
        generatedAt: new Date().toISOString(),
        filters: {
          status: query.status ?? null,
          cashier: query.cashier ?? null,
          syncStatus: query.syncStatus ?? null,
          dateRange: query.dateRange ?? null,
          from: query.from?.toISOString() ?? null,
          to: query.to?.toISOString() ?? null,
          limit: query.limit,
        },
        summary: summarizeReportRows(rows),
        rows,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/cashier-shift-reports/export", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const format = parseFormat(req.query.format);
    if (format !== "csv" && format !== "json") {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Cashier shift report export format must be csv or json.",
      });
    }

    const query = getReportQuery(req);
    const rows = await listReportRows({
      businessId: businessContext.businessId,
      where: buildShiftWhere({
        businessContext,
        status: query.status,
        from: query.from,
        to: query.to,
        dateRange: query.dateRange,
      }),
      cashier: query.cashier,
      syncStatus: query.syncStatus,
      limit: EXPORT_LIMIT,
    });

    const exportedAt = new Date().toISOString();

    if (format === "json") {
      return successResponse(res, {
        data: {
          rows,
          meta: {
            exportedAt,
            rowCount: rows.length,
            limit: EXPORT_LIMIT,
            filters: {
              status: query.status ?? null,
              cashier: query.cashier ?? null,
              syncStatus: query.syncStatus ?? null,
              dateRange: query.dateRange ?? null,
              from: query.from?.toISOString() ?? null,
              to: query.to?.toISOString() ?? null,
            },
          },
        },
      });
    }

    const csv = reportRowsToCsv(rows);
    const filename = `cashier-shift-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
    res.setHeader("X-Exported-At", exportedAt);
    res.setHeader("X-Row-Count", String(rows.length));
    return res.status(200).send(csv);
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
