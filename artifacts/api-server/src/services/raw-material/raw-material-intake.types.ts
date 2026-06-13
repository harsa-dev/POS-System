import type { RawMaterialIntakeStatus, RawMaterialUnit, Role } from "@prisma/client";

export type RawMaterialActor = Readonly<{
  id: string;
  role: Role;
}>;

export type RawMaterialIntakeDto = Readonly<{
  id: string;
  businessId: string;
  referenceNumber: string;
  supplierId: string;
  supplierName: string;
  targetStorageLocationId: string;
  targetStorageCode: string;
  materialName: string;
  unit: RawMaterialUnit;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  pendingQuantity: number;
  qualityStatus: RawMaterialIntakeStatus;
  receivedAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}>;
