import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

function get<T>(endpoint: string): Promise<T> {
  return apiClient.get<ApiEnvelope<T>>(endpoint).then((r) => r.data as T);
}

function post<T>(endpoint: string, body: unknown): Promise<T> {
  return apiClient.post<ApiEnvelope<T>>(endpoint, body).then((r) => r.data as T);
}

function patch<T>(endpoint: string, body?: unknown): Promise<T> {
  return apiClient.patch<ApiEnvelope<T>>(endpoint, body).then((r) => r.data as T);
}

export type RetailApiProduct = {
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
  status: "in-stock" | "low-stock" | "out-of-stock";
};

export type RetailApiSupplier = {
  id: string;
  name: string;
  leadTimeDays: number;
  reliabilityScore: number;
};

export type RetailApiSale = {
  id: string;
  receiptNumber: string;
  paymentMethod: string;
  subtotal: number;
  discountTotal: number;
  taxIncluded: number;
  total: number;
  grossProfit: number;
  status: string;
  createdAt: string;
  itemCount: number;
};

export type RetailApiStockMovement = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: string;
  reason: string;
  source: string;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  note: string | null;
  createdAt: string;
};

export type RetailApiPromotion = {
  id: string;
  name: string;
  description: string;
  discountPercent: number;
  targetCategory: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
};

export type RetailApiInventoryRisk = {
  productId: string;
  sku: string;
  name: string;
  currentStock: number;
  reorderPoint: number;
  suggestedOrderQty: number;
  estimatedCost: number;
  supplierId: string | null;
};

export type RetailApiStockAdjustInput = {
  productId: string;
  quantityDelta: number;
  reason: string;
  note?: string;
};

export type RetailApiStockAdjustResult = {
  movementId: string;
  productId: string;
  sku: string;
  beforeQuantity: number;
  afterQuantity: number;
  quantityDelta: number;
};

export type RetailApiBarcodeLookup = {
  found: boolean;
  product: RetailApiProduct;
  canSell: boolean;
  warning?: string;
};

export type RetailApiCommandCenter = {
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

export type RetailApiDashboard = {
  mode: "retail";
  persistence: string;
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

export const retailApi = {
  listProducts: (params?: { search?: string; category?: string; stockStatus?: string }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.category) qs.set("category", params.category);
    if (params?.stockStatus) qs.set("stockStatus", params.stockStatus);
    const query = qs.toString();
    return get<RetailApiProduct[]>(`/api/retail/products${query ? `?${query}` : ""}`);
  },
  listSales: (limit = 50) => get<RetailApiSale[]>(`/api/retail/sales?limit=${limit}`),
  listStockMovements: (limit = 50) => get<RetailApiStockMovement[]>(`/api/retail/stock-movements?limit=${limit}`),
  listInventoryRisks: () => get<RetailApiInventoryRisk[]>("/api/retail/inventory/risks"),
  listPromotions: () => get<RetailApiPromotion[]>("/api/retail/promotions"),
  getDashboard: () => get<RetailApiDashboard>("/api/retail/dashboard"),
  getCommandCenter: () => get<RetailApiCommandCenter>("/api/retail/command-center"),
  lookupBarcode: (code: string) => get<RetailApiBarcodeLookup>(`/api/retail/barcode/${encodeURIComponent(code)}`),
  adjustStock: (input: RetailApiStockAdjustInput) => post<RetailApiStockAdjustResult>("/api/retail/stock/adjust", input),
  togglePromotion: (id: string) => patch<{ id: string; isActive: boolean }>(`/api/retail/promotions/${id}/toggle`),
};
