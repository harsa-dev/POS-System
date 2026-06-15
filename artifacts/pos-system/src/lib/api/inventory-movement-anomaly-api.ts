import { apiClient, apiFetch, type ApiEnvelope } from "@/lib/api/api-client";
import { readApiEnvelope } from "@/lib/api/read-api-envelope";

import type {
  InventoryType,
  InventoryUnit,
  StockMovementReason,
  StockMovementSource,
  StockMovementType,
} from "./inventory-api";

export type InventoryMovementAnomalyType =
  | "NEGATIVE_STOCK"
  | "MISSING_COST_SNAPSHOT"
  | "SUSPICIOUS_ADJUSTMENT"
  | "HIGH_VALUE_MOVEMENT";

export type InventoryMovementAnomalySeverity = "INFO" | "WARNING" | "CRITICAL";
export type InventoryMovementAnomalyReviewStatus = "REVIEWED" | "IGNORED" | "RESOLVED";
export type InventoryMovementAnomalyReviewFilter = InventoryMovementAnomalyReviewStatus | "UNREVIEWED" | "ALL";

export type InventoryMovementAnomalyQuery = {
  search?: string;
  inventoryItemId?: string;
  anomalyType?: InventoryMovementAnomalyType | "ALL";
  severity?: InventoryMovementAnomalySeverity | "ALL";
  reviewStatus?: InventoryMovementAnomalyReviewFilter;
  reason?: StockMovementReason | "ALL";
  sourceType?: StockMovementSource | "ALL";
  sourceId?: string;
  from?: string;
  to?: string;
  highValueThreshold?: number;
  adjustmentThreshold?: number;
  limit?: number;
};

export type InventoryMovementAnomalyRowDto = {
  id: string;
  anomalyType: InventoryMovementAnomalyType;
  severity: InventoryMovementAnomalySeverity;
  title: string;
  description: string;
  recommendedAction: string;
  movementId: string;
  businessId?: string | null;
  restaurantId?: string | null;
  actorId?: string | null;
  inventoryItemId: string;
  itemName: string;
  itemSku?: string | null;
  itemType: InventoryType;
  itemUnit: InventoryUnit;
  movementType: StockMovementType;
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
  reviewStatus?: InventoryMovementAnomalyReviewStatus | null;
  reviewNote?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
};

export type InventoryMovementAnomalyReviewDto = {
  id: string;
  businessId: string;
  anomalyId: string;
  anomalyType: InventoryMovementAnomalyType;
  movementId: string;
  status: InventoryMovementAnomalyReviewStatus;
  note: string;
  reviewedById?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InventoryMovementAnomalyReviewsDto = {
  rows: InventoryMovementAnomalyReviewDto[];
};

export type SaveInventoryMovementAnomalyReviewPayload = {
  anomalyId: string;
  anomalyType: InventoryMovementAnomalyType;
  movementId: string;
  status: InventoryMovementAnomalyReviewStatus;
  note: string;
};

export type InventoryMovementAnomalyDto = {
  generatedAt: string;
  filters: {
    search: string | null;
    inventoryItemId: string | null;
    anomalyType: InventoryMovementAnomalyType | null;
    severity: InventoryMovementAnomalySeverity | null;
    reviewStatus: InventoryMovementAnomalyReviewFilter | null;
    reason: StockMovementReason | null;
    sourceType: StockMovementSource | null;
    sourceId: string | null;
    from: string | null;
    to: string | null;
    highValueThreshold: number;
    adjustmentThreshold: number;
    limit: number;
  };
  summary: {
    totalAnomalies: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    negativeStockCount: number;
    missingCostSnapshotCount: number;
    suspiciousAdjustmentCount: number;
    highValueMovementCount: number;
    reviewedCount: number;
    ignoredCount: number;
    resolvedCount: number;
    unreviewedCount: number;
    totalValueAtRisk: number;
  };
  rows: InventoryMovementAnomalyRowDto[];
};

export type InventoryMovementAnomalyExportDto = {
  rows: InventoryMovementAnomalyRowDto[];
  meta: {
    exportedAt: string;
    rowCount: number;
    filters: Record<string, string | number | boolean | null>;
  };
};

export type InventoryMovementAnomalyCsvDownload = {
  blob: Blob;
  filename: string;
  rowCount: number | null;
  exportedAt: string | null;
};

type ApiDataEnvelope<T> = ApiEnvelope<T> & { data: T };

function getFilenameFromDisposition(disposition: string | null) {
  if (!disposition) return null;
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? null;
}

function buildAnomalySearchParams(query?: InventoryMovementAnomalyQuery) {
  const params = new URLSearchParams();
  if (!query) return params;

  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.inventoryItemId?.trim()) params.set("inventoryItemId", query.inventoryItemId.trim());
  if (query.anomalyType && query.anomalyType !== "ALL") params.set("anomalyType", query.anomalyType);
  if (query.severity && query.severity !== "ALL") params.set("severity", query.severity);
  if (query.reviewStatus && query.reviewStatus !== "ALL") params.set("reviewStatus", query.reviewStatus);
  if (query.reason && query.reason !== "ALL") params.set("reason", query.reason);
  if (query.sourceType && query.sourceType !== "ALL") params.set("sourceType", query.sourceType);
  if (query.sourceId?.trim()) params.set("sourceId", query.sourceId.trim());
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.highValueThreshold !== undefined) params.set("highValueThreshold", String(query.highValueThreshold));
  if (query.adjustmentThreshold !== undefined) params.set("adjustmentThreshold", String(query.adjustmentThreshold));
  if (query.limit) params.set("limit", String(query.limit));

  return params;
}

export const inventoryMovementAnomalyApi = {
  list(query?: InventoryMovementAnomalyQuery) {
    const params = buildAnomalySearchParams(query);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<ApiDataEnvelope<InventoryMovementAnomalyDto>>(
      `/api/inventory-movement-anomalies${suffix}`,
    );
  },

  listReviews() {
    return apiClient.get<ApiDataEnvelope<InventoryMovementAnomalyReviewsDto>>(
      "/api/inventory-movement-anomalies/reviews",
    );
  },

  saveReview(payload: SaveInventoryMovementAnomalyReviewPayload) {
    return apiClient.post<ApiDataEnvelope<InventoryMovementAnomalyReviewDto>>(
      "/api/inventory-movement-anomalies/reviews",
      payload,
    );
  },

  exportJson(query?: InventoryMovementAnomalyQuery) {
    const params = buildAnomalySearchParams(query);
    params.set("format", "json");
    return apiClient.get<ApiDataEnvelope<InventoryMovementAnomalyExportDto>>(
      `/api/inventory-movement-anomalies/export?${params.toString()}`,
    );
  },

  async downloadCsv(query?: InventoryMovementAnomalyQuery): Promise<InventoryMovementAnomalyCsvDownload> {
    const params = buildAnomalySearchParams(query);
    params.set("format", "csv");

    const response = await apiFetch(`/api/inventory-movement-anomalies/export?${params.toString()}`, {
      credentials: "include",
    });

    if (!response.ok) {
      const body = await readApiEnvelope<Record<string, unknown>>(response, "inventory movement anomaly export");
      throw new Error(body.message ?? "Failed to export inventory movement anomalies");
    }

    const blob = await response.blob();
    const filename =
      getFilenameFromDisposition(response.headers.get("content-disposition")) ?? "inventory-movement-anomalies.csv";
    const rowCountHeader = response.headers.get("x-row-count");

    return {
      blob,
      filename,
      rowCount: rowCountHeader ? Number(rowCountHeader) : null,
      exportedAt: response.headers.get("x-exported-at"),
    };
  },
};
