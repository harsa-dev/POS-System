import type { BusinessContext } from "../../lib/business-context/business-context.types.js";
import { prisma } from "../../lib/prisma.js";
import { requireCashflowView } from "./cashflow.permissions.js";
import type {
  CashflowActor,
  CashflowReconciliationDto,
  CashflowReconciliationIssue,
  CashflowSourceType,
} from "./cashflow.types.js";

type CountRow = { count: number };
type LastSyncedRow = { lastSyncedAt: Date | null };
type SourceIssueRow = {
  severity: "info" | "warning" | "critical";
  sourceType: string;
  sourceId: string | null;
  message: string;
};

function normalizeIssue(row: SourceIssueRow): CashflowReconciliationIssue {
  return {
    severity: row.severity,
    sourceType: row.sourceType as CashflowSourceType,
    sourceId: row.sourceId,
    message: row.message,
  };
}

async function countUnsyncedPaidOrders(businessId: string) {
  const rows = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::int AS "count"
    FROM "Order" o
    LEFT JOIN "Payment" p ON p."orderId" = o."id"
    LEFT JOIN "CashflowEntry" c
      ON c."businessId" = o."businessId"
      AND c."sourceType" = 'ORDER_PAYMENT'
      AND c."sourceId" = o."id"
      AND c."status" != 'VOIDED'
    WHERE o."businessId" = ${businessId}
      AND o."status" != 'PENDING_PAYMENT'
      AND o."status" != 'CANCELLED'
      AND (p."id" IS NULL OR p."status" = 'PAID')
      AND c."id" IS NULL;
  `;

  return rows[0]?.count ?? 0;
}

async function countUnsyncedClosedShifts(businessId: string) {
  const rows = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::int AS "count"
    FROM "Shift" s
    LEFT JOIN "CashflowEntry" c
      ON c."businessId" = s."businessId"
      AND c."sourceType" = 'SHIFT_CLOSE'
      AND c."sourceId" = s."id"
      AND c."status" != 'VOIDED'
    WHERE s."businessId" = ${businessId}
      AND s."status" = 'CLOSED'
      AND s."closedAt" IS NOT NULL
      AND c."id" IS NULL;
  `;

  return rows[0]?.count ?? 0;
}

async function countDuplicateSources(businessId: string) {
  const rows = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::int AS "count"
    FROM (
      SELECT "sourceType", "sourceId"
      FROM "CashflowEntry"
      WHERE "businessId" = ${businessId}
        AND "sourceId" IS NOT NULL
        AND "status" != 'VOIDED'
      GROUP BY "sourceType", "sourceId"
      HAVING COUNT(*) > 1
    ) duplicate_sources;
  `;

  return rows[0]?.count ?? 0;
}

async function countEntriesByStatus(businessId: string, status: "PENDING" | "VOIDED") {
  const rows = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::int AS "count"
    FROM "CashflowEntry"
    WHERE "businessId" = ${businessId}
      AND "status" = ${status}::"CashflowEntryStatus";
  `;

  return rows[0]?.count ?? 0;
}

async function getLastSyncedAt(businessId: string) {
  const rows = await prisma.$queryRaw<LastSyncedRow[]>`
    SELECT MAX("createdAt") AS "lastSyncedAt"
    FROM "CashflowEntry"
    WHERE "businessId" = ${businessId}
      AND "sourceType" IN ('ORDER_PAYMENT', 'SHIFT_CLOSE', 'PAYMENT_WEBHOOK', 'INVOICE');
  `;

  return rows[0]?.lastSyncedAt ?? null;
}

async function listUnsyncedPaidOrderIssues(businessId: string) {
  return prisma.$queryRaw<SourceIssueRow[]>`
    SELECT
      'warning'::text AS "severity",
      'ORDER_PAYMENT'::text AS "sourceType",
      o."id"::text AS "sourceId",
      ('Paid order #' || o."orderNumber"::text || ' has not been synced to cashflow.')::text AS "message"
    FROM "Order" o
    LEFT JOIN "Payment" p ON p."orderId" = o."id"
    LEFT JOIN "CashflowEntry" c
      ON c."businessId" = o."businessId"
      AND c."sourceType" = 'ORDER_PAYMENT'
      AND c."sourceId" = o."id"
      AND c."status" != 'VOIDED'
    WHERE o."businessId" = ${businessId}
      AND o."status" != 'PENDING_PAYMENT'
      AND o."status" != 'CANCELLED'
      AND (p."id" IS NULL OR p."status" = 'PAID')
      AND c."id" IS NULL
    ORDER BY o."createdAt" DESC
    LIMIT 10;
  `;
}

