import type { RawMaterialStockMovementDto, RawMaterialStockMovementRow } from "./raw-material-stock-movement.types.js";

export function toRawMaterialStockMovementDto(row: RawMaterialStockMovementRow): RawMaterialStockMovementDto {
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
    quantity: Number(row.quantity),
    beforeQuantity: row.beforeQuantity === null ? null : Number(row.beforeQuantity),
    afterQuantity: row.afterQuantity === null ? null : Number(row.afterQuantity),
    note: row.note,
    createdById: row.createdById,
    createdAt: row.createdAt.toISOString(),
  };
}
