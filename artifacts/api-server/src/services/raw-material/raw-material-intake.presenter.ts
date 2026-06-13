import type { Prisma } from "@prisma/client";

import type { RawMaterialIntakeDto } from "./raw-material-intake.types.js";

export type RawMaterialIntakeWithRelations = Prisma.RawMaterialIntakeGetPayload<{
  include: {
    supplier: { select: { id: true; name: true } };
    targetStorageLocation: { select: { id: true; code: true } };
  };
}>;

export function toRawMaterialIntakeDto(
  intake: RawMaterialIntakeWithRelations,
): RawMaterialIntakeDto {
  const pendingQuantity = Math.max(
    intake.receivedQuantity - intake.acceptedQuantity - intake.rejectedQuantity,
    0,
  );

  return {
    id: intake.id,
    businessId: intake.businessId,
    referenceNumber: intake.referenceNumber,
    supplierId: intake.supplierId,
    supplierName: intake.supplier.name,
    targetStorageLocationId: intake.targetStorageLocationId,
    targetStorageCode: intake.targetStorageLocation.code,
    materialName: intake.materialName,
    unit: intake.unit,
    receivedQuantity: intake.receivedQuantity,
    acceptedQuantity: intake.acceptedQuantity,
    rejectedQuantity: intake.rejectedQuantity,
    pendingQuantity,
    qualityStatus: intake.qualityStatus,
    receivedAt: intake.receivedAt.toISOString(),
    notes: intake.notes,
    createdAt: intake.createdAt.toISOString(),
    updatedAt: intake.updatedAt.toISOString(),
  };
}
