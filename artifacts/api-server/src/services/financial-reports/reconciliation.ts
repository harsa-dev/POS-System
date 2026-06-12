import { Prisma, type PrismaClient } from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/business-context.types.js";
import { prisma } from "../../lib/prisma.js";
import { requireFinancialReportView } from "./financial-reports.permissions.js";
import type {
  FinancialReportActor,
  FinancialReportQuery,
} from "./financial-reports.types.js";

type Db = PrismaClient | Prisma.TransactionClient;
type Money = bigint | number | null | undefined;

export type FinancialReconciliationIssueSeverity =
  | "info"
  | "warning"
  | "critical";

export type FinancialReconciliationIssueDto = {
  key: string;
  title: string;
  description: string;
  severity: FinancialReconciliationIssueSeverity;
  count: number;
};

export type FinancialReconciliationDetailRowDto = {
  id: string;
  date: string;
  sourceType: string;
  reference: string;
  description: string;
  amount: number;
  status: string;
};

export type FinancialReconciliationDto = {
  generatedAt: string;
  period: {
    from: string;
    to: string;
  };
  issues: FinancialReconciliationIssueDto[];
  unsyncedOrders: FinancialReconciliationDetailRowDto[];
  missingCostSnapshots: FinancialReconciliationDetailRowDto[];
  pendingCashflowEntries: FinancialReconciliationDetailRowDto[];
  voidedCashflowEntries: FinancialReconciliationDetailRowDto[];
  openReceivables: FinancialReconciliationDetailRowDto[];
};

type CountRow = {
  count: number;
};

type DetailRow = {
  id: string;
  date: Date;
  sourceType: string;
  reference: string | null;
  description: string | null;
  amount: Money;
  status: string;
};

function toNumber(value: Money) {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  return 0;
}

function toIsoDate(value: Date) {
  return value.toISOString();
}

function toDetailRow(row: DetailRow): FinancialReconciliationDetailRowDto {
  return {
    id: row.id,
    date: toIsoDate(row.date),
    sourceType: row.sourceType,
    reference: row.reference ?? "-",
    description: row.description ?? "-",
    amount: toNumber(row.amount),
    status: row.status,
  };
}

async function countUnsyncedOrders(
  db: Db,
  restaurantId: string,
  query: FinancialReportQuery,
) {
  const rows = await db.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::int AS "count"
    FROM "Order" o
    LEFT JOIN "CashflowEntry" cf
      ON cf."restaurantId" = o."restaurantId"
      AND cf."sourceType"::text = 'ORDER_PAYMENT'
      AND cf."sourceId" = o."id"
      AND cf."status" != 'VOIDED'
    WHERE o."restaurantId" = ${restaurantId}
      AND o."createdAt" >= ${query.from}
      AND o."createdAt" <= ${query.to}
      AND o."status"::text IN ('PAID', 'PREPARING', 'READY', 'SERVED', 'COMPLETED')
      AND cf."id" IS NULL;
  `;

  return rows[0]?.count ?? 0;
}

async function countMissingCostSnapshots(
  db: Db,
  restaurantId: string,
  query: FinancialReportQuery,
) {
  const rows = await db.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::int AS "count"
    FROM "StockMovement" sm
    LEFT JOIN "InventoryItem" ii ON ii."id" = sm."inventoryItemId"
    WHERE COALESCE(sm."restaurantId", ii."restaurantId") = ${restaurantId}
      AND sm."createdAt" >= ${query.from}
      AND sm."createdAt" <= ${query.to}
      AND sm."type" = 'OUT'
      AND (
        sm."reason"::text = 'RECIPE_USAGE'
        OR sm."sourceType"::text IN ('ORDER', 'RECIPE')
      )
      AND (
        sm."unitCostSnapshot" IS NULL
        OR sm."unitCostSnapshot" <= 0
      );
  `;

  return rows[0]?.count ?? 0;
}

async function countCashflowByStatus(
  db: Db,
  restaurantId: string,
  query: FinancialReportQuery,
  status: "PENDING" | "VOIDED",
) {
  const rows = await db.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::int AS "count"
    FROM "CashflowEntry"
    WHERE "restaurantId" = ${restaurantId}
      AND "occurredAt" >= ${query.from}
      AND "occurredAt" <= ${query.to}
      AND "status"::text = ${status};
  `;

  return rows[0]?.count ?? 0;
}

async function countOpenReceivables(
  db: Db,
  restaurantId: string,
  query: FinancialReportQuery,
) {
  const rows = await db.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::int AS "count"
    FROM "Invoice"
    WHERE "restaurantId" = ${restaurantId}
      AND "invoiceDate" >= ${query.from}
      AND "invoiceDate" <= ${query.to}
      AND "status"::text IN ('DRAFT', 'SENT')
      AND "grandTotal" > 0;
  `;

  return rows[0]?.count ?? 0;
}

