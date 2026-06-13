import type { RawMaterialPenDto, RawMaterialPenRow } from "./raw-material-pen.types.js";

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function toRawMaterialPenDto(row: RawMaterialPenRow): RawMaterialPenDto {
  const availableCapacity = Math.max(row.capacity - row.occupancy, 0);
  const occupancyPercent = row.capacity > 0 ? Math.round((row.occupancy / row.capacity) * 100) : 0;

  return {
    id: row.id,
    code: row.code,
    flockName: row.flockName,
    capacity: row.capacity,
    occupancy: row.occupancy,
    availableCapacity,
    occupancyPercent,
    feedBatchId: row.feedBatchId,
    feedBatchLotCode: row.feedBatchLotCode,
    feedBatchMaterialName: row.feedBatchMaterialName,
    healthStatus: row.healthStatus,
    isActive: row.isActive,
    notes: row.notes,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}
