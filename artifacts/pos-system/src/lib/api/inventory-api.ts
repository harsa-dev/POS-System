import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

export type InventoryType =
  | "INGREDIENT"
  | "PACKAGING"
  | "EQUIPMENT"
  | "PRODUCT"
  | "RAW_MATERIAL"
  | "FINISHED_GOOD"
  | "SUPPLY"
  | "TOOL"
  | "SPARE_PART"
  | "FEED"
  | "MEDICINE";

export type InventoryUnit =
  | "PCS"
  | "GRAM"
  | "KILOGRAM"
  | "LITER"
  | "ML"
  | "PACK"
  | "BOTTLE"
  | "BOX"
  | "CARTON"
  | "SACK"
  | "ROLL"
  | "SET"
  | "PAIR"
  | "DOSE"
  | "TABLET"
  | "CAPSULE"
  | "VIAL"
  | "CAN";

export type StockMovementType = "IN" | "OUT" | "ADJUSTMENT";

export type StockMovementReason =
  | "PURCHASE"
  | "RECIPE_USAGE"
  | "WASTE"
  | "EXPIRED"
  | "MANUAL_ADJUSTMENT"
  | "DAMAGED"
  | "RETURN"
  | "OPENING_STOCK"
  | "STOCK_COUNT"
  | "CORRECTION"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "PRODUCTION_USAGE"
  | "SERVICE_USAGE"
  | "LIVESTOCK_USAGE"
  | "IMPORT";

export type StockMovementSource =
  | "MANUAL"
  | "ORDER"
  | "RECIPE"
  | "PURCHASE"
  | "WASTE"
  | "RETURN"
  | "TRANSFER"
  | "STOCK_COUNT"
  | "IMPORT"
  | "SYSTEM";

export type InventoryStockStatus = "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK";
export type SharedInventoryBusinessMode =
  | "restaurant"
  | "retail"
  | "raw-material"
  | "custom-business";

type ApiDataEnvelope<T> = ApiEnvelope<T> & { data: T };

export type InventoryItemDto = {
  id: string;
  businessId?: string | null;
  restaurantId: string;
  name: string;
  sku?: string | null;
  type: InventoryType;
  unit: InventoryUnit;
  currentStock: number;
  minimumStock: number;
  costPerUnit: number;
  createdAt: string;
  updatedAt: string;
  recipeCount: number;
  movementCount: number;
  stockStatus: InventoryStockStatus;
  isLowStock: boolean;
  isOutOfStock: boolean;
  stockValue: number;
};

export type StockMovementDto = {
  id: string;
  businessId?: string | null;
  restaurantId?: string | null;
  actorId?: string | null;
  inventoryItemId: string;
  type: StockMovementType;
  quantity: number;
  note?: string | null;
  reason?: StockMovementReason | null;
  previousStock?: number | null;
  newStock?: number | null;
  unitCostSnapshot?: number | null;
  sourceType?: StockMovementSource | null;
  sourceId?: string | null;
  createdAt: string;
  inventoryItem: InventoryItemDto;
};

export type InventoryDashboardDto = {
  summary: {
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalStockValue: number;
    ingredientItems: number;
    packagingItems: number;
    equipmentItems: number;
  };
  items: InventoryItemDto[];
  lowStockItems: InventoryItemDto[];
  recentMovements: StockMovementDto[];
};

export type InventoryModePolicyDto = {
  mode: SharedInventoryBusinessMode;
  label: string;
  description: string;
  allowedTypes: InventoryType[];
  allowedUnits: InventoryUnit[];
  allowedMovementReasons: StockMovementReason[];
  dashboardBuckets: string[];
  recipeBacked: boolean;
  supportsConsumableUsage: boolean;
  supportsSkuStock: boolean;
};

export type InventoryCapabilitiesDto = {
  businessId: string;
  restaurantId: string;
  businessMode: string;
  policy: InventoryModePolicyDto;
};

export type InventoryItemPayload = {
  name: string;
  sku?: string | null;
  type: InventoryType;
  unit: InventoryUnit;
  openingStock?: number;
  currentStock?: number;
  minimumStock?: number;
  costPerUnit?: number;
};

export type StockMovementPayload = {
  inventoryItemId: string;
  type: StockMovementType;
  quantity: number;
  reason?: StockMovementReason;
  note?: string | null;
  sourceType?: StockMovementSource;
  sourceId?: string | null;
};

export type StockMovementQuery = {
  inventoryItemId?: string;
  limit?: number;
};

function buildStockMovementQuery(params?: StockMovementQuery) {
  if (!params) return "";

  const searchParams = new URLSearchParams();

  if (params.inventoryItemId) searchParams.set("inventoryItemId", params.inventoryItemId);
  if (params.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const inventoryApi = {
  getInventoryCapabilities() {
    return apiClient.get<ApiDataEnvelope<InventoryCapabilitiesDto>>("/api/inventory-capabilities");
  },

  getInventoryDashboard() {
    return apiClient.get<ApiDataEnvelope<InventoryDashboardDto>>("/api/inventory-dashboard");
  },

  listInventoryItems() {
    return apiClient.get<ApiDataEnvelope<InventoryItemDto[]>>("/api/inventory-items");
  },

  createInventoryItem(payload: InventoryItemPayload) {
    return apiClient.post<ApiDataEnvelope<InventoryItemDto>>("/api/inventory-items", {
      json: payload,
    });
  },

  updateInventoryItem(id: string, payload: Partial<InventoryItemPayload>) {
    return apiClient.patch<ApiDataEnvelope<InventoryItemDto>>(`/api/inventory-items/${id}`, {
      json: payload,
    });
  },

  deleteInventoryItem(id: string) {
    return apiClient.delete<ApiEnvelope>(`/api/inventory-items/${id}`);
  },

  listStockMovements(params?: StockMovementQuery) {
    return apiClient.get<ApiDataEnvelope<StockMovementDto[]>>(
      `/api/inventory${buildStockMovementQuery(params)}`,
    );
  },

  createStockMovement(payload: StockMovementPayload) {
    return apiClient.post<ApiDataEnvelope<StockMovementDto>>("/api/inventory", {
      json: payload,
    });
  },
};
