import { randomUUID } from "node:crypto";

import { InvoiceStatus, Prisma } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { ALL_ROLES, MANAGEMENT_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();
const DAY_MS = 24 * 60 * 60 * 1000;

const FOLLOW_UP_STATUSES = [
  "CONTACTED",
  "WAITING_RESPONSE",
  "PROMISED_PAYMENT",
  "RESOLVED",
  "ESCALATED",
] as const;

type InvoiceFollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

type InvoiceFollowUpRow = {
  id: string;
  businessId: string;
  invoiceId: string;
  status: InvoiceFollowUpStatus;
  note: string;
  nextFollowUpAt: Date | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type LatestFollowUpRow = InvoiceFollowUpRow & {
  invoiceNumber: string;
};

type OverdueInvoiceRow = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  status: InvoiceStatus;
  dueDate: Date | null;
  grandTotal: number;
};

function isPlannedInvoiceMode(businessMode: string) {
  return businessMode === "custom-business";
}

function getPlannedReason(businessMode: string) {
  if (!isPlannedInvoiceMode(businessMode)) return null;
  return "Service/custom business invoice follow-up workflow is planned and not operational yet.";
}

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseFollowUpStatus(value: unknown): InvoiceFollowUpStatus {
  const text = getText(value).toUpperCase();
  if (FOLLOW_UP_STATUSES.includes(text as InvoiceFollowUpStatus)) {
    return text as InvoiceFollowUpStatus;
  }
  throw new Error("Invalid invoice follow-up status.");
}

function parseOptionalFollowUpAt(value: unknown) {
  const text = getText(value);
  if (!text) return null;
  const date = new Date(text);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("Invalid next follow-up date.");
  }
  return date;
}

function getDaysOverdue(dueDate: Date | null, now = new Date()) {
  if (!dueDate) return 0;
  return Math.max(1, Math.ceil((now.getTime() - dueDate.getTime()) / DAY_MS));
}

function mapFollowUp(row: InvoiceFollowUpRow | null) {
  if (!row) return null;
  return {
    id: row.id,
    businessId: row.businessId,
    invoiceId: row.invoiceId,
    status: row.status,
    note: row.note,
    nextFollowUpAt: row.nextFollowUpAt?.toISOString() ?? null,
    createdById: row.createdById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
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

async function requireInvoiceForBusiness(invoiceId: string, businessId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, businessId },
    select: {
      id: true,
      invoiceNumber: true,
      customerName: true,
      status: true,
      dueDate: true,
      grandTotal: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found for this business.");
  }

  return invoice;
}

async function getLatestFollowUpsByInvoice(businessId: string) {
  const rows = await prisma.$queryRaw<LatestFollowUpRow[]>`
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
      i."invoiceNumber"
    FROM "InvoiceFollowUp" f
    INNER JOIN "Invoice" i ON i."id" = f."invoiceId"
    WHERE f."businessId" = ${businessId}
    ORDER BY f."invoiceId", f."createdAt" DESC
  `;

  return new Map(rows.map((row) => [row.invoiceId, row]));
}

function buildFollowUpSummary(items: Array<{ latestFollowUp: ReturnType<typeof mapFollowUp> }>) {
  const statusCounts = FOLLOW_UP_STATUSES.reduce<Record<InvoiceFollowUpStatus, number>>((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as Record<InvoiceFollowUpStatus, number>);

  let withFollowUpCount = 0;
  let unresolvedCount = 0;

  for (const item of items) {
    const status = item.latestFollowUp?.status;
    if (!status) continue;
    withFollowUpCount += 1;
    statusCounts[status] += 1;
    if (status !== "RESOLVED") unresolvedCount += 1;
  }

  return {
    overdueCount: items.length,
    withFollowUpCount,
    withoutFollowUpCount: Math.max(0, items.length - withFollowUpCount),
    unresolvedCount,
    statusCounts,
  };
}

router.get("/invoice-follow-ups", async (req, res) => {
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

    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        businessId: businessContext.businessId,
        status: { in: [InvoiceStatus.DRAFT, InvoiceStatus.SENT] },
        dueDate: { not: null, lt: new Date() },
      },
      select: {
        id: true,
        invoiceNumber: true,
        customerName: true,
        status: true,
        dueDate: true,
        grandTotal: true,
      },
      orderBy: { dueDate: "asc" },
      take: 100,
    });

    const latestFollowUps = await getLatestFollowUpsByInvoice(businessContext.businessId);
    const items = overdueInvoices.map((invoice: OverdueInvoiceRow) => ({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        status: invoice.status,
        dueDate: invoice.dueDate?.toISOString() ?? null,
        daysOverdue: getDaysOverdue(invoice.dueDate),
        grandTotal: invoice.grandTotal ?? 0,
      },
      latestFollowUp: mapFollowUp(latestFollowUps.get(invoice.id) ?? null),
    }));

    return successResponse(res, {
      data: {
        items,
        summary: buildFollowUpSummary(items),
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/invoices/:id/follow-ups", async (req, res) => {
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
    await requireInvoiceForBusiness(req.params.id, businessContext.businessId);

    const rows = await prisma.$queryRaw<InvoiceFollowUpRow[]>`
      SELECT *
      FROM "InvoiceFollowUp"
      WHERE "businessId" = ${businessContext.businessId}
        AND "invoiceId" = ${req.params.id}
      ORDER BY "createdAt" DESC
    `;

    return successResponse(res, { data: rows.map(mapFollowUp) });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invoice not found")) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: error.message,
      });
    }
    return handleApiError(res, error);
  }
});

router.post("/invoices/:id/follow-ups", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
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
    await requireInvoiceForBusiness(req.params.id, businessContext.businessId);

    const status = parseFollowUpStatus(req.body?.status ?? "CONTACTED");
    const note = getText(req.body?.note);
    const nextFollowUpAt = parseOptionalFollowUpAt(req.body?.nextFollowUpAt);

    if (!note) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Follow-up note is required.",
      });
    }

    const [created] = await prisma.$queryRaw<InvoiceFollowUpRow[]>`
      INSERT INTO "InvoiceFollowUp" (
        "id",
        "businessId",
        "invoiceId",
        "status",
        "note",
        "nextFollowUpAt",
        "createdById",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${randomUUID()},
        ${businessContext.businessId},
        ${req.params.id},
        ${status},
        ${note},
        ${nextFollowUpAt},
        ${user.id},
        now(),
        now()
      )
      RETURNING *
    `;

    return successResponse(res, { status: 201, data: mapFollowUp(created) });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid")) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: error.message,
      });
    }
    if (error instanceof Error && error.message.includes("Invoice not found")) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: error.message,
      });
    }
    return handleApiError(res, error);
  }
});

router.patch("/invoice-follow-ups/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
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

    const status = parseFollowUpStatus(req.body?.status ?? "CONTACTED");
    const note = getText(req.body?.note);
    const nextFollowUpAt = parseOptionalFollowUpAt(req.body?.nextFollowUpAt);

    if (!note) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Follow-up note is required.",
      });
    }

    const rows = await prisma.$queryRaw<InvoiceFollowUpRow[]>`
      UPDATE "InvoiceFollowUp"
      SET
        "status" = ${status},
        "note" = ${note},
        "nextFollowUpAt" = ${nextFollowUpAt},
        "updatedAt" = now()
      WHERE "id" = ${req.params.id}
        AND "businessId" = ${businessContext.businessId}
      RETURNING *
    `;

    if (rows.length === 0) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Follow-up note not found for this business.",
      });
    }

    return successResponse(res, { data: mapFollowUp(rows[0]) });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid")) {
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
