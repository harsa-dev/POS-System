import type {
  InvoiceDiscount,
  InvoiceDraft,
  InvoiceItem,
} from "@/features/shared/types";
import { calculateInvoiceSubtotal } from "./invoice-calculations";

export type InvoiceValidationIssue = {
  field: string;
  message: string;
};

function isValidNonNegativeNumber(value: number) {
  return Number.isFinite(value) && value >= 0;
}

export function validateInvoiceItem(item: InvoiceItem): InvoiceValidationIssue[] {
  const issues: InvoiceValidationIssue[] = [];

  if (!isValidNonNegativeNumber(item.quantity)) {
    issues.push({
      field: `items.${item.id}.quantity`,
      message: "Quantity must be a valid number of 0 or more.",
    });
  }

  if (!isValidNonNegativeNumber(item.unitPrice)) {
    issues.push({
      field: `items.${item.id}.unitPrice`,
      message: "Unit price must be a valid amount of 0 or more.",
    });
  }

  return issues;
}

export function validateInvoiceDiscount(
  discount: InvoiceDiscount,
  subtotal: number,
): InvoiceValidationIssue[] {
  const issues: InvoiceValidationIssue[] = [];

  if (!Number.isFinite(discount.value)) {
    return [
      {
        field: "discount.value",
        message: "Discount must be a valid number.",
      },
    ];
  }

  if (discount.mode === "percentage") {
    if (discount.value < 0 || discount.value > 100) {
      issues.push({
        field: "discount.value",
        message: "Percentage discount must be between 0 and 100.",
      });
    }

    return issues;
  }

  if (discount.value < 0) {
    issues.push({
      field: "discount.value",
      message: "Fixed discount must be 0 or more.",
    });
  }

  if (discount.value > subtotal) {
    issues.push({
      field: "discount.value",
      message: "Fixed discount is capped to the invoice subtotal.",
    });
  }

  return issues;
}

export function validateInvoiceDraft(invoice: InvoiceDraft): InvoiceValidationIssue[] {
  const subtotal = calculateInvoiceSubtotal(invoice.items);

  return [
    ...invoice.items.flatMap((item) => validateInvoiceItem(item)),
    ...validateInvoiceDiscount(invoice.discount, subtotal),
  ];
}
