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
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const EXPORT_LIMIT = 5000;

type InvoiceHistoryQuery = {
  where: Prisma.InvoiceWhereInput;
  page: number;
  limit: number;
};

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parsePositiveInteger(value: unknown, fallback: number, max: number) {
  const parsed = Number(getText(value));
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}

function parseInvoiceStatus(value: unknown) {
  const text = getText(value).toUpperCase();
  if (!text || text === "ALL") return null;
  if (text === "DRAFT") return InvoiceStatus.DRAFT;
  if (text === "SENT") return InvoiceStatus.SENT;
  if (text === "PAID") return InvoiceStatus.PAID;
  if (text === "CANCELLED") return InvoiceStatus.CANCELLED;
  throw new Error("Invalid invoice status filter.");
}

function parseBooleanFlag(value: unknown) {
  const text = getText(value).toLowerCase();
  return text === "true" || text === "1" || text === "yes";
}

function parseDateBoundary(value: unknown, endOfDay = false) {
  const text = getText(value);
  if (!text) return null;
  const date = new Date(text);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid invoice date filter.");
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date;
}

function buildInvoiceHistoryQuery(query: Record<string, unknown>, businessId: string): InvoiceHistoryQuery {
  const page = parsePositiveInteger(query.page, 1, 10_000);
  const limit = parsePositiveInteger(query.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const status = parseInvoiceStatus(query.status);
  const overdue = parseBooleanFlag(query.overdue);
  const search = getText(query.search ?? query.q);
  const from = parseDateBoundary(query.from);
  const to = parseDateBoundary(query.to, true);

  const where: Prisma.InvoiceWhereInput = { businessId };

  if (overdue) {
    if (status === InvoiceStatus.PAID || status === InvoiceStatus.CANCELLED) {
      throw new Error("Invalid invoice status filter for overdue invoices.");
    }

    where.status = status ?? { in: [InvoiceStatus.DRAFT, InvoiceStatus.SENT] };
    where.dueDate = { not: null, lt: new Date() };
  } else if (status) {
    where.status = status;
  }

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

  return { where, page, limit };
}

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function invoiceRowsToCsv(invoices: Array<{
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date | null;
  status: InvoiceStatus;
  customerName: string;
  customerPhone: string | null;
  customerAddress: string | null;
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  updatedAt: Date;
  cancelledAt: Date | null;
}>) {
  const header = [
    "Invoice Number",
    "Invoice Date",
    "Due Date",
    "Status",
    "Customer",
    "Customer Phone",
    "Customer Address",
    "Subtotal",
    "Discount Amount",
    "Grand Total",
    "Updated At",
    "Cancelled At",
  ];

  const rows = invoices.map((invoice) => [
    invoice.invoiceNumber,
    invoice.invoiceDate.toISOString(),
    invoice.dueDate?.toISOString() ?? "",
    invoice.status,
    invoice.customerName,
    invoice.customerPhone ?? "",
    invoice.customerAddress ?? "",
    invoice.subtotal,
    invoice.discountAmount,
    invoice.grandTotal,
    invoice.updatedAt.toISOString(),
    invoice.cancelledAt?.toISOString() ?? "",
  ]);

  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

router.get("/invoices/export", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const format = getText(req.query.format).toLowerCase() || "csv";
    if (format !== "csv" && format !== "json") {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Export format must be csv or json.",
      });
    }

    const { where } = buildInvoiceHistoryQuery(req.query, businessContext.businessId);
    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: EXPORT_LIMIT,
      include: { items: { orderBy: { id: "asc" } } },
    });

    if (format === "json") {
      return successResponse(res, {
        data: {
          rows: invoices,
          meta: {
            exportedAt: new Date().toISOString(),
            rowCount: invoices.length,
            limit: EXPORT_LIMIT,
          },
        },
      });
    }

    const csv = invoiceRowsToCsv(invoices);
    const filename = `invoice-history-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
    res.setHeader("X-Exported-At", new Date().toISOString());
    res.setHeader("X-Row-Count", String(invoices.length));
    return res.status(200).send(csv);
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

router.get("/invoices", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const { where, page, limit } = buildInvoiceHistoryQuery(req.query, businessContext.businessId);
    const [totalItems, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        include: { items: { orderBy: { id: "asc" } } },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return successResponse(res, {
      data: invoices,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(Math.ceil(totalItems / limit), 1),
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
