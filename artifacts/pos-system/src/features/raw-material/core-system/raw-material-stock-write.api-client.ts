import { apiClient, getApiErrorMessage, type ApiEnvelope } from "@/lib/api/api-client";

import type { RawMaterialStockMovement } from "./raw-material.types";

export type RawMaterialAdjustmentWriteInput = Readonly<{
  batchId: string;
  deltaQuantity: number;
  reason: "MANUAL_ADJUSTMENT" | "STOCK_COUNT" | "CORRECTION";
  note: string;
}>;

export type RawMaterialTransferWriteInput = Readonly<{
  batchId: string;
  targetStorageLocationId: string;
  note?: string;
}>;

export type RawMaterialProcessingConsumeWriteInput = Readonly<{
  processingRunId: string;
  note?: string;
}>;

type BackendRawMaterialStockMovement = Readonly<{
  id: string;
  batchId: string;
  batchLotCode: string | null;
  materialName: string | null;
  sourceStorageLocationId: string | null;
  sourceStorageCode: string | null;
  targetStorageLocationId: string | null;
  targetStorageCode: string | null;
  type: string;
  reason: string;
  source: string;
  sourceId: string | null;
  quantity: number;
  beforeQuantity: number | null;
  afterQuantity: number | null;
  note: string | null;
  createdAt: string;
}>;

function toRawMaterialStockMovement(row: BackendRawMaterialStockMovement): RawMaterialStockMovement {
  return {
    id: row.id,
    batchId: row.batchId,
    batchLotCode: row.batchLotCode,
    materialName: row.materialName,
    sourceStorageLocationId: row.sourceStorageLocationId,
    sourceStorageCode: row.sourceStorageCode,
    targetStorageLocationId: row.targetStorageLocationId,
    targetStorageCode: row.targetStorageCode,
    type: row.type,
    reason: row.reason,
    source: row.source,
    sourceId: row.sourceId,
    quantity: row.quantity,
    beforeQuantity: row.beforeQuantity,
    afterQuantity: row.afterQuantity,
    note: row.note,
    createdAt: row.createdAt,
  };
}

async function postRawMaterialStockWrite(path: string, body: Record<string, unknown>) {
  const payload = await apiClient.post<ApiEnvelope<BackendRawMaterialStockMovement>>(path, body);

  if (!payload.success || !payload.data) {
    throw new Error(`Raw Material stock write API returned an empty response for ${path}.`);
  }

  return toRawMaterialStockMovement(payload.data);
}

export function getRawMaterialStockWriteErrorMessage(error: unknown) {
  return getApiErrorMessage(error, "Raw Material stock write API failed. The write was not applied.");
}

export function adjustRawMaterialStock(input: RawMaterialAdjustmentWriteInput) {
  return postRawMaterialStockWrite("/raw-material/stock-movements/adjust", {
    batchId: input.batchId,
    deltaQuantity: input.deltaQuantity,
    reason: input.reason,
    note: input.note,
  });
}

export function transferRawMaterialStock(input: RawMaterialTransferWriteInput) {
  return postRawMaterialStockWrite("/raw-material/stock-movements/transfer", {
    batchId: input.batchId,
    targetStorageLocationId: input.targetStorageLocationId,
    note: input.note,
  });
}

export function consumeRawMaterialForProcessing(input: RawMaterialProcessingConsumeWriteInput) {
  return postRawMaterialStockWrite("/raw-material/stock-movements/consume-processing", {
    processingRunId: input.processingRunId,
    note: input.note,
  });
}

export const rawMaterialStockWriteApiClient = {
  adjustStock: adjustRawMaterialStock,
  transferStock: transferRawMaterialStock,
  consumeForProcessing: consumeRawMaterialForProcessing,
};