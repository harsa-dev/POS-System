export type PaymentStatus = "Paid" | "Receivable" | "Partial";

export type SalesTransaction = {
  orderNumber: string;
  date: string;
  customerOrTable: string;
  product: string;
  quantity: number;
  paymentStatus: PaymentStatus;
  sellingPrice: number;
  voucherDiscount: number;
  posPromotion: number;
  receivables: number;
  cogs: number;
  advertisingCost: number;
};

export type SalesSummary = {
  grossRevenue: number;
  totalRevenue: number;
  margin: number;
  netProfit: number;
  quantity: number;
};
