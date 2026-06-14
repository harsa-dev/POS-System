import { getApiErrorMessage } from "@/lib/api/api-client";

import { rawMaterialGeneratedApiData } from "./raw-material.generated-api-client";
import type { RawMaterialStockMovement } from "./raw-material.types";

export type RawMaterialAdjustmentWriteInput = Readonly<{
  batchId: string;
  deltaQuantity: number;
  reason: "MANUAL_ADJUSTMENT" | "STOCK_COUNT" | "CORRECTION";
  note: string;
}>;

export type RawMaterialAdjustmentReversalWriteInput = Readonly<{
  movementId: string;
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

export function getRawMaterialStockWriteErrorMessage(error: unknown) {
  return getApiErrorMessage(error, "Raw Material stock write API failed. The write was not applied.");
}

export async function adjustRawMaterialStock(input: RawMaterialAdjustmentWriteInput) {
  const movement = await rawMaterialGeneratedApiData<BackendRawMaterialStockMovement>("rawMaterialAdjustStock", {
    json: {
      batchId: input.batchId,
      deltaQuantity: input.deltaQuantity,
      reason: input.reason,
      note: input.note,
    },
  });

  return toRawMaterialStockMovement(movement);
}

export async function reverseRawMaterialStockAdjustment(input: RawMaterialAdjustmentReversalWriteInput) {
  const movement = await rawMaterialGeneratedApiData<BackendRawMaterialStockMovement>("rawMaterialReverseStockAdjustment", {
    pathParams: { id: input.movementId },
    json: { note: input.note },
  });

  return toRawMaterialStockMovement(movement);
}

export async function transferRawMaterialStock(input: RawMaterialTransferWriteInput) {
  const movement = await rawMaterialGeneratedApiData<BackendRawMaterialStockMovement>("rawMaterialTransferStock", {
    json: {
      batchId: input.batchId,
      targetStorageLocationId: input.targetStorageLocationId,
      note: input.note,
    },
  });

  return toRawMaterialStockMovement(movement);
}

export async function consumeRawMaterialForProcessing(input: RawMaterialProcessingConsumeWriteInput) {
  const movement = await rawMaterialGeneratedApiData<BackendRawMaterialStockMovement>("rawMaterialConsumeProcessingStock", {
    json: {
      processingRunId: input.processingRunId,
      note: input.note,
    },
  });

  return toRawMaterialStockMovement(movement);
}

export const rawMaterialStockWriteApiClient = {
  adjustStock: adjustRawMaterialStock,
  reverseAdjustment: reverseRawMaterialStockAdjustment,
  transferStock: transferRawMaterialStock,
  consumeForProcessing: consumeRawMaterialForProcessing,
};