async function countOverdueReceivables(
  db: Db,
  restaurantId: string,
  query: FinancialReportQuery,
) {
  const now = new Date();

  const rows = await db.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::int AS "count"
    FROM "Invoice"
    WHERE "restaurantId" = ${restaurantId}
      AND "invoiceDate" >= ${query.from}
      AND "invoiceDate" <= ${query.to}
      AND "status"::text IN ('DRAFT', 'SENT')
      AND "grandTotal" > 0
      AND "dueDate" IS NOT NULL
      AND "dueDate" < ${now};
  `;

  return rows[0]?.count ?? 0;
}

async function listUnsyncedOrders(
  db: Db,
  restaurantId: string,
  query: FinancialReportQuery,
) {
  const rows = await db.$queryRaw<DetailRow[]>`
    SELECT
      o."id" AS "id",
      o."createdAt" AS "date",
      'ORDER_PAYMENT' AS "sourceType",
      ('Order #' || o."orderNumber") AS "reference",
      ('Paid order without cashflow ledger entry') AS "description",
      o."total"::bigint AS "amount",
      o."status"::text AS "status"
    FROM "Order" o
    LEFT JOIN "CashflowEntry" cf
      ON cf."restaurantId" = o."restaurantId"
      AND cf."sourceType"::text = 'ORDER_PAYMENT'
      AND cf."sourceId" = o."id"
      AND cf."status" != 'VOIDED'
    WHERE o."restaurantId" = ${restaurantId}
      AND o."createdAt" >= ${query.from}
      AND o."createdAt" <= ${query.to}
      AND o."status"::text IN ('PAID', 'PREPARING', 'READY', 'SERVED', 'COMPLETED')
      AND cf."id" IS NULL
    ORDER BY o."createdAt" DESC
    LIMIT 50;
  `;

  return rows.map(toDetailRow);
}

async function listMissingCostSnapshots(
  db: Db,
  restaurantId: string,
  query: FinancialReportQuery,
) {
  const rows = await db.$queryRaw<DetailRow[]>`
    SELECT
      sm."id" AS "id",
      sm."createdAt" AS "date",
      COALESCE(sm."sourceType"::text, 'STOCK_MOVEMENT') AS "sourceType",
      COALESCE(ii."name", sm."inventoryItemId") AS "reference",
      COALESCE(sm."note", 'COGS stock movement without unit cost snapshot') AS "description",
      ROUND(ABS(sm."quantity") * COALESCE(ii."costPerUnit", 0))::bigint AS "amount",
      COALESCE(sm."reason"::text, sm."type"::text) AS "status"
    FROM "StockMovement" sm
    LEFT JOIN "InventoryItem" ii ON ii."id" = sm."inventoryItemId"
    WHERE COALESCE(sm."restaurantId", ii."restaurantId") = ${restaurantId}
      AND sm."createdAt" >= ${query.from}
      AND sm."createdAt" <= ${query.to}
      AND sm."type" = 'OUT'
      AND (
        sm."reason"::text = 'RECIPE_USAGE'
        OR sm."sourceType"::text IN ('ORDER', 'RECIPE')
      )
      AND (
        sm."unitCostSnapshot" IS NULL
        OR sm."unitCostSnapshot" <= 0
      )
    ORDER BY sm."createdAt" DESC
    LIMIT 50;
  `;

  return rows.map(toDetailRow);
}

async function listCashflowByStatus(
  db: Db,
  restaurantId: string,
  query: FinancialReportQuery,
  status: "PENDING" | "VOIDED",
) {
  const rows = await db.$queryRaw<DetailRow[]>`
    SELECT
      "id" AS "id",
      "occurredAt" AS "date",
      "sourceType"::text AS "sourceType",
      COALESCE("sourceId", "category") AS "reference",
      COALESCE("description", "category") AS "description",
      "amount"::bigint AS "amount",
      "status"::text AS "status"
    FROM "CashflowEntry"
    WHERE "restaurantId" = ${restaurantId}
      AND "occurredAt" >= ${query.from}
      AND "occurredAt" <= ${query.to}
      AND "status"::text = ${status}
    ORDER BY "occurredAt" DESC, "createdAt" DESC
    LIMIT 50;
  `;

  return rows.map(toDetailRow);
}

async function listOpenReceivables(
  db: Db,
  restaurantId: string,
  query: FinancialReportQuery,
) {
  const now = new Date();

  const rows = await db.$queryRaw<DetailRow[]>`
    SELECT
      "id" AS "id",
      "invoiceDate" AS "date",
      'INVOICE' AS "sourceType",
      "invoiceNumber" AS "reference",
      CASE
        WHEN "dueDate" IS NOT NULL AND "dueDate" < ${now}
          THEN 'Open invoice receivable is overdue'
        ELSE 'Open invoice receivable is not paid yet'
      END AS "description",
      "grandTotal"::bigint AS "amount",
      "status"::text AS "status"
    FROM "Invoice"
    WHERE "restaurantId" = ${restaurantId}
      AND "invoiceDate" >= ${query.from}
      AND "invoiceDate" <= ${query.to}
      AND "status"::text IN ('DRAFT', 'SENT')
      AND "grandTotal" > 0
    ORDER BY "dueDate" ASC NULLS LAST, "invoiceDate" DESC
    LIMIT 50;
  `;

  return rows.map(toDetailRow);
}

function buildIssues(input: {
  unsyncedOrderCount: number;
  missingCostSnapshotCount: number;
  pendingCashflowCount: number;
  voidedCashflowCount: number;
  openReceivableCount: number;
  overdueReceivableCount: number;
}): FinancialReconciliationIssueDto[] {
  const issues: FinancialReconciliationIssueDto[] = [];

  if (input.unsyncedOrderCount > 0) {
    issues.push({
      key: "orders_without_cashflow",
      title: "Paid orders without cashflow ledger",
      description:
        "Paid or operational orders exist without posted cashflow ledger entries.",
      severity: "critical",
      count: input.unsyncedOrderCount,
    });
  }

  if (input.missingCostSnapshotCount > 0) {
    issues.push({
      key: "missing_cost_snapshots",
      title: "COGS movements missing unit cost snapshot",
      description:
        "Some inventory movements used for COGS do not have unitCostSnapshot.",
      severity: "warning",
      count: input.missingCostSnapshotCount,
    });
  }

  if (input.pendingCashflowCount > 0) {
    issues.push({
      key: "pending_cashflow_entries",
      title: "Pending cashflow entries excluded from totals",
      description:
        "Pending ledger entries exist in the selected period and are excluded from posted totals.",
      severity: "info",
      count: input.pendingCashflowCount,
    });
  }

  if (input.voidedCashflowCount > 0) {
    issues.push({
      key: "voided_cashflow_entries",
      title: "Voided cashflow entries found",
      description:
        "Voided ledger entries exist in this period and are excluded from posted totals.",
      severity: "info",
      count: input.voidedCashflowCount,
    });
  }

  if (input.openReceivableCount > 0) {
    issues.push({
      key: "open_receivables",
      title: "Open invoice receivables found",
      description:
        "Draft or sent invoices still have unpaid receivable value in this period.",
      severity: "warning",
      count: input.openReceivableCount,
    });
  }

  if (input.overdueReceivableCount > 0) {
    issues.push({
      key: "overdue_receivables",
      title: "Overdue invoice receivables found",
      description:
        "Some open invoice receivables are past their due date and need follow-up.",
      severity: "critical",
      count: input.overdueReceivableCount,
    });
  }

  return issues;
}

export async function getFinancialReportReconciliation(params: {
  actor: FinancialReportActor;
  businessContext: BusinessContext;
  query: FinancialReportQuery;
}): Promise<FinancialReconciliationDto> {
  requireFinancialReportView(params.actor.role);

  const restaurantId = params.businessContext.restaurantId;

  const [
    unsyncedOrderCount,
    missingCostSnapshotCount,
    pendingCashflowCount,
    voidedCashflowCount,
    openReceivableCount,
    overdueReceivableCount,
    unsyncedOrders,
    missingCostSnapshots,
    pendingCashflowEntries,
    voidedCashflowEntries,
    openReceivables,
  ] = await Promise.all([
    countUnsyncedOrders(prisma, restaurantId, params.query),
    countMissingCostSnapshots(prisma, restaurantId, params.query),
    countCashflowByStatus(prisma, restaurantId, params.query, "PENDING"),
    countCashflowByStatus(prisma, restaurantId, params.query, "VOIDED"),
    countOpenReceivables(prisma, restaurantId, params.query),
    countOverdueReceivables(prisma, restaurantId, params.query),
    listUnsyncedOrders(prisma, restaurantId, params.query),
    listMissingCostSnapshots(prisma, restaurantId, params.query),
    listCashflowByStatus(prisma, restaurantId, params.query, "PENDING"),
    listCashflowByStatus(prisma, restaurantId, params.query, "VOIDED"),
    listOpenReceivables(prisma, restaurantId, params.query),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    period: {
      from: params.query.from.toISOString(),
      to: params.query.to.toISOString(),
    },
    issues: buildIssues({
      unsyncedOrderCount,
      missingCostSnapshotCount,
      pendingCashflowCount,
      voidedCashflowCount,
      openReceivableCount,
      overdueReceivableCount,
    }),
    unsyncedOrders,
    missingCostSnapshots,
    pendingCashflowEntries,
    voidedCashflowEntries,
    openReceivables,
  };
}
