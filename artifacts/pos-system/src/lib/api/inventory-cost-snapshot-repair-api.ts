import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

export type InventoryCostSnapshotRepairStatus = "REPAIRABLE" | "NEEDS_ITEM_COST";

export type InventoryCostSnapshotRepairRowDto = {
  movementId: string;
  createdAt: string;
  inventoryItemId: string | null;
  itemName: string;
  quantity: number;
  sourceType: string;
  sourceId: string | null;
  reason: string;
  currentSnapshot: number;
  itemCost: number;
  estimatedCost: number;
  repairStatus: InventoryCostSnapshotRepairStatus;
};

export type InventoryCostSnapshotRepairSummaryDto = {
  totalRows: number;
  repairableRows: number;
  needsItemCostRows: number;
  estimatedRepairValue: number;
};

export type InventoryCostSnapshotRepairPreviewDto = {
  generatedAt: string;
  period: {
    from: string | null;
    to: string | null;
  };
  limit: number;
  summary: InventoryCostSnapshotRepairSummaryDto;
  rows: InventoryCostSnapshotRepairRowDto[];
};

export type InventoryCostSnapshotRepairPayload = {
  from?: string;
  to?: string;
  limit?: number;
  movementIds?: string[];
};

export type InventoryCostSnapshotRepairResultDto = {
  repairedCount: number;
  repairedValue: number;
  repairedMovementIds: string[];
};

type ApiDataEnvelope<TData> = ApiEnvelope<TData> & { data: TData };

function buildRepairQuery(params?: InventoryCostSnapshotRepairPayload) {
  if (!params) return "";

  const searchParams = new URLSearchParams();
  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);
  if (params.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const inventoryCostSnapshotRepairApi = {
  preview(params?: InventoryCostSnapshotRepairPayload) {
    return apiClient.get<ApiDataEnvelope<InventoryCostSnapshotRepairPreviewDto>>(
      `/api/inventory-cost-snapshot-repairs${buildRepairQuery(params)}`,
    );
  },

  backfill(payload: InventoryCostSnapshotRepairPayload) {
    return apiClient.post<ApiDataEnvelope<InventoryCostSnapshotRepairResultDto>>(
      "/api/inventory-cost-snapshot-repairs/backfill",
      { json: payload },
    );
  },
};
