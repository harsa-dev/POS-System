export const INVOICE_GENERATOR_LOAD_INVOICE_EVENT = "invoice-generator:load-invoice";

export type InvoiceGeneratorLoadInvoiceEventDetail = {
  invoiceId: string;
  invoiceNumber?: string;
};
