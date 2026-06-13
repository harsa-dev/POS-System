export type RetailStockStatus = "in-stock" | "low-stock" | "out-of-stock";
export type RetailCheckoutPaymentMethod = "cash" | "qris" | "card" | "transfer";
export type RetailReturnReason = "damaged" | "wrong-item" | "customer-changed-mind" | "expired" | "other";

export type RetailActor = {
  id: string;
  role: string;
};

export type RetailBusinessScope = {
  businessId: string;
};

export type RetailProductDto = {
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
};

export type RetailSupplierDto = {
  id: string;
  name: string;
  leadTimeDays: number;
  reliabilityScore: number;
};

export type RetailSaleLineInput = {
  productId: string;
  quantity: number;
  discountPercent?: number;
};

export type RetailSalePreviewInput = {
  lines: RetailSaleLineInput[];
  paymentMethod?: RetailCheckoutPaymentMethod;
};

export type RetailSaleLinePreviewDto = {
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
};

export type RetailSalePreviewDto = {
  persisted: false;
  canCheckout: boolean;
  paymentMethod: RetailCheckoutPaymentMethod;
  subtotal: number;
  discountTotal: number;
  taxIncluded: number;
  payableTotal: number;
  grossProfit: number;
  blockedReasons: string[];
  lines: RetailSaleLinePreviewDto[];
};

export type RetailMockCheckoutDto = RetailSalePreviewDto & {
  mockReceiptNumber: string;
  mockTransactionId: string;
  nextBackendStep: string;
};

export type RetailPersistedCheckoutDto = Omit<RetailSalePreviewDto, "persisted"> & {
  persisted: true;
  saleId: string;
  receiptNumber: string;
  paymentId: string;
  stockMovementIds: string[];
  createdAt: string;
};

export type RetailInventoryRiskDto = {
  productId: string;
  sku: string;
  name: string;
  currentStock: number;
  reorderPoint: number;
  suggestedOrderQty: number;
  estimatedCost: number;
  supplierId: string | null;
};

export type RetailReceivingQueueDto = {
  id: string;
  supplierId: string;
  supplierName: string;
  status: "draft" | "ordered" | "partial" | "received";
  expectedDate: string;
  totalCost: number;
  items: Array<{
    productId: string;
    sku: string;
    orderedQty: number;
    receivedQty: number;
    missingQty: number;
  }>;
};

export type RetailReturnPreviewInput = {
  originalReceiptNumber?: string;
  lines: RetailSaleLineInput[];
  reason: RetailReturnReason;
};

export type RetailReturnPreviewDto = {
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
};

export type RetailDashboardDto = {
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
};

export type RetailCommandCenterDto = {
  healthScore: number;
  priorityActions: Array<{
    id: string;
    title: string;
    priority: "low" | "medium" | "high";
    ownerRole: "owner" | "manager" | "cashier";
    source: string;
  }>;
  nextIntegrationSteps: string[];
};

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

export type RetailSharedDashboardMetricDto = {
  label: string;
  value: string;
  helper: string;
};

export type RetailSharedDashboardRowDto = {
  title: string;
  primary: string;
  secondary: string;
  status: "healthy" | "review" | "blocked" | "planned";
};

export type RetailSharedDashboardDto = {
  id: RetailSharedDashboardId;
  title: string;
  description: string;
  metrics: RetailSharedDashboardMetricDto[];
  rows: RetailSharedDashboardRowDto[];
  bridgeNote: string;
  source: "prisma";
};
