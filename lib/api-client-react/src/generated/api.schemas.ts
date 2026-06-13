export interface HealthStatus {
  status: string;
}

export type RetailStockStatus = "in-stock" | "low-stock" | "out-of-stock";

export type RetailPaymentMethod = "cash" | "qris" | "card" | "transfer";

export type RetailSharedDashboardId = "overview" | "sales" | "inventory" | "cashflow" | "financial-reports" | "invoice-generator" | "shift-reports" | "audit-controls";

export interface RetailProduct {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  price: number;
  cost: number;
  taxRatePercent: number;
  currentStock: number;
  reorderPoint: number;
  shelfLocation: string;
  supplierId: string | null;
  status: RetailStockStatus;
}

export interface RetailSaleLineInput {
  productId: string;
  quantity: number;
  discountPercent: number;
}

export interface RetailSaleCheckoutInput {
  paymentMethod: RetailPaymentMethod;
  lines: RetailSaleLineInput[];
}

export interface RetailCheckoutResult {
  persisted: boolean;
  canCheckout: boolean;
  receiptNumber?: string;
  saleId?: string;
  paymentId?: string;
  payableTotal: number;
  blockedReasons: string[];
}

export interface RetailSharedDashboard {
  dashboardId: RetailSharedDashboardId;
  title: string;
  subtitle: string;
  mode: "retail";
  source: string;
  status: string;
  metrics: Array<{ label: string; value: string; helper?: string }>;
  rows: Array<{ label: string; value: string; tone?: string }>;
  actions: string[];
  notes: string[];
}

export interface RetailProductListResponse {
  success: boolean;
  data: RetailProduct[];
  message?: string;
}

export interface RetailCheckoutResponse {
  success: boolean;
  data: RetailCheckoutResult;
  message?: string;
}

export interface RetailSharedDashboardResponse {
  success: boolean;
  data: RetailSharedDashboard;
  message?: string;
}
