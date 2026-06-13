import { InvoiceDiscountType, InvoiceStatus, Prisma } from "@prisma/client";
import type { Invoice, InvoiceItem } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { POS_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

type InvoiceLineInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type ValidInvoiceInput = {
  invoiceNumber?: string;
  invoiceDate: Date;
  dueDate: Date | null;
  status: InvoiceStatus;
  businessName: string;
  businessEmail: string | null;
  businessPhone: string | null;
  businessAddress: string | null;
  customerName: string;
  customerPhone: string | null;
  customerAddress: string | null;
  notes: string | null;
  discountType: InvoiceDiscountType;
  discountValue: number;
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  items: InvoiceLineInput[];
};

type InvoiceWithItems = Invoice & { items: InvoiceItem[] };

class InvoiceInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvoiceInputError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalText(value: unknown) {
  const text = getText(value);
  return text ? text : null;
}

function getFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function parseDate(value: unknown, field: string, fallback?: Date) {
  const text = getText(value);
  if (!text && fallback) return fallback;
  if (!text) throw new InvoiceInputError(`${field} is required`);

  const date = new Date(text);
  if (!Number.isFinite(date.getTime())) {
    throw new InvoiceInputError(`${field} must be a valid date`);
  }

  return date;
}

function parseInvoiceStatus(value: unknown) {
  const status = getText(value).toUpperCase();
  if (status === "DRAFT") return InvoiceStatus.DRAFT;
  if (status === "SENT") return InvoiceStatus.SENT;
  if (status === "PAID") return InvoiceStatus.PAID;
  if (status === "CANCELLED") return InvoiceStatus.CANCELLED;
  if (!status) return InvoiceStatus.DRAFT;
  throw new InvoiceInputError("Invoice status is invalid");
}

function parseDiscountType(value: unknown) {
  const discountType = getText(value).toUpperCase();
  if (discountType === "PERCENTAGE" || discountType === "PERCENT") return InvoiceDiscountType.PERCENTAGE;
  if (discountType === "FIXED" || discountType === "AMOUNT") return InvoiceDiscountType.FIXED;
  if (!discountType) return InvoiceDiscountType.PERCENTAGE;
  throw new InvoiceInputError("Discount type is invalid");
}

function validateItems(value: unknown): InvoiceLineInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new InvoiceInputError("At least one invoice item is required");
  }

  return value.map((rawItem, index) => {
    if (!isRecord(rawItem)) throw new InvoiceInputError(`Item ${index + 1} is invalid`);

    const description = getText(rawItem.description);
    const quantity = getFiniteNumber(rawItem.quantity);
    const unitPrice = getFiniteNumber(rawItem.unitPrice);

    if (!description) throw new InvoiceInputError(`Item ${index + 1} description is required`);
    if (quantity === null || quantity <= 0) throw new InvoiceInputError(`Item ${index + 1} quantity must be greater than 0`);
    if (unitPrice === null || unitPrice < 0) throw new InvoiceInputError(`Item ${index + 1} unit price must be 0 or more`);

    const roundedUnitPrice = Math.round(unitPrice);
    return {
      description,
      quantity,
      unitPrice: roundedUnitPrice,
      lineTotal: Math.round(quantity * roundedUnitPrice),
    };
  });
}

function calculateDiscountAmount(discountType: InvoiceDiscountType, discountValue: number, subtotal: number) {
  if (discountValue < 0) throw new InvoiceInputError("Discount value must be 0 or more");
  if (discountType === InvoiceDiscountType.PERCENTAGE) {
    if (discountValue > 100) throw new InvoiceInputError("Percentage discount must be between 0 and 100");
    return Math.round(subtotal * (discountValue / 100));
  }
  if (discountValue > subtotal) throw new InvoiceInputError("Fixed discount cannot exceed subtotal");
  return Math.round(discountValue);
}

function validateInvoiceInput(body: unknown, fallbackBusinessName: string): ValidInvoiceInput {
  if (!isRecord(body)) throw new InvoiceInputError("Invoice payload is required");

  const business = optionalRecord(body.business);
  const customer = optionalRecord(body.customer);
  const billing = optionalRecord(body.billing);
  const discount = optionalRecord(body.discount);
  const items = validateItems(body.items);
  const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
  const discountType = parseDiscountType(discount.type ?? discount.mode);
  const discountValue = getFiniteNumber(discount.value) ?? 0;
  const discountAmount = calculateDiscountAmount(discountType, discountValue, subtotal);
  const grandTotal = Math.max(subtotal - discountAmount, 0);
  const customerName = getText(customer.name);

  if (!customerName) throw new InvoiceInputError("Customer name is required");

  return {
    invoiceNumber: getOptionalText(billing.invoiceNumber) ?? undefined,
    invoiceDate: parseDate(billing.invoiceDate, "Invoice date", new Date()),
    dueDate: getOptionalText(billing.dueDate) ? parseDate(billing.dueDate, "Due date") : null,
    status: parseInvoiceStatus(body.status),
    businessName: getText(business.name) || fallbackBusinessName,
    businessEmail: getOptionalText(business.email),
    businessPhone: getOptionalText(business.phone),
    businessAddress: getOptionalText(business.address),
    customerName,
    customerPhone: getOptionalText(customer.phone),
    customerAddress: getOptionalText(customer.address),
    notes: getOptionalText(body.notes),
    discountType,
    discountValue,
    subtotal,
    discountAmount,
    grandTotal,
    items,
  };
}

