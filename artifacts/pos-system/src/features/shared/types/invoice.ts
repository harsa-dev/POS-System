export type InvoicePaymentStatus = "Pending" | "Paid" | "Waiting For Payment";

export type InvoiceDiscountMode = "percentage" | "fixed";

export type InvoiceBusinessInfo = {
  logoUrl?: string;
  name: string;
  email: string;
  address: string;
  phone: string;
};

export type InvoiceCustomerInfo = {
  name: string;
  address: string;
  phone: string;
};

export type InvoiceBillingInfo = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
};

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceDiscount = {
  mode: InvoiceDiscountMode;
  value: number;
};

export type InvoiceDraft = {
  business: InvoiceBusinessInfo;
  customer: InvoiceCustomerInfo;
  billing: InvoiceBillingInfo;
  items: InvoiceItem[];
  paymentStatus: InvoicePaymentStatus;
  discount: InvoiceDiscount;
  notes: string;
};

export type InvoiceTotals = {
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
};
