import {
  rawMaterialBatches,
  rawMaterialIntakes,
  rawMaterialStorageLocations,
  rawMaterialSuppliers,
  type RawMaterialQualityStatus,
  type RawMaterialSupplier,
} from "@/features/raw-material/core-system";

import type {
  RawMaterialQualityFilterValue,
  RawMaterialSupplierCategoryFilterValue,
} from "./raw-material-workspace.types";

export function getRawMaterialSupplierName(supplierId: string) {
  return rawMaterialSuppliers.find((supplier) => supplier.id === supplierId)?.name ?? "Unknown supplier";
}

export function getRawMaterialStorageLabel(storageId: string) {
  const storage = rawMaterialStorageLocations.find((location) => location.id === storageId);

  return storage ? `${storage.code} · ${storage.name}` : "Unassigned storage";
}

export function getRawMaterialIntakeLabel(intakeId: string) {
  const intake = rawMaterialIntakes.find((candidate) => candidate.id === intakeId);

  return intake ? intake.referenceNumber : "Unknown intake";
}

export function getRawMaterialBatchLabel(batchId: string) {
  const batch = rawMaterialBatches.find((candidate) => candidate.id === batchId);

  return batch ? batch.lotCode : "Unknown batch";
}

export function toRawMaterialPositiveNumber(value: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function normalizeRawMaterialQualityFilter(value: RawMaterialQualityFilterValue) {
  return value === "all" ? undefined : (value satisfies RawMaterialQualityStatus);
}

export function normalizeRawMaterialSupplierCategoryFilter(
  value: RawMaterialSupplierCategoryFilterValue,
) {
  return value === "all" ? undefined : (value satisfies RawMaterialSupplier["category"]);
}
