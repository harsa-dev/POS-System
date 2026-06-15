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

type StatusBucket = {
  status: InvoiceStatus;
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

router.get("/invoices-summary", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const where = buildInvoiceSummaryWhere(req.query, businessContext.businessId);

    const [groupedRows, latestInvoice] = await Promise.all([
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
    ]);

    const buckets = getBucketMap(groupedRows);
    const draft = buckets.get(InvoiceStatus.DRAFT)!;
    const sent = buckets.get(InvoiceStatus.SENT)!;
    const paid = buckets.get(InvoiceStatus.PAID)!;
    const cancelled = buckets.get(InvoiceStatus.CANCELLED)!;

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
