export interface HealthStatus {
  status: string;
}

export type RetailStockStatus = "in-stock" | "low-stock" | "out-of-stock";
export type RetailPaymentMethod = "cash" | "qris" | "card" | "transfer";
export type RetailReturnReason = "damaged" | "wrong-item" | "customer-changed-mind" | "expired" | "other";
export type RetailReceivingStatus = "draft" | "ordered" | "partial" | "received";
export type RetailSharedDashboardId =
  | "overview"
  | "sales"
  | "customers"
  | "inventory"
  | "cashflow"
  | "financial-reports"
  | "invoice-generator"
  | "shift-reports"
  | "team-management"
  | "employee-performance"
  | "approvals"
  | "audit-controls"
  | "roster-overview"
  | "employee-attendance"
  | "employee-contracts"
  | "payroll";

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
  discountPercent?: number;
}

export interface RetailSalePreviewInput {
  lines: RetailSaleLineInput[];
  paymentMethod?: RetailPaymentMethod;
}

export interface RetailSaleCheckoutInput {
  paymentMethod: RetailPaymentMethod;
  lines: RetailSaleLineInput[];
}

export interface RetailSaleCancellationInput {
  reason?: string;
}

export interface RetailReturnInput {
  originalReceiptNumber?: string;
  reason: RetailReturnReason;
  lines: RetailSaleLineInput[];
}

export interface RetailReceivingStatusUpdateInput {
  status: RetailReceivingStatus;
}

export interface RetailSaleLinePreview {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  cost: number;
  subtotal: number;
  discountAmount: number;
  taxIncluded: number;
  lineTotal: number;
  grossProfit: number;
  blocked: boolean;
  warning?: string;
}

export interface RetailSalePreview {
  persisted: false;
  canCheckout: boolean;
  paymentMethod: RetailPaymentMethod;
  subtotal: number;
  discountTotal: number;
  taxIncluded: number;
  payableTotal: number;
  grossProfit: number;
  blockedReasons: string[];
  lines: RetailSaleLinePreview[];
}

export interface RetailCheckoutResult extends Omit<RetailSalePreview, "persisted"> {
  persisted: true;
  saleId: string;
  receiptNumber: string;
  paymentId: string;
  stockMovementIds: string[];
  createdAt: string;
}

export interface RetailSaleCancellationResult {
  cancelled: boolean;
  saleId: string;
  receiptNumber: string;
  refundAmount: number;
  restockedQuantity: number;
  stockMovementIds: string[];
  cashflowEntryId?: string;
  blockedReasons: string[];
  createdAt?: string;
}

export interface RetailReturnPreview {
  persisted: false;
  requiresManagerReview: boolean;
  estimatedRefund: number;
  restockableLines: Array<{
    productId: string;
    sku: string;
    quantity: number;
    restockable: boolean;
  }>;
  reviewReasons: string[];
}

export interface RetailReturnResult extends Omit<RetailReturnPreview, "persisted"> {
  persisted: true;
  returnId: string;
  returnNumber: string;
  saleId: string;
  originalReceiptNumber: string;
  refundAmount: number;
  restockedQuantity: number;
  stockMovementIds: string[];
  cashflowEntryId: string;
  createdAt: string;
}

export type RetailReturnResponseData = RetailReturnPreview | RetailReturnResult;

export interface RetailBarcodeLookup {
  found: boolean;
  product: RetailProduct | null;
  canSell: boolean;
  warning?: string;
}

export interface RetailInventoryRisk {
  productId: string;
  sku: string;
  name: string;
  currentStock: number;
  reorderPoint: number;
  suggestedOrderQty: number;
  estimatedCost: number;
  supplierId: string | null;
}

export interface RetailReceivingQueueItem {
  id: string;
  supplierId: string;
  supplierName: string;
  status: RetailReceivingStatus;
  expectedDate: string;
  totalCost: number;
  items: Array<{
    productId: string;
    sku: string;
    orderedQty: number;
    receivedQty: number;
    missingQty: number;
  }>;
}

export interface RetailReceivingStatusUpdateResult {
  entity: "RetailReceiving";
  id: string;
  previousStatus: RetailReceivingStatus;
  status: RetailReceivingStatus;
  updated: boolean;
  updatedAt: string;
  reason?: string;
}

export interface RetailDashboard {
  mode: "retail";
  persistence: "mock-only" | "prisma";
  summary: {
    activeSku: number;
    todayRevenue: number;
    grossProfit: number;
    stockAlerts: number;
    pendingReceiving: number;
    activePromos: number;
  };
  checkoutReadiness: {
    canScanBarcode: boolean;
    canPreviewSale: boolean;
    canMockCheckout: boolean;
    canPersistCheckout: boolean;
    writesDatabase: boolean;
  };
}

export interface RetailSharedDashboard {
  id: RetailSharedDashboardId;
  title: string;
  description: string;
  metrics: Array<{ label: string; value: string; helper: string }>;
  rows: Array<{ title: string; primary: string; secondary: string; status: "healthy" | "review" | "blocked" | "planned" }>;
  bridgeNote: string;
  source: "prisma";
}

export interface ApiSuccessResponse<TData> {
  success: boolean;
  data: TData;
  message?: string;
}

export type RetailProductListResponse = ApiSuccessResponse<RetailProduct[]>;
export type RetailDashboardResponse = ApiSuccessResponse<RetailDashboard>;
export type RetailSalePreviewResponse = ApiSuccessResponse<RetailSalePreview>;
export type RetailCheckoutResponse = ApiSuccessResponse<RetailCheckoutResult>;
export type RetailSaleCancellationResponse = ApiSuccessResponse<RetailSaleCancellationResult>;
export type RetailReturnResponse = ApiSuccessResponse<RetailReturnResponseData>;
export type RetailBarcodeLookupResponse = ApiSuccessResponse<RetailBarcodeLookup>;
export type RetailInventoryRisksResponse = ApiSuccessResponse<RetailInventoryRisk[]>;
export type RetailReceivingQueueResponse = ApiSuccessResponse<RetailReceivingQueueItem[]>;
export type RetailReceivingStatusUpdateResponse = ApiSuccessResponse<RetailReceivingStatusUpdateResult>;
export type RetailSharedDashboardResponse = ApiSuccessResponse<RetailSharedDashboard>;
