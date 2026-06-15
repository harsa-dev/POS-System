export const INVOICE_GENERATOR_LOAD_INVOICE_EVENT = "invoice-generator:load-invoice";
export const INVOICE_GENERATOR_REFRESH_SUMMARY_EVENT = "invoice-generator:refresh-summary";

export type InvoiceGeneratorLoadInvoiceEventDetail = {
  invoiceId: string;
  invoiceNumber?: string;
};
