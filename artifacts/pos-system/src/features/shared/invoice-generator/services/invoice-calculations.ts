import type {
  InvoiceDiscount,
  InvoiceDraft,
  InvoiceItem,
  InvoiceTotals,
} from "@/features/shared/types";

export function clampInvoiceNumber(value: number, max = Number.POSITIVE_INFINITY) {
  if (!Number.isFinite(value)) return 0;

  return Math.min(Math.max(value, 0), max);
}

export function calculateInvoiceLineTotal(
  item: Pick<InvoiceItem, "quantity" | "unitPrice">,
) {
  return clampInvoiceNumber(item.quantity) * clampInvoiceNumber(item.unitPrice);
}

export function calculateInvoiceSubtotal(items: readonly InvoiceItem[]) {
  return items.reduce(
    (total, item) => total + calculateInvoiceLineTotal(item),
    0,
  );
}

export function calculateInvoiceDiscountAmount(
  discount: InvoiceDiscount,
  subtotal: number,
) {
  const safeSubtotal = clampInvoiceNumber(subtotal);

  if (discount.mode === "percentage") {
    return safeSubtotal * (clampInvoiceNumber(discount.value, 100) / 100);
  }

  return clampInvoiceNumber(discount.value, safeSubtotal);
}

export function calculateInvoiceTotals(invoice: InvoiceDraft): InvoiceTotals {
  const subtotal = calculateInvoiceSubtotal(invoice.items);
  const discountAmount = calculateInvoiceDiscountAmount(
    invoice.discount,
    subtotal,
  );
  const grandTotal = clampInvoiceNumber(subtotal - discountAmount);

  return { subtotal, discountAmount, grandTotal };
}
