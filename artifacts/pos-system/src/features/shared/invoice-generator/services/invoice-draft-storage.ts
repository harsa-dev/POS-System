import { invoicePaymentStatuses } from "../data/invoice-status";
import type {
  InvoiceDraft,
  InvoiceDiscountMode,
  InvoicePaymentStatus,
} from "@/features/shared/types";

export const INVOICE_DRAFT_STORAGE_KEY = "pos.invoiceGenerator.localDraft.v1";

export type StoredInvoiceDraft = {
  draft: InvoiceDraft;
  savedAt: string;
};

function canUseLocalStorage() {
  try {
    return typeof window !== "undefined" && Boolean(window.localStorage);
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isInvoiceDiscountMode(value: unknown): value is InvoiceDiscountMode {
  return value === "percentage" || value === "fixed";
}

function isInvoicePaymentStatus(value: unknown): value is InvoicePaymentStatus {
  return (
    isString(value) &&
    invoicePaymentStatuses.includes(value as InvoicePaymentStatus)
  );
}

function isValidDateString(value: unknown): value is string {
  return isString(value) && Number.isFinite(new Date(value).getTime());
}

function isInvoiceDraft(value: unknown): value is InvoiceDraft {
  if (!isRecord(value)) return false;

  const business = value.business;
  const customer = value.customer;
  const billing = value.billing;
  const discount = value.discount;

  if (!isRecord(business) || !isRecord(customer) || !isRecord(billing)) {
    return false;
  }

  if (
    !isString(business.name) ||
    !isString(business.email) ||
    !isString(business.address) ||
    !isString(business.phone)
  ) {
    return false;
  }

  if (business.logoUrl !== undefined && !isString(business.logoUrl)) {
    return false;
  }

  if (
    !isString(customer.name) ||
    !isString(customer.address) ||
    !isString(customer.phone)
  ) {
    return false;
  }

  if (
    !isString(billing.invoiceNumber) ||
    !isString(billing.invoiceDate) ||
    (billing.dueDate !== undefined && !isString(billing.dueDate))
  ) {
    return false;
  }

  if (!Array.isArray(value.items)) return false;

  const hasValidItems = value.items.every((item) => {
    if (!isRecord(item)) return false;

    return (
      isString(item.id) &&
      isString(item.description) &&
      isFiniteNumber(item.quantity) &&
      isFiniteNumber(item.unitPrice)
    );
  });

  if (!hasValidItems) return false;

  if (!isInvoicePaymentStatus(value.paymentStatus)) return false;

  if (!isRecord(discount)) return false;

  return (
    isInvoiceDiscountMode(discount.mode) &&
    isFiniteNumber(discount.value) &&
    isString(value.notes)
  );
}

function isStoredInvoiceDraft(value: unknown): value is StoredInvoiceDraft {
  if (!isRecord(value)) return false;

  return isInvoiceDraft(value.draft) && isValidDateString(value.savedAt);
}

export function loadInvoiceDraft(): StoredInvoiceDraft | null {
  if (!canUseLocalStorage()) return null;

  try {
    const rawDraft = window.localStorage.getItem(INVOICE_DRAFT_STORAGE_KEY);
    if (!rawDraft) return null;

    const parsedDraft = JSON.parse(rawDraft);

    if (!isStoredInvoiceDraft(parsedDraft)) {
      clearInvoiceDraft();
      return null;
    }

    return parsedDraft;
  } catch {
    clearInvoiceDraft();
    return null;
  }
}

export function saveInvoiceDraft(
  draft: InvoiceDraft,
  savedAt = new Date().toISOString(),
): StoredInvoiceDraft | null {
  if (!canUseLocalStorage()) return null;

  const storedDraft: StoredInvoiceDraft = { draft, savedAt };

  try {
    window.localStorage.setItem(
      INVOICE_DRAFT_STORAGE_KEY,
      JSON.stringify(storedDraft),
    );

    return storedDraft;
  } catch {
    return null;
  }
}

export function clearInvoiceDraft() {
  if (!canUseLocalStorage()) return;

  try {
    window.localStorage.removeItem(INVOICE_DRAFT_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures so a corrupt local draft never breaks the page.
  }
}