function getDateKey(date = new Date()) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

async function generateInvoiceNumber(businessId: string) {
  const dateKey = getDateKey();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  const existingToday = await prisma.invoice.count({
    where: { businessId, createdAt: { gte: startOfDay, lt: endOfDay } },
  });

  for (let attempt = 1; attempt <= 25; attempt += 1) {
    const invoiceNumber = `INV-${dateKey}-${String(existingToday + attempt).padStart(4, "0")}`;
    const existing = await prisma.invoice.findUnique({
      where: { businessId_invoiceNumber: { businessId, invoiceNumber } },
    });
    if (!existing) return invoiceNumber;
  }

  return `INV-${dateKey}-${String(Date.now()).slice(-6)}`;
}

async function resolveInvoiceNumber(params: {
  businessId: string;
  requestedInvoiceNumber?: string;
  existingInvoiceId?: string;
}) {
  if (!params.requestedInvoiceNumber) return generateInvoiceNumber(params.businessId);
  const existing = await prisma.invoice.findUnique({
    where: {
      businessId_invoiceNumber: {
        businessId: params.businessId,
        invoiceNumber: params.requestedInvoiceNumber,
      },
    },
  });
  if (existing && existing.id !== params.existingInvoiceId) {
    throw new InvoiceInputError("Invoice number is already used");
  }
  return params.requestedInvoiceNumber;
}

function invoiceItemOrderBy() {
  return { id: "asc" } satisfies Prisma.InvoiceItemOrderByWithRelationInput;
}

function invoiceResponse(invoice: InvoiceWithItems) {
  return invoice;
}

function baseInvoiceData(input: ValidInvoiceInput, businessId: string, invoiceNumber: string) {
  return {
    businessId,
    invoiceNumber,
    invoiceDate: input.invoiceDate,
    dueDate: input.dueDate,
    status: input.status,
    businessName: input.businessName,
    businessEmail: input.businessEmail,
    businessPhone: input.businessPhone,
    businessAddress: input.businessAddress,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerAddress: input.customerAddress,
    notes: input.notes,
    discountType: input.discountType,
    discountValue: input.discountValue,
    subtotal: input.subtotal,
    discountAmount: input.discountAmount,
    grandTotal: input.grandTotal,
    cancelledAt: input.status === InvoiceStatus.CANCELLED ? new Date() : null,
  };
}

router.get("/invoices", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    const invoices = await prisma.invoice.findMany({
      where: { businessId: businessContext.businessId },
      include: { items: { orderBy: invoiceItemOrderBy() } },
      orderBy: { updatedAt: "desc" },
    });
    return successResponse(res, { data: invoices.map(invoiceResponse) });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/invoices/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, businessId: businessContext.businessId },
      include: { items: { orderBy: invoiceItemOrderBy() } },
    });
    if (!invoice) {
      return errorResponse(res, { status: 404, code: errorCodes.notFound, message: "Invoice not found." });
    }
    return successResponse(res, { data: invoiceResponse(invoice) });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/invoices", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    const input = validateInvoiceInput(req.body, businessContext.businessName);
    const invoiceNumber = await resolveInvoiceNumber({ businessId: businessContext.businessId, requestedInvoiceNumber: input.invoiceNumber });
    const invoice = await prisma.invoice.create({
      data: {
        ...baseInvoiceData(input, businessContext.businessId, invoiceNumber),
        items: { create: input.items },
      },
      include: { items: { orderBy: invoiceItemOrderBy() } },
    });
    return successResponse(res, { status: 201, data: invoiceResponse(invoice), message: "Invoice created." });
  } catch (error) {
    if (error instanceof InvoiceInputError) {
      return errorResponse(res, { status: 400, code: errorCodes.validationError, message: error.message });
    }
    return handleApiError(res, error);
  }
});

router.patch("/invoices/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    const existing = await prisma.invoice.findFirst({ where: { id: req.params.id, businessId: businessContext.businessId } });
    if (!existing) {
      return errorResponse(res, { status: 404, code: errorCodes.notFound, message: "Invoice not found." });
    }
    const input = validateInvoiceInput(req.body, businessContext.businessName);
    const invoiceNumber = await resolveInvoiceNumber({
      businessId: businessContext.businessId,
      requestedInvoiceNumber: input.invoiceNumber ?? existing.invoiceNumber,
      existingInvoiceId: existing.id,
    });
    const invoice = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: existing.id } });
      return tx.invoice.update({
        where: { id: existing.id },
        data: {
          ...baseInvoiceData(input, businessContext.businessId, invoiceNumber),
          items: { create: input.items },
        },
        include: { items: { orderBy: invoiceItemOrderBy() } },
      });
    });
    return successResponse(res, { data: invoiceResponse(invoice), message: "Invoice updated." });
  } catch (error) {
    if (error instanceof InvoiceInputError) {
      return errorResponse(res, { status: 400, code: errorCodes.validationError, message: error.message });
    }
    return handleApiError(res, error);
  }
});

router.delete("/invoices/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, businessId: businessContext.businessId } });
    if (!invoice) {
      return errorResponse(res, { status: 404, code: errorCodes.notFound, message: "Invoice not found." });
    }
    const deleted = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: InvoiceStatus.CANCELLED, cancelledAt: new Date() },
      include: { items: { orderBy: invoiceItemOrderBy() } },
    });
    return successResponse(res, { data: invoiceResponse(deleted), message: "Invoice cancelled." });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
