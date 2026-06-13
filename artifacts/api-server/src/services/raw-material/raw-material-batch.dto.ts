import type { RawMaterialBatch, RawMaterialIntake, RawMaterialStorageLocation } from "@prisma/client";

type RawMaterialBatchWithRelations = RawMaterialBatch & {
  intake?: Pick<RawMaterialIntake, "referenceNumber" | "materialName"> | null;
  storageLocation?: Pick<RawMaterialStorageLocation, "code" | "name"> | null;
};

export function toRawMaterialBatchDto(batch: RawMaterialBatchWithRelations) {
  const consumedQuantity = Math.max(batch.quantity - batch.remainingQuantity, 0);
  const usagePercent = batch.quantity > 0
    ? Math.round((consumedQuantity / batch.quantity) * 100)
    : 0;

  return {
    id: batch.id,
    businessId: batch.businessId,
    lotCode: batch.lotCode,
    intakeId: batch.intakeId,
    intakeReferenceNumber: batch.intake?.referenceNumber ?? null,
    storageLocationId: batch.storageLocationId,
    storageCode: batch.storageLocation?.code ?? null,
    storageName: batch.storageLocation?.name ?? null,
    materialName: batch.materialName,
    unit: batch.unit,
    quantity: batch.quantity,
    remainingQuantity: batch.remainingQuantity,
    consumedQuantity,
    usagePercent,
    qualityStatus: batch.qualityStatus,
    expiryDate: batch.expiryDate?.toISOString() ?? null,
    isActive: batch.isActive,
    notes: batch.notes,
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
  };
}
