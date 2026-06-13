import type { RawMaterialStorageLocation } from "@prisma/client";

import type { RawMaterialStorageLocationDto } from "./raw-material-storage-location.types.js";

function calculateRawMaterialStorageUsagePercent(
  storageLocation: RawMaterialStorageLocation,
) {
  if (storageLocation.capacityKg <= 0) return 0;

  return Math.round((storageLocation.usedKg / storageLocation.capacityKg) * 100);
}

export function toRawMaterialStorageLocationDto(
  storageLocation: RawMaterialStorageLocation,
): RawMaterialStorageLocationDto {
  return {
    id: storageLocation.id,
    businessId: storageLocation.businessId,
    code: storageLocation.code,
    name: storageLocation.name,
    type: storageLocation.type,
    capacityKg: storageLocation.capacityKg,
    usedKg: storageLocation.usedKg,
    availableKg: Math.max(storageLocation.capacityKg - storageLocation.usedKg, 0),
    usagePercent: calculateRawMaterialStorageUsagePercent(storageLocation),
    temperatureCelsius: storageLocation.temperatureCelsius,
    isActive: storageLocation.isActive,
    notes: storageLocation.notes,
    createdAt: storageLocation.createdAt.toISOString(),
    updatedAt: storageLocation.updatedAt.toISOString(),
  };
}
