import {
  InvoiceDiscountType,
  InvoiceStatus,
  Prisma,
  type Invoice,
  type InvoiceItem,
} from "@prisma/client";
import { Router } from "express";

import { getRestaurantForUser, requireRole } from "../lib/auth.js";
import { ERR, POS_ROLES } from "../lib/constants.js";
import { prisma } from "../lib/prisma.js";

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

type InvoiceWithItems = Invoice & {
  items: InvoiceItem[];
};

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
  if (discountType === "PERCENTAGE" || discountType === "PERCENT") {
    return InvoiceDiscountType.PERCENTAGE;
  }
  if (discountType === "FIXED" || discountType === "AMOUNT") {
    return InvoiceDiscountType.FIXED;
  }
  if (!discountType) return InvoiceDiscountType.PERCENTAGE;

  throw new InvoiceInputError("Discount type is invalid");
}

function calculateLineTotal(quantity: number, unitPrice: number) {
  return Math.round(quantity * unitPrice);
}

function validateItems(value: unknown): InvoiceLineInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new InvoiceInputError("At least one invoice item is required");
  }

  return value.map((rawItem, index) => {
    if (!isRecord(rawItem)) {
      throw new InvoiceInputError(`Item ${index + 1} is invalid`);
    }

    const description = getText(rawItem.description);
    if (!description) {
      throw new InvoiceInputError(`Item ${index + 1} description is required`);
    }

    const quantity = getFiniteNumber(rawItem.quantity);
    if (quantity === null || quantity <= 0) {
      throw new InvoiceInputError(
        `Item ${index + 1} quantity must be greater than 0`,
      );
    }

    const unitPrice = getFiniteNumber(rawItem.unitPrice);
    if (unitPrice === null || unitPrice < 0) {
      throw new InvoiceInputError(
        `Item ${index + 1} unit price must be 0 or more`,
      );
    }

    const roundedUnitPrice = Math.round(unitPrice);

    return {
      description,
      quantity,
      unitPrice: roundedUnitPrice,
      lineTotal: calculateLineTotal(quantity, roundedUnitPrice),
    };
  });
}

function calculateDiscountAmount(
  discountType: InvoiceDiscountType,
  discountValue: number,
  subtotal: number,
) {
  if (discountValue < 0) {
    throw new InvoiceInputError("Discount value must be 0 or more");
  }

  if (discountType === InvoiceDiscountType.PERCENTAGE) {
    if (discountValue > 100) {
      throw new InvoiceInputError("Percentage discount must be between 0 and 100");
    }

    return Math.round(subtotal * (discountValue / 100));
  }

  if (discountValue > subtotal) {
    throw new InvoiceInputError("Fixed discount cannot exceed subtotal");
  }

  return Math.round(discountValue);
}

function validateInvoiceInput(body: unknown, restaurantName: string): ValidInvoiceInput {
  if (!isRecord(body)) {
    throw new InvoiceInputError("Invoice payload is required");
  }

  const business = optionalRecord(body.business);
  const customer = optionalRecord(body.customer);
  const billing = optionalRecord(body.billing);
  const discount = optionalRecord(body.discount);
  const items = validateItems(body.items);
  const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
  const discountType = parseDiscountType(discount.type ?? discount.mode);
  const discountValue = getFiniteNumber(discount.value) ?? 0;
  const discountAmount = calculateDiscountAmount(
    discountType,
    discountValue,
    subtotal,
  );
  const grandTotal = Math.max(subtotal - discountAmount, 0);
  const customerName = getText(customer.name);

  if (!customerName) {
    throw new InvoiceInputError("Customer name is required");
  }

  return {
    invoiceNumber: getOptionalText(billing.invoiceNumber) ?? undefined,
    invoiceDate: parseDate(billing.invoiceDate, "Invoice date", new Date()),
    dueDate: getOptionalText(billing.dueDate)
      ? parseDate(billing.dueDate, "Due date")
      : null,
    status: parseInvoiceStatus(body.status),
    businessName: getText(business.name) || restaurantName,
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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

async function generateInvoiceNumber(restaurantId: string) {
  const dateKey = getDateKey();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  const existingToday = await prisma.invoice.count({
    where: {
      restaurantId,
      createdAt: { gte: startOfDay, lt: endOfDay },
    },
  });

  for (let attempt = 1; attempt <= 25; attempt += 1) {
    const sequence = String(existingToday + attempt).padStart(4, "0");
    const invoiceNumber = `INV-${dateKey}-${sequence}`;
    const existing = await prisma.invoice.findUnique({
      where: {
        restaurantId_invoiceNumber: { restaurantId, invoiceNumber },
      },
    });

    if (!existing) return invoiceNumber;
  }

  return `INV-${dateKey}-${String(Date.now()).slice(-6)}`;
}

async function resolveInvoiceNumber({
  restaurantId,
  requestedInvoiceNumber,
  existingInvoiceId,
}: {
  restaurantId: string;
  requestedInvoiceNumber?: string;
  existingInvoiceId?: string;
}) {
  if (!requestedInvoiceNumber) return generateInvoiceNumber(restaurantId);

  const existing = await prisma.invoice.findUnique({
    where: {
      restaurantId_invoiceNumber: {
        restaurantId,
        invoiceNumber: requestedInvoiceNumber,
      },
    },
  });

  if (existing && existing.id !== existingInvoiceId) {
    throw new InvoiceInputError("Invoice number is already used");
  }

  return requestedInvoiceNumber;
}

function invoiceItemOrderBy() {
  return { id: "asc" } satisfies Prisma.InvoiceItemOrderByWithRelationInput;
}

function invoiceResponse(invoice: InvoiceWithItems) {
  return invoice;
}

router.get("/invoices", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) {
      return void res
        .status(404)
        .json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    }

    const invoices = await prisma.invoice.findMany({
      where: { restaurantId: restaurant.id },
      include: { items: { orderBy: invoiceItemOrderBy() } },
      orderBy: { updatedAt: "desc" },
    });

    res.json({ success: true, data: invoices.map(invoiceResponse) });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch invoices" });
  }
});

