import type { DashboardTone, InvoicePaymentStatus } from "@/features/shared/types";

type InvoiceStatusMetadata = {
  label: InvoicePaymentStatus;
  tone: DashboardTone;
  description: string;
};

export const invoicePaymentStatuses: InvoicePaymentStatus[] = [
  "Pending",
  "Paid",
  "Waiting For Payment",
];

export const invoiceStatusMetadata: Record<
  InvoicePaymentStatus,
  InvoiceStatusMetadata
> = {
  Pending: {
    label: "Pending",
    tone: "rose",
    description: "Draft invoice with no confirmed payment.",
  },
  Paid: {
    label: "Paid",
    tone: "green",
    description: "Payment is marked paid locally on this draft.",
  },
  "Waiting For Payment": {
    label: "Waiting For Payment",
    tone: "amber",
    description: "Invoice is ready locally and awaiting payment.",
  },
};

export function getInvoiceStatusMetadata(status: InvoicePaymentStatus) {
  return invoiceStatusMetadata[status];
}
