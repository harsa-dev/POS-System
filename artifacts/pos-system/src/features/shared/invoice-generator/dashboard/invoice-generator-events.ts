import type { InvoiceBackendStatus } from "@/lib/api/invoice-api";

export const INVOICE_GENERATOR_LOAD_INVOICE_EVENT = "invoice-generator:load-invoice";
export const INVOICE_GENERATOR_REFRESH_SUMMARY_EVENT = "invoice-generator:refresh-summary";
export const INVOICE_GENERATOR_FILTER_HISTORY_EVENT = "invoice-generator:filter-history";
export const INVOICE_GENERATOR_OPEN_FOLLOW_UP_EVENT = "invoice-generator:open-follow-up";

export type InvoiceGeneratorLoadInvoiceEventDetail = {
  invoiceId: string;
  invoiceNumber?: string;
};

export type InvoiceGeneratorFilterHistoryEventDetail = {
  search?: string;
  status?: InvoiceBackendStatus | "ALL";
  from?: string;
  to?: string;
  overdue?: boolean;
  message?: string;
};

export type InvoiceGeneratorOpenFollowUpEventDetail = {
  invoiceId: string;
  invoiceNumber?: string;
};
