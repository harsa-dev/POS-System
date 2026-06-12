import { Prisma, type PrismaClient } from "@prisma/client";

import type { CashflowRowInput, ReceivableInput } from "./financial-reports.dto.js";
import type { FinancialReportQuery } from "./financial-reports.types.js";

type Db = PrismaClient | Prisma.TransactionClient;
type Money = bigint | number | null | undefined;
type CountRow = { count: number };
type RevenueRow = { totalRevenue: Money; orderCount: number };
type FlowRow = { cashIn: Money; cashOut: Money; entryCount: number; pendingCount: number; voidedCount: number };
type CogsRow = { cogs: Money; stockMovementCount: number; missingCostSnapshotCount: number };
type ReceivableRow = { receivables: Money; invoiceCount: number };

export type TrendRow = { period: Date; revenue?: number; cogs?: number; expenses?: number; cashIn?: number; cashOut?: number };
export type BestSellerRow = { menuItemId: string; label: string; quantity: number; revenue: number };
export type SourceHealthRow = {
  cashflowEntries: number;
  paidOrders: number;
  invoices: number;
  stockMovements: number;
  ordersWithoutCashflow: number;
  stockMovementsMissingCostSnapshot: number;
  pendingCashflowEntries: number;
  voidedCashflowEntries: number;
};

function n(value: Money) {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  return 0;
}

export async function getRevenueSummary(db: Db, restaurantId: string, query: FinancialReportQuery) {
  const rows = await db.$queryRaw<RevenueRow[]>`
    SELECT COALESCE(SUM("total"), 0)::bigint AS "totalRevenue", COUNT(*)::int AS "orderCount"
    FROM "Order"
    WHERE "restaurantId" = ${restaurantId}
      AND "createdAt" >= ${query.from}
      AND "createdAt" <= ${query.to}
      AND "status"::text IN ('PAID', 'PREPARING', 'READY', 'SERVED', 'COMPLETED');
  `;
  return { totalRevenue: n(rows[0]?.totalRevenue), orderCount: rows[0]?.orderCount ?? 0 };
}

export async function getCashflowSummary(db: Db, restaurantId: string, query: FinancialReportQuery) {
  const rows = await db.$queryRaw<FlowRow[]>`
    SELECT
      COALESCE(SUM(CASE WHEN "status" = 'POSTED' AND "type" IN ('INCOME', 'TRANSFER_IN') THEN "amount" ELSE 0 END), 0)::bigint AS "cashIn",
      COALESCE(SUM(CASE WHEN "status" = 'POSTED' AND "type" IN ('EXPENSE', 'TRANSFER_OUT') THEN "amount" ELSE 0 END), 0)::bigint AS "cashOut",
      COUNT(*)::int AS "entryCount",
      COUNT(*) FILTER (WHERE "status" = 'PENDING')::int AS "pendingCount",
      COUNT(*) FILTER (WHERE "status" = 'VOIDED')::int AS "voidedCount"
    FROM "CashflowEntry"
    WHERE "restaurantId" = ${restaurantId}
      AND "occurredAt" >= ${query.from}
      AND "occurredAt" <= ${query.to};
  `;
  return {
    cashIn: n(rows[0]?.cashIn),
    cashOut: n(rows[0]?.cashOut),
    entryCount: rows[0]?.entryCount ?? 0,
    pendingCount: rows[0]?.pendingCount ?? 0,
    voidedCount: rows[0]?.voidedCount ?? 0,
  };
}

export async function getCogsSummary(db: Db, restaurantId: string, query: FinancialReportQuery) {
  const rows = await db.$queryRaw<CogsRow[]>`
    SELECT
      COALESCE(ROUND(SUM(ABS(sm."quantity") * COALESCE(sm."unitCostSnapshot", ii."costPerUnit", 0))), 0)::bigint AS "cogs",
      COUNT(*)::int AS "stockMovementCount",
      COUNT(*) FILTER (WHERE sm."unitCostSnapshot" IS NULL OR sm."unitCostSnapshot" <= 0)::int AS "missingCostSnapshotCount"
    FROM "StockMovement" sm
    LEFT JOIN "InventoryItem" ii ON ii."id" = sm."inventoryItemId"
    WHERE COALESCE(sm."restaurantId", ii."restaurantId") = ${restaurantId}
      AND sm."createdAt" >= ${query.from}
      AND sm."createdAt" <= ${query.to}
      AND sm."type" = 'OUT'
      AND (sm."reason"::text = 'RECIPE_USAGE' OR sm."sourceType"::text IN ('ORDER', 'RECIPE'));
  `;
  return {
    cogs: n(rows[0]?.cogs),
    stockMovementCount: rows[0]?.stockMovementCount ?? 0,
    missingCostSnapshotCount: rows[0]?.missingCostSnapshotCount ?? 0,
  };
}

