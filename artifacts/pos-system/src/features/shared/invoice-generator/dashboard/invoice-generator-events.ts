import type { InvoiceBackendStatus } from "@/lib/api/invoice-api";

export const INVOICE_GENERATOR_LOAD_INVOICE_EVENT = "invoice-generator:load-invoice";
export const INVOICE_GENERATOR_REFRESH_SUMMARY_EVENT = "invoice-generator:refresh-summary";
export const INVOICE_GENERATOR_FILTER_HISTORY_EVENT = "invoice-generator:filter-history";

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
