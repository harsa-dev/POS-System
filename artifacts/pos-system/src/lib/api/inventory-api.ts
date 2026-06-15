import { apiClient, apiFetch, type ApiEnvelope } from "@/lib/api/api-client";
import { readApiEnvelope } from "@/lib/api/read-api-envelope";

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
export type InventoryReportStatus = "ALL" | InventoryStockStatus;
export type InventoryReportSort = "HIGHEST_VALUE" | "LOWEST_STOCK" | "ITEM_NAME" | "NEWEST";
export type InventoryMovementReportSort = "NEWEST" | "OLDEST" | "HIGHEST_QUANTITY" | "HIGHEST_VALUE";
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

export type InventoryReportQuery = {
  search?: string;
  type?: InventoryType | "ALL";
  status?: InventoryReportStatus;
  lowStock?: boolean;
  sort?: InventoryReportSort;
  limit?: number;
};

export type InventoryReportDto = {
  generatedAt: string;
  filters: {
    search: string | null;
    type: InventoryType | null;
    status: InventoryReportStatus;
    lowStock: boolean;
    sort: InventoryReportSort;
    limit: number;
  };
  summary: {
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    inStockItems: number;
    totalStockValue: number;
    totalUnits: number;
    averageCostPerUnit: number;
  };
  rows: InventoryItemDto[];
};

export type InventoryReportExportDto = {
  rows: InventoryItemDto[];
  meta: {
    exportedAt: string;
    rowCount: number;
    limit: number;
    filters: Record<string, string | number | boolean | null>;
  };
};

export type InventoryReportCsvDownload = {
  blob: Blob;
  filename: string;
  rowCount: number | null;
  exportedAt: string | null;
};

export type InventoryMovementReportQuery = {
  search?: string;
  inventoryItemId?: string;
  type?: StockMovementType | "ALL";
  reason?: StockMovementReason | "ALL";
  sourceType?: StockMovementSource | "ALL";
  sourceId?: string;
  from?: string;
  to?: string;
  sort?: InventoryMovementReportSort;
  limit?: number;
};

export type InventoryMovementReportRowDto = {
  id: string;
  businessId?: string | null;
  restaurantId?: string | null;
  actorId?: string | null;
  inventoryItemId: string;
  itemName: string;
  itemSku?: string | null;
  itemType: InventoryType;
  itemUnit: InventoryUnit;
  type: StockMovementType;
  quantity: number;
  reason?: StockMovementReason | null;
  sourceType?: StockMovementSource | null;
  sourceId?: string | null;
  note?: string | null;
  previousStock?: number | null;
  newStock?: number | null;
  unitCostSnapshot?: number | null;
  fallbackCostPerUnit: number;
  movementValue: number;
  createdAt: string;
};

export type InventoryMovementReportDto = {
  generatedAt: string;
  filters: {
    search: string | null;
    inventoryItemId: string | null;
    type: StockMovementType | null;
    reason: StockMovementReason | null;
    sourceType: StockMovementSource | null;
    sourceId: string | null;
    from: string | null;
    to: string | null;
    sort: InventoryMovementReportSort;
    limit: number;
  };
  summary: {
    totalMovements: number;
    inMovements: number;
    outMovements: number;
    adjustmentMovements: number;
    totalInQuantity: number;
    totalOutQuantity: number;
    totalAdjustmentQuantity: number;
    netQuantity: number;
    totalMovementValue: number;
  };
  rows: InventoryMovementReportRowDto[];
};

export type InventoryMovementReportExportDto = {
  rows: InventoryMovementReportRowDto[];
  meta: {
    exportedAt: string;
    rowCount: number;
    limit: number;
    filters: Record<string, string | number | boolean | null>;
  };
};