export async function getReceivableSummary(db: Db, restaurantId: string, query: FinancialReportQuery) {
  const rows = await db.$queryRaw<ReceivableRow[]>`
    SELECT COALESCE(SUM("grandTotal"), 0)::bigint AS "receivables", COUNT(*)::int AS "invoiceCount"
    FROM "Invoice"
    WHERE "restaurantId" = ${restaurantId}
      AND "invoiceDate" >= ${query.from}
      AND "invoiceDate" <= ${query.to}
      AND "status" IN ('DRAFT', 'SENT');
  `;
  return { receivables: n(rows[0]?.receivables), invoiceCount: rows[0]?.invoiceCount ?? 0 };
}

export async function getRevenueTrend(db: Db, restaurantId: string, query: FinancialReportQuery): Promise<TrendRow[]> {
  const rows = await db.$queryRaw<Array<{ period: Date; revenue: Money }>>`
    SELECT date_trunc('month', "createdAt") AS "period", COALESCE(SUM("total"), 0)::bigint AS "revenue"
    FROM "Order"
    WHERE "restaurantId" = ${restaurantId} AND "createdAt" >= ${query.from} AND "createdAt" <= ${query.to} AND "status"::text IN ('PAID', 'PREPARING', 'READY', 'SERVED', 'COMPLETED')
    GROUP BY 1 ORDER BY 1 ASC;
  `;
  return rows.map((row) => ({ period: row.period, revenue: n(row.revenue) }));
}

export async function getCogsTrend(db: Db, restaurantId: string, query: FinancialReportQuery): Promise<TrendRow[]> {
  const rows = await db.$queryRaw<Array<{ period: Date; cogs: Money }>>`
    SELECT date_trunc('month', sm."createdAt") AS "period", COALESCE(ROUND(SUM(ABS(sm."quantity") * COALESCE(sm."unitCostSnapshot", ii."costPerUnit", 0))), 0)::bigint AS "cogs"
    FROM "StockMovement" sm
    LEFT JOIN "InventoryItem" ii ON ii."id" = sm."inventoryItemId"
    WHERE COALESCE(sm."restaurantId", ii."restaurantId") = ${restaurantId} AND sm."createdAt" >= ${query.from} AND sm."createdAt" <= ${query.to}
      AND sm."type" = 'OUT' AND (sm."reason"::text = 'RECIPE_USAGE' OR sm."sourceType"::text IN ('ORDER', 'RECIPE'))
    GROUP BY 1 ORDER BY 1 ASC;
  `;
  return rows.map((row) => ({ period: row.period, cogs: n(row.cogs) }));
}

export async function getCashflowTrend(db: Db, restaurantId: string, query: FinancialReportQuery): Promise<TrendRow[]> {
  const rows = await db.$queryRaw<Array<{ period: Date; cashIn: Money; cashOut: Money }>>`
    SELECT date_trunc('month', "occurredAt") AS "period",
      COALESCE(SUM(CASE WHEN "status" = 'POSTED' AND "type" IN ('INCOME', 'TRANSFER_IN') THEN "amount" ELSE 0 END), 0)::bigint AS "cashIn",
      COALESCE(SUM(CASE WHEN "status" = 'POSTED' AND "type" IN ('EXPENSE', 'TRANSFER_OUT') THEN "amount" ELSE 0 END), 0)::bigint AS "cashOut"
    FROM "CashflowEntry"
    WHERE "restaurantId" = ${restaurantId} AND "occurredAt" >= ${query.from} AND "occurredAt" <= ${query.to}
    GROUP BY 1 ORDER BY 1 ASC;
  `;
  return rows.map((row) => ({ period: row.period, cashIn: n(row.cashIn), cashOut: n(row.cashOut), expenses: n(row.cashOut) }));
}

