import { InvoiceStatus, Prisma } from "@prisma/client";
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

type StatusBucket = {
  status: InvoiceStatus;
  count: number;
  total: number;
};

type AgingBucketId = "1-7" | "8-30" | "31-60" | "61+";

type AgingBucket = {
  id: AgingBucketId;
  label: string;
  minDays: number;
  maxDays: number | null;
  count: number;
  total: number;
};

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseDateBoundary(value: unknown, endOfDay = false) {
  const text = getText(value);
  if (!text) return null;

  const date = new Date(text);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("Invalid invoice date filter.");
  }

  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date;
}

function buildInvoiceSummaryWhere(query: Record<string, unknown>, businessId: string): Prisma.InvoiceWhereInput {
  const search = getText(query.search ?? query.q);
  const from = parseDateBoundary(query.from);
  const to = parseDateBoundary(query.to, true);

  const where: Prisma.InvoiceWhereInput = { businessId };

  if (from || to) {
    where.invoiceDate = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search, mode: "insensitive" } },
      { customerAddress: { contains: search, mode: "insensitive" } },
      { businessName: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

function getBucketMap(rows: Array<{ status: InvoiceStatus; _count: { _all: number }; _sum: { grandTotal: number | null } }>) {
  const buckets = new Map<InvoiceStatus, StatusBucket>();

  for (const status of [InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.PAID, InvoiceStatus.CANCELLED]) {
    buckets.set(status, { status, count: 0, total: 0 });
  }

  for (const row of rows) {
    buckets.set(row.status, {
      status: row.status,
      count: row._count._all,
      total: row._sum.grandTotal ?? 0,
    });
  }

  return buckets;
}

function createEmptyAgingBuckets(): AgingBucket[] {
  return [
    { id: "1-7", label: "1-7 days overdue", minDays: 1, maxDays: 7, count: 0, total: 0 },
    { id: "8-30", label: "8-30 days overdue", minDays: 8, maxDays: 30, count: 0, total: 0 },
    { id: "31-60", label: "31-60 days overdue", minDays: 31, maxDays: 60, count: 0, total: 0 },
    { id: "61+", label: "61+ days overdue", minDays: 61, maxDays: null, count: 0, total: 0 },
  ];
}

function getAgingBucketId(daysOverdue: number): AgingBucketId {
  if (daysOverdue <= 7) return "1-7";
  if (daysOverdue <= 30) return "8-30";
  if (daysOverdue <= 60) return "31-60";
  return "61+";
}

function getDaysOverdue(dueDate: Date, now: Date) {
  return Math.max(1, Math.ceil((now.getTime() - dueDate.getTime()) / DAY_MS));
}

router.get("/invoices-summary", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const where = buildInvoiceSummaryWhere(req.query, businessContext.businessId);
    const now = new Date();

    const overdueWhere: Prisma.InvoiceWhereInput = {
      ...where,
      status: { in: [InvoiceStatus.DRAFT, InvoiceStatus.SENT] },
      dueDate: { not: null, lt: now },
    };

    const [groupedRows, latestInvoice, overdueInvoices] = await Promise.all([
      prisma.invoice.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
        _sum: { grandTotal: true },
      }),
      prisma.invoice.findFirst({
        where,
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      prisma.invoice.findMany({
        where: overdueWhere,
        select: {
          id: true,
          invoiceNumber: true,
          customerName: true,
          status: true,
          dueDate: true,
          grandTotal: true,
        },
        orderBy: { dueDate: "asc" },
        take: 10_000,
      }),
    ]);

    const buckets = getBucketMap(groupedRows);
    const draft = buckets.get(InvoiceStatus.DRAFT)!;
    const sent = buckets.get(InvoiceStatus.SENT)!;
    const paid = buckets.get(InvoiceStatus.PAID)!;
    const cancelled = buckets.get(InvoiceStatus.CANCELLED)!;
    const agingBuckets = createEmptyAgingBuckets();
    const agingBucketMap = new Map(agingBuckets.map((bucket) => [bucket.id, bucket]));

    let overdueValue = 0;
    let draftOverdueCount = 0;
    let draftOverdueValue = 0;
    let sentOverdueCount = 0;
    let sentOverdueValue = 0;
    let oldestOverdueDays = 0;

    for (const invoice of overdueInvoices) {
      if (!invoice.dueDate) continue;

      const daysOverdue = getDaysOverdue(invoice.dueDate, now);
      const amount = invoice.grandTotal ?? 0;
      const bucket = agingBucketMap.get(getAgingBucketId(daysOverdue));

      overdueValue += amount;
      oldestOverdueDays = Math.max(oldestOverdueDays, daysOverdue);

      if (invoice.status === InvoiceStatus.DRAFT) {
        draftOverdueCount += 1;
        draftOverdueValue += amount;
      }

      if (invoice.status === InvoiceStatus.SENT) {
        sentOverdueCount += 1;
        sentOverdueValue += amount;
      }

      if (bucket) {
        bucket.count += 1;
        bucket.total += amount;
      }
    }

    const totalCount = draft.count + sent.count + paid.count + cancelled.count;
    const totalValue = draft.total + sent.total + paid.total + cancelled.total;
    const receivable = draft.total + sent.total;

    return successResponse(res, {
      data: {
        buckets: Array.from(buckets.values()),
        totals: {
          totalCount,
          totalValue,
          receivable,
          paidRevenue: paid.total,
          cancelledValue: cancelled.total,
          draftValue: draft.total,
          sentValue: sent.total,
          overdueValue,
          currentReceivable: Math.max(0, receivable - overdueValue),
        },
        aging: {
          asOf: now.toISOString(),
          overdueCount: overdueInvoices.length,
          overdueValue,
          draftOverdueCount,
          draftOverdueValue,
          sentOverdueCount,
          sentOverdueValue,
          oldestOverdueDays,
          buckets: agingBuckets,
          samples: overdueInvoices.slice(0, 5).map((invoice) => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.customerName,
            status: invoice.status,
            dueDate: invoice.dueDate?.toISOString() ?? null,
            daysOverdue: invoice.dueDate ? getDaysOverdue(invoice.dueDate, now) : 0,
            grandTotal: invoice.grandTotal ?? 0,
          })),
        },
        lastUpdatedAt: latestInvoice?.updatedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid invoice")) {
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