export type InventoryMovementReportCsvDownload = {
  blob: Blob;
  filename: string;
  rowCount: number | null;
  exportedAt: string | null;
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

export type InventoryManagementCapabilitiesDto = {
  businessId: string;
  businessMode: string;
  canView: boolean;
  canCreateItem: boolean;
  canUpdateItem: boolean;
  canDeleteItem: boolean;
  canMoveStock: boolean;
  canImport: boolean;
  canExport: boolean;
  canRepairCostSnapshots: boolean;
  isPlannedMode: boolean;
  plannedReason?: string | null;
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

function getFilenameFromDisposition(disposition: string | null) {
  if (!disposition) return null;
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? null;
}

function buildStockMovementQuery(params?: StockMovementQuery) {
  if (!params) return "";

  const searchParams = new URLSearchParams();

  if (params.inventoryItemId) searchParams.set("inventoryItemId", params.inventoryItemId);
  if (params.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function buildInventoryReportSearchParams(query?: InventoryReportQuery) {
  const params = new URLSearchParams();
  if (!query) return params;

  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.type && query.type !== "ALL") params.set("type", query.type);
  if (query.status && query.status !== "ALL") params.set("status", query.status);
  if (query.lowStock) params.set("lowStock", "true");
  if (query.sort) params.set("sort", query.sort);
  if (query.limit) params.set("limit", String(query.limit));

  return params;
}

function buildInventoryMovementReportSearchParams(query?: InventoryMovementReportQuery) {
  const params = new URLSearchParams();
  if (!query) return params;

  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.inventoryItemId?.trim()) params.set("inventoryItemId", query.inventoryItemId.trim());
  if (query.type && query.type !== "ALL") params.set("type", query.type);
  if (query.reason && query.reason !== "ALL") params.set("reason", query.reason);
  if (query.sourceType && query.sourceType !== "ALL") params.set("sourceType", query.sourceType);
  if (query.sourceId?.trim()) params.set("sourceId", query.sourceId.trim());
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.sort) params.set("sort", query.sort);
  if (query.limit) params.set("limit", String(query.limit));

  return params;
}

export const inventoryApi = {
  getInventoryManagementCapabilities() {
    return apiClient.get<ApiDataEnvelope<InventoryManagementCapabilitiesDto>>(
      "/api/inventory-management-capabilities",
    );
  },

  getInventoryCapabilities() {
    return apiClient.get<ApiDataEnvelope<InventoryCapabilitiesDto>>("/api/inventory-capabilities");
  },

  getInventoryDashboard() {
    return apiClient.get<ApiDataEnvelope<InventoryDashboardDto>>("/api/inventory-dashboard");
  },

  listInventoryItems() {
    return apiClient.get<ApiDataEnvelope<InventoryItemDto[]>>("/api/inventory-items");
  },

  listReports(query?: InventoryReportQuery) {
    const params = buildInventoryReportSearchParams(query);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<ApiDataEnvelope<InventoryReportDto>>(`/api/inventory-reports${suffix}`);
  },

  exportReportsJson(query?: InventoryReportQuery) {
    const params = buildInventoryReportSearchParams(query);
    params.set("format", "json");
    return apiClient.get<ApiDataEnvelope<InventoryReportExportDto>>(
      `/api/inventory-reports/export?${params.toString()}`,
    );
  },

  async downloadReportsCsv(query?: InventoryReportQuery): Promise<InventoryReportCsvDownload> {
    const params = buildInventoryReportSearchParams(query);
    params.set("format", "csv");

    const response = await apiFetch(`/api/inventory-reports/export?${params.toString()}`, {
      credentials: "include",
    });

    if (!response.ok) {
      const body = await readApiEnvelope<Record<string, unknown>>(response, "inventory report export");
      throw new Error(body.message ?? "Failed to export inventory report");
    }

    const blob = await response.blob();
    const filename = getFilenameFromDisposition(response.headers.get("content-disposition")) ?? "inventory-report.csv";
    const rowCountHeader = response.headers.get("x-row-count");

    return {
      blob,
      filename,
      rowCount: rowCountHeader ? Number(rowCountHeader) : null,
      exportedAt: response.headers.get("x-exported-at"),
    };
  },

  listMovementReports(query?: InventoryMovementReportQuery) {
    const params = buildInventoryMovementReportSearchParams(query);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<ApiDataEnvelope<InventoryMovementReportDto>>(
      `/api/inventory-movement-reports${suffix}`,
    );
  },

  exportMovementReportsJson(query?: InventoryMovementReportQuery) {
    const params = buildInventoryMovementReportSearchParams(query);
    params.set("format", "json");
    return apiClient.get<ApiDataEnvelope<InventoryMovementReportExportDto>>(
      `/api/inventory-movement-reports/export?${params.toString()}`,
    );
  },

  async downloadMovementReportsCsv(
    query?: InventoryMovementReportQuery,
  ): Promise<InventoryMovementReportCsvDownload> {
    const params = buildInventoryMovementReportSearchParams(query);
    params.set("format", "csv");

    const response = await apiFetch(`/api/inventory-movement-reports/export?${params.toString()}`, {
      credentials: "include",
    });

    if (!response.ok) {
      const body = await readApiEnvelope<Record<string, unknown>>(response, "inventory movement report export");
      throw new Error(body.message ?? "Failed to export inventory movement report");
    }

    const blob = await response.blob();
    const filename =
      getFilenameFromDisposition(response.headers.get("content-disposition")) ?? "inventory-movement-report.csv";
    const rowCountHeader = response.headers.get("x-row-count");

    return {
      blob,
      filename,
      rowCount: rowCountHeader ? Number(rowCountHeader) : null,
      exportedAt: response.headers.get("x-exported-at"),
    };
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