router.get("/invoices/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) {
      return void res
        .status(404)
        .json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, restaurantId: restaurant.id },
      include: { items: { orderBy: invoiceItemOrderBy() } },
    });

    if (!invoice) {
      return void res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    res.json({ success: true, data: invoiceResponse(invoice) });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch invoice" });
  }
});

router.post("/invoices", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) {
      return void res
        .status(404)
        .json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    }

    const input = validateInvoiceInput(req.body, restaurant.name);
    const invoiceNumber = await resolveInvoiceNumber({
      restaurantId: restaurant.id,
      requestedInvoiceNumber: input.invoiceNumber,
    });

    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          restaurantId: restaurant.id,
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
          items: {
            create: input.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: { items: { orderBy: invoiceItemOrderBy() } },
      });

      await tx.auditLog.create({
        data: {
          restaurantId: restaurant.id,
          userId: user.id,
          action: "CREATE",
          entityType: "Invoice",
          entityId: created.id,
          changes: {
            invoiceNumber: created.invoiceNumber,
            grandTotal: created.grandTotal,
          },
        },
      });

      return created;
    });

    res.status(201).json({ success: true, data: invoiceResponse(invoice) });
  } catch (error) {
    if (error instanceof InvoiceInputError) {
      return void res.status(400).json({ success: false, message: error.message });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return void res
        .status(400)
        .json({ success: false, message: "Invoice number is already used" });
    }

    res.status(500).json({ success: false, message: "Failed to create invoice" });
  }
});

router.patch("/invoices/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) {
      return void res
        .status(404)
        .json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    }

    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, restaurantId: restaurant.id },
      include: { items: { orderBy: invoiceItemOrderBy() } },
    });

    if (!existing) {
      return void res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    if (existing.status === InvoiceStatus.CANCELLED) {
      return void res
        .status(400)
        .json({ success: false, message: "Cancelled invoices cannot be updated" });
    }

    const input = validateInvoiceInput(req.body, restaurant.name);
    const invoiceNumber = await resolveInvoiceNumber({
      restaurantId: restaurant.id,
      requestedInvoiceNumber: input.invoiceNumber,
      existingInvoiceId: existing.id,
    });

    const invoice = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: existing.id } });
      const updated = await tx.invoice.update({
        where: { id: existing.id },
        data: {
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
          items: {
            create: input.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: { items: { orderBy: invoiceItemOrderBy() } },
      });

      await tx.auditLog.create({
        data: {
          restaurantId: restaurant.id,
          userId: user.id,
          action: "UPDATE",
          entityType: "Invoice",
          entityId: updated.id,
          changes: {
            invoiceNumber: updated.invoiceNumber,
            status: updated.status,
            grandTotal: updated.grandTotal,
          },
        },
      });

      return updated;
    });

    res.json({ success: true, data: invoiceResponse(invoice) });
  } catch (error) {
    if (error instanceof InvoiceInputError) {
      return void res.status(400).json({ success: false, message: error.message });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return void res
        .status(400)
        .json({ success: false, message: "Invoice number is already used" });
    }

    res.status(500).json({ success: false, message: "Failed to update invoice" });
  }
});

router.delete("/invoices/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) {
      return void res
        .status(404)
        .json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    }

    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, restaurantId: restaurant.id },
      include: { items: { orderBy: invoiceItemOrderBy() } },
    });

    if (!existing) {
      return void res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    if (existing.status === InvoiceStatus.CANCELLED) {
      return void res.json({ success: true, data: invoiceResponse(existing) });
    }

    const invoice = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.invoice.update({
        where: { id: existing.id },
        data: { status: InvoiceStatus.CANCELLED, cancelledAt: new Date() },
        include: { items: { orderBy: invoiceItemOrderBy() } },
      });

      await tx.auditLog.create({
        data: {
          restaurantId: restaurant.id,
          userId: user.id,
          action: "DELETE",
          entityType: "Invoice",
          entityId: cancelled.id,
          changes: { status: InvoiceStatus.CANCELLED },
        },
      });

      return cancelled;
    });

    res.json({
      success: true,
      message: "Invoice cancelled",
      data: invoiceResponse(invoice),
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to cancel invoice" });
  }
});

export default router;
