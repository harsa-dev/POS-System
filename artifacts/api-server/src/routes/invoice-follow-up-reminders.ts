import { InvoiceStatus } from "@prisma/client";
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
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const REMINDER_SCOPES = ["due", "upcoming", "all"] as const;
type ReminderScope = (typeof REMINDER_SCOPES)[number];

type InvoiceFollowUpStatus =
  | "CONTACTED"
  | "WAITING_RESPONSE"
  | "PROMISED_PAYMENT"
  | "RESOLVED"
  | "ESCALATED";

type ReminderRow = {
  followUpId: string;
  businessId: string;
  invoiceId: string;
  followUpStatus: InvoiceFollowUpStatus;
  note: string;
  nextFollowUpAt: Date;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  invoiceNumber: string;
  customerName: string;
  invoiceStatus: InvoiceStatus;
  dueDate: Date | null;
  grandTotal: number;
};

function isPlannedInvoiceMode(businessMode: string) {
  return businessMode === "custom-business";
}

function getPlannedReason(businessMode: string) {
  if (!isPlannedInvoiceMode(businessMode)) return null;
  return "Service/custom business invoice follow-up reminder workflow is planned and not operational yet.";
}

function parseScope(value: unknown): ReminderScope {
  const text = typeof value === "string" ? value.toLowerCase().trim() : "due";
  if (REMINDER_SCOPES.includes(text as ReminderScope)) return text as ReminderScope;
  return "due";
}

function parseLimit(value: unknown) {
  if (typeof value !== "string") return DEFAULT_LIMIT;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.floor(parsed));
}

function getDaysOverdue(dueDate: Date | null, now = new Date()) {
  if (!dueDate) return 0;
  return Math.max(1, Math.ceil((now.getTime() - dueDate.getTime()) / DAY_MS));
}

function getReminderTiming(nextFollowUpAt: Date, now = new Date()) {
  const diffMs = nextFollowUpAt.getTime() - now.getTime();
  const isDue = diffMs <= 0;
  return {
    isDue,
    daysLate: isDue ? Math.max(0, Math.ceil(Math.abs(diffMs) / DAY_MS)) : 0,
    daysUntil: isDue ? 0 : Math.max(1, Math.ceil(diffMs / DAY_MS)),
  };
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

function mapReminder(row: ReminderRow, now = new Date()) {
  const timing = getReminderTiming(row.nextFollowUpAt, now);

  return {
    followUp: {
      id: row.followUpId,
      businessId: row.businessId,
      invoiceId: row.invoiceId,
      status: row.followUpStatus,
      note: row.note,
      nextFollowUpAt: row.nextFollowUpAt.toISOString(),
      createdById: row.createdById,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
    invoice: {
      id: row.invoiceId,
      invoiceNumber: row.invoiceNumber,
      customerName: row.customerName,
      status: row.invoiceStatus,
      dueDate: row.dueDate?.toISOString() ?? null,
      daysOverdue: getDaysOverdue(row.dueDate, now),
      grandTotal: row.grandTotal ?? 0,
    },
    reminder: {
      nextFollowUpAt: row.nextFollowUpAt.toISOString(),
      ...timing,
    },
  };
}

router.get("/invoice-follow-up-reminders", async (req, res) => {
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

    const scope = parseScope(req.query.scope);
    const limit = parseLimit(req.query.limit);
    const now = new Date();

    const rows = await prisma.$queryRaw<ReminderRow[]>`
      WITH latest AS (
        SELECT DISTINCT ON (f."invoiceId")
          f."id" AS "followUpId",
          f."businessId",
          f."invoiceId",
          f."status" AS "followUpStatus",
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
        WHERE f."businessId" = ${businessContext.businessId}
          AND f."nextFollowUpAt" IS NOT NULL
          AND f."status" <> 'RESOLVED'
          AND i."businessId" = ${businessContext.businessId}
          AND i."status" IN (${InvoiceStatus.DRAFT}, ${InvoiceStatus.SENT})
        ORDER BY f."invoiceId", f."createdAt" DESC
      )
      SELECT *
      FROM latest
      ORDER BY "nextFollowUpAt" ASC
    `;

    const mapped = rows.map((row) => mapReminder(row, now));
    const dueItems = mapped.filter((item) => item.reminder.isDue);
    const upcomingItems = mapped.filter((item) => !item.reminder.isDue);
    const scopedItems =
      scope === "due" ? dueItems : scope === "upcoming" ? upcomingItems : mapped;

    return successResponse(res, {
      data: {
        items: scopedItems.slice(0, limit),
        summary: {
          asOf: now.toISOString(),
          totalReminderCount: mapped.length,
          dueCount: dueItems.length,
          upcomingCount: upcomingItems.length,
          oldestDueDays: dueItems.reduce(
            (max, item) => Math.max(max, item.reminder.daysLate),
            0,
          ),
          nextUpcomingAt: upcomingItems[0]?.reminder.nextFollowUpAt ?? null,
        },
        scope,
        limit,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
