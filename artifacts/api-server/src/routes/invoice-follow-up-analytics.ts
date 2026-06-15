import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { ALL_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();
const EXPORT_LIMIT = 5_000;

const FOLLOW_UP_STATUSES = [
  "CONTACTED",
  "WAITING_RESPONSE",
  "PROMISED_PAYMENT",
  "RESOLVED",
  "ESCALATED",
] as const;

type InvoiceFollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

type FollowUpAnalyticsRow = {
  id: string;
  businessId: string;
  invoiceId: string;
  status: InvoiceFollowUpStatus;
  note: string;
  nextFollowUpAt: Date | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  invoiceNumber: string;
  customerName: string;
  invoiceStatus: string;
  dueDate: Date | null;
  grandTotal: number;
};

function isPlannedInvoiceMode(businessMode: string) {
  return businessMode === "custom-business";
}

function getPlannedReason(businessMode: string) {
  if (!isPlannedInvoiceMode(businessMode)) return null;
  return "Service/custom business invoice follow-up analytics are planned and not operational yet.";
}

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function mapFollowUp(row: FollowUpAnalyticsRow) {
  return {
    id: row.id,
    businessId: row.businessId,
    invoiceId: row.invoiceId,
    invoiceNumber: row.invoiceNumber,
    customerName: row.customerName,
    invoiceStatus: row.invoiceStatus,
    dueDate: row.dueDate?.toISOString() ?? null,
    grandTotal: Number(row.grandTotal ?? 0),
    status: row.status,
    note: row.note,
    nextFollowUpAt: row.nextFollowUpAt?.toISOString() ?? null,
    createdById: row.createdById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildStatusBuckets(rows: FollowUpAnalyticsRow[]) {
  return FOLLOW_UP_STATUSES.map((status) => {
    const matchingRows = rows.filter((row) => row.status === status);
    return {
      status,
      label: status
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
      count: matchingRows.length,
      invoiceValue: matchingRows.reduce((total, row) => total + Number(row.grandTotal ?? 0), 0),
    };
  });
}

function buildAnalytics(latestRows: FollowUpAnalyticsRow[], allRows: FollowUpAnalyticsRow[]) {
  const now = new Date();
  const unresolvedRows = latestRows.filter((row) => row.status !== "RESOLVED");
  const resolvedRows = latestRows.filter((row) => row.status === "RESOLVED");
  const dueRows = unresolvedRows.filter((row) => row.nextFollowUpAt && row.nextFollowUpAt <= now);
  const upcomingRows = unresolvedRows.filter((row) => row.nextFollowUpAt && row.nextFollowUpAt > now);
  const noNextRows = unresolvedRows.filter((row) => !row.nextFollowUpAt);
  const lastUpdatedAt = allRows.reduce<Date | null>((latest, row) => {
    if (!latest || row.updatedAt > latest) return row.updatedAt;
    return latest;
  }, null);

  return {
    summary: {
      trackedInvoicesCount: latestRows.length,
      totalFollowUps: allRows.length,
      unresolvedCount: unresolvedRows.length,
      resolvedCount: resolvedRows.length,
      dueReminderCount: dueRows.length,
      upcomingReminderCount: upcomingRows.length,
      noNextFollowUpCount: noNextRows.length,
      contactedCount: latestRows.filter((row) => row.status === "CONTACTED").length,
      waitingResponseCount: latestRows.filter((row) => row.status === "WAITING_RESPONSE").length,
      promisedPaymentCount: latestRows.filter((row) => row.status === "PROMISED_PAYMENT").length,
      escalatedCount: latestRows.filter((row) => row.status === "ESCALATED").length,
      totalTrackedValue: latestRows.reduce((total, row) => total + Number(row.grandTotal ?? 0), 0),
      unresolvedValue: unresolvedRows.reduce((total, row) => total + Number(row.grandTotal ?? 0), 0),
      dueValue: dueRows.reduce((total, row) => total + Number(row.grandTotal ?? 0), 0),
      lastUpdatedAt: lastUpdatedAt?.toISOString() ?? null,
    },
    statusBuckets: buildStatusBuckets(latestRows),
    recentActivity: allRows.slice(0, 10).map(mapFollowUp),
  };
}

function followUpRowsToCsv(rows: FollowUpAnalyticsRow[]) {
  const header = [
    "Invoice Number",
    "Customer",
    "Invoice Status",
    "Due Date",
    "Grand Total",
    "Follow-Up Status",
    "Note",
    "Next Follow-Up At",
    "Created At",
    "Updated At",
  ];

  const csvRows = rows.map((row) => [
    row.invoiceNumber,
    row.customerName,
    row.invoiceStatus,
    row.dueDate,
    row.grandTotal,
    row.status,
    row.note,
    row.nextFollowUpAt,
    row.createdAt,
    row.updatedAt,
  ]);

  return [header, ...csvRows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

async function ensureInvoiceFollowUpTable() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "InvoiceFollowUp" (
      "id" TEXT PRIMARY KEY,
      "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
      "invoiceId" TEXT NOT NULL REFERENCES "Invoice"("id") ON DELETE CASCADE,
      "status" TEXT NOT NULL DEFAULT 'CONTACTED',
      "note" TEXT NOT NULL,
      "nextFollowUpAt" TIMESTAMPTZ NULL,
      "createdById" TEXT NULL REFERENCES "User"("id") ON DELETE SET NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "InvoiceFollowUp_businessId_idx" ON "InvoiceFollowUp"("businessId")`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "InvoiceFollowUp_invoiceId_idx" ON "InvoiceFollowUp"("invoiceId")`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "InvoiceFollowUp_status_idx" ON "InvoiceFollowUp"("status")`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "InvoiceFollowUp_nextFollowUpAt_idx" ON "InvoiceFollowUp"("nextFollowUpAt")`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "InvoiceFollowUp_businessId_invoiceId_idx" ON "InvoiceFollowUp"("businessId", "invoiceId")`;
}

async function getAllFollowUps(businessId: string, limit = EXPORT_LIMIT) {
  return prisma.$queryRaw<FollowUpAnalyticsRow[]>`
    SELECT
      f."id",
      f."businessId",
      f."invoiceId",
      f."status",
      f."note",
      f."nextFollowUpAt",
      f."createdById",
      f."createdAt",
      f."updatedAt",
      i."invoiceNumber",
      i."customerName",
      i."status" AS "invoiceStatus",
      i."dueDate",
      i."grandTotal"
    FROM "InvoiceFollowUp" f
    INNER JOIN "Invoice" i ON i."id" = f."invoiceId"
    WHERE f."businessId" = ${businessId}
      AND i."businessId" = ${businessId}
    ORDER BY f."updatedAt" DESC
    LIMIT ${limit}
  `;
}

async function getLatestFollowUps(businessId: string) {
  return prisma.$queryRaw<FollowUpAnalyticsRow[]>`
    SELECT DISTINCT ON (f."invoiceId")
      f."id",
      f."businessId",
      f."invoiceId",
      f."status",
      f."note",
      f."nextFollowUpAt",
      f."createdById",
      f."createdAt",
      f."updatedAt",
      i."invoiceNumber",
      i."customerName",
      i."status" AS "invoiceStatus",
      i."dueDate",
      i."grandTotal"
    FROM "InvoiceFollowUp" f
    INNER JOIN "Invoice" i ON i."id" = f."invoiceId"
    WHERE f."businessId" = ${businessId}
      AND i."businessId" = ${businessId}
    ORDER BY f."invoiceId", f."createdAt" DESC
  `;
}

router.get("/invoice-follow-up-analytics", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const plannedReason = getPlannedReason(businessContext.businessMode);
    if (plannedReason) {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.forbidden,
        message: plannedReason,
      });
    }

    await ensureInvoiceFollowUpTable();

    const [latestRows, allRows] = await Promise.all([
      getLatestFollowUps(businessContext.businessId),
      getAllFollowUps(businessContext.businessId, 100),
    ]);

    return successResponse(res, {
      data: buildAnalytics(latestRows, allRows),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/invoice-follow-ups/export", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const plannedReason = getPlannedReason(businessContext.businessMode);
    if (plannedReason) {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.forbidden,
        message: plannedReason,
      });
    }

    const format = getText(req.query.format).toLowerCase() || "csv";
    if (format !== "csv" && format !== "json") {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Export format must be csv or json.",
      });
    }

    await ensureInvoiceFollowUpTable();
    const rows = await getAllFollowUps(businessContext.businessId, EXPORT_LIMIT);

    if (format === "json") {
      return successResponse(res, {
        data: {
          rows: rows.map(mapFollowUp),
          meta: {
            exportedAt: new Date().toISOString(),
            rowCount: rows.length,
            limit: EXPORT_LIMIT,
          },
        },
      });
    }

    const csv = followUpRowsToCsv(rows);
    const filename = `invoice-follow-ups-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
    res.setHeader("X-Exported-At", new Date().toISOString());
    res.setHeader("X-Row-Count", String(rows.length));
    return res.status(200).send(csv);
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
