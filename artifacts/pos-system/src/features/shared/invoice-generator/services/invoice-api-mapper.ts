import type {
  InvoiceBackendStatus,
  InvoicePayload,
  InvoiceRecord,
} from "@/lib/api/invoice-api";
import type { InvoiceDraft, InvoicePaymentStatus } from "@/features/shared/types";

function toDateInputValue(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

export function paymentStatusToInvoiceStatus(
  status: InvoicePaymentStatus,
): InvoiceBackendStatus {
  if (status === "Paid") return "PAID";
  if (status === "Waiting For Payment") return "SENT";
  return "DRAFT";
}

export function invoiceStatusToPaymentStatus(
  status: InvoiceBackendStatus,
): InvoicePaymentStatus {
  if (status === "PAID") return "Paid";
  if (status === "SENT") return "Waiting For Payment";
  return "Pending";
}

export function mapInvoiceDraftToPayload(invoice: InvoiceDraft): InvoicePayload {
  return {
    status: paymentStatusToInvoiceStatus(invoice.paymentStatus),
    business: {
      name: invoice.business.name,
      email: invoice.business.email,
      phone: invoice.business.phone,
      address: invoice.business.address,
    },
    customer: {
      name: invoice.customer.name,
      phone: invoice.customer.phone,
      address: invoice.customer.address,
    },
    billing: {
      invoiceNumber: invoice.billing.invoiceNumber,
      invoiceDate: invoice.billing.invoiceDate,
      dueDate: invoice.billing.dueDate || null,
    },
    discount: {
      type: invoice.discount.mode === "fixed" ? "FIXED" : "PERCENTAGE",
      value: invoice.discount.value,
    },
    notes: invoice.notes,
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  };
}

export function mapInvoiceRecordToDraft(invoice: InvoiceRecord): InvoiceDraft {
  return {
    business: {
      name: invoice.businessName,
      email: invoice.businessEmail ?? "",
      phone: invoice.businessPhone ?? "",
      address: invoice.businessAddress ?? "",
    },
    customer: {
      name: invoice.customerName,
      phone: invoice.customerPhone ?? "",
      address: invoice.customerAddress ?? "",
    },
    billing: {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: toDateInputValue(invoice.invoiceDate),
      dueDate: toDateInputValue(invoice.dueDate),
    },
    items: invoice.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    paymentStatus: invoiceStatusToPaymentStatus(invoice.status),
    discount: {
      mode: invoice.discountType === "FIXED" ? "fixed" : "percentage",
      value: invoice.discountValue,
    },
    notes: invoice.notes ?? "",
  };
}