export async function getBestSellingProducts(db: Db, restaurantId: string, query: FinancialReportQuery): Promise<BestSellerRow[]> {
  const rows = await db.$queryRaw<Array<{ menuItemId: string; label: string; quantity: number; revenue: Money }>>`
    SELECT oi."menuItemId" AS "menuItemId", COALESCE(mi."name", 'Unknown Item') AS "label", COALESCE(SUM(oi."quantity"), 0)::int AS "quantity", COALESCE(SUM(oi."subtotal"), 0)::bigint AS "revenue"
    FROM "OrderItem" oi
    INNER JOIN "Order" o ON o."id" = oi."orderId"
    LEFT JOIN "MenuItem" mi ON mi."id" = oi."menuItemId"
    WHERE o."restaurantId" = ${restaurantId} AND o."createdAt" >= ${query.from} AND o."createdAt" <= ${query.to} AND o."status"::text IN ('PAID', 'PREPARING', 'READY', 'SERVED', 'COMPLETED')
    GROUP BY oi."menuItemId", mi."name"
    ORDER BY "quantity" DESC, "revenue" DESC
    LIMIT 10;
  `;
  return rows.map((row) => ({ ...row, revenue: n(row.revenue) }));
}

export async function listCashflowRowsForReport(db: Db, restaurantId: string, query: FinancialReportQuery, direction: "in" | "out") {
  const typeFilter = direction === "in" ? Prisma.sql`AND "type" IN ('INCOME', 'TRANSFER_IN')` : Prisma.sql`AND "type" IN ('EXPENSE', 'TRANSFER_OUT')`;
  const rows = await db.$queryRaw<Array<Omit<CashflowRowInput, "amount"> & { amount: Money }>>`
    SELECT "id", "occurredAt", "account"::text AS "account", "type"::text AS "type", "category", "counterpartyName", "description", "amount"::bigint AS "amount", "status"::text AS "status", "sourceType"::text AS "sourceType", "sourceId"
    FROM "CashflowEntry"
    WHERE "restaurantId" = ${restaurantId} AND "occurredAt" >= ${query.from} AND "occurredAt" <= ${query.to} AND "status" = 'POSTED' ${typeFilter}
    ORDER BY "occurredAt" DESC, "createdAt" DESC
    LIMIT 50;
  `;
  return rows.map((row) => ({ ...row, amount: n(row.amount) }));
}

export async function listReceivablesForReport(db: Db, restaurantId: string, query: FinancialReportQuery) {
  const rows = await db.$queryRaw<Array<Omit<ReceivableInput, "amount"> & { amount: Money }>>`
    SELECT "id", "invoiceNumber", "invoiceDate", "dueDate", "customerName", "status"::text AS "status", "grandTotal"::bigint AS "amount"
    FROM "Invoice"
    WHERE "restaurantId" = ${restaurantId} AND "invoiceDate" >= ${query.from} AND "invoiceDate" <= ${query.to} AND "status" IN ('DRAFT', 'SENT')
    ORDER BY "dueDate" ASC NULLS LAST, "invoiceDate" DESC
    LIMIT 50;
  `;
  return rows.map((row) => ({ ...row, amount: n(row.amount) }));
}

export async function getFinancialSourceHealth(db: Db, restaurantId: string, query: FinancialReportQuery): Promise<SourceHealthRow> {
  const [flow, revenue, receivable, cogs, unsyncedOrders] = await Promise.all([
    getCashflowSummary(db, restaurantId, query),
    getRevenueSummary(db, restaurantId, query),
    getReceivableSummary(db, restaurantId, query),
    getCogsSummary(db, restaurantId, query),
    db.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::int AS "count"
      FROM "Order" o
      LEFT JOIN "CashflowEntry" cf ON cf."restaurantId" = o."restaurantId" AND cf."sourceType"::text = 'ORDER_PAYMENT' AND cf."sourceId" = o."id" AND cf."status" != 'VOIDED'
      WHERE o."restaurantId" = ${restaurantId} AND o."createdAt" >= ${query.from} AND o."createdAt" <= ${query.to} AND o."status"::text IN ('PAID', 'PREPARING', 'READY', 'SERVED', 'COMPLETED') AND cf."id" IS NULL;
    `,
  ]);

  return {
    cashflowEntries: flow.entryCount,
    paidOrders: revenue.orderCount,
    invoices: receivable.invoiceCount,
    stockMovements: cogs.stockMovementCount,
    ordersWithoutCashflow: unsyncedOrders[0]?.count ?? 0,
    stockMovementsMissingCostSnapshot: cogs.missingCostSnapshotCount,
    pendingCashflowEntries: flow.pendingCount,
    voidedCashflowEntries: flow.voidedCount,
  };
}