async function listUnsyncedClosedShiftIssues(businessId: string) {
  return prisma.$queryRaw<SourceIssueRow[]>`
    SELECT
      'warning'::text AS "severity",
      'SHIFT_CLOSE'::text AS "sourceType",
      s."id"::text AS "sourceId",
      ('Closed shift ' || s."id"::text || ' has not been synced to cashflow.')::text AS "message"
    FROM "Shift" s
    LEFT JOIN "CashflowEntry" c
      ON c."businessId" = s."businessId"
      AND c."sourceType" = 'SHIFT_CLOSE'
      AND c."sourceId" = s."id"
      AND c."status" != 'VOIDED'
    WHERE s."businessId" = ${businessId}
      AND s."status" = 'CLOSED'
      AND s."closedAt" IS NOT NULL
      AND c."id" IS NULL
    ORDER BY s."closedAt" DESC
    LIMIT 10;
  `;
}

async function listDuplicateSourceIssues(businessId: string) {
  return prisma.$queryRaw<SourceIssueRow[]>`
    SELECT
      'critical'::text AS "severity",
      duplicate_sources."sourceType"::text AS "sourceType",
      duplicate_sources."sourceId"::text AS "sourceId",
      ('Duplicate active cashflow source detected for ' || duplicate_sources."sourceType"::text || ':' || duplicate_sources."sourceId"::text || '.')::text AS "message"
    FROM (
      SELECT "sourceType", "sourceId", MAX("createdAt") AS "latestCreatedAt"
      FROM "CashflowEntry"
      WHERE "businessId" = ${businessId}
        AND "sourceId" IS NOT NULL
        AND "status" != 'VOIDED'
      GROUP BY "sourceType", "sourceId"
      HAVING COUNT(*) > 1
    ) duplicate_sources
    ORDER BY duplicate_sources."latestCreatedAt" DESC
    LIMIT 10;
  `;
}

async function listPendingEntryIssues(businessId: string) {
  return prisma.$queryRaw<SourceIssueRow[]>`
    SELECT
      'info'::text AS "severity",
      ce."sourceType"::text AS "sourceType",
      ce."id"::text AS "sourceId",
      ('Pending cashflow entry in ' || ce."category" || ' still needs posting.')::text AS "message"
    FROM "CashflowEntry" ce
    WHERE ce."businessId" = ${businessId}
      AND ce."status" = 'PENDING'
    ORDER BY ce."occurredAt" DESC
    LIMIT 10;
  `;
}

export async function getCashflowReconciliation(params: {
  actor: CashflowActor;
  businessContext: BusinessContext;
}): Promise<CashflowReconciliationDto> {
  requireCashflowView(params.actor.role);

  const businessId = params.businessContext.businessId;
  const [
    unsyncedPaidOrders,
    unsyncedClosedShifts,
    duplicateSourceWarnings,
    pendingEntries,
    voidedEntries,
    lastSyncedAt,
    paidOrderIssues,
    closedShiftIssues,
    duplicateIssues,
    pendingIssues,
  ] = await Promise.all([
    countUnsyncedPaidOrders(businessId),
    countUnsyncedClosedShifts(businessId),
    countDuplicateSources(businessId),
    countEntriesByStatus(businessId, "PENDING"),
    countEntriesByStatus(businessId, "VOIDED"),
    getLastSyncedAt(businessId),
    listUnsyncedPaidOrderIssues(businessId),
    listUnsyncedClosedShiftIssues(businessId),
    listDuplicateSourceIssues(businessId),
    listPendingEntryIssues(businessId),
  ]);

  return {
    unsyncedPaidOrders,
    unsyncedClosedShifts,
    duplicateSourceWarnings,
    pendingEntries,
    voidedEntries,
    lastSyncedAt: lastSyncedAt?.toISOString() ?? null,
    issues: [
      ...duplicateIssues.map(normalizeIssue),
      ...paidOrderIssues.map(normalizeIssue),
      ...closedShiftIssues.map(normalizeIssue),
      ...pendingIssues.map(normalizeIssue),
    ].slice(0, 30),
  };
}
