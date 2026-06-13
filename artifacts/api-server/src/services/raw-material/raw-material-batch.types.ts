import type { RawMaterialBatchQualityStatus, RawMaterialUnit } from "@prisma/client";

export type RawMaterialBatchQuery = Readonly<{
  intakeId?: string;
  storageLocationId?: string;
  qualityStatus?: RawMaterialBatchQualityStatus;
  isActive?: boolean;
  search?: string;
}>;

export type RawMaterialBatchPayload = Readonly<{
  lotCode?: unknown;
  intakeId?: unknown;
  storageLocationId?: unknown;
  materialName?: unknown;
  unit?: unknown;
  quantity?: unknown;
  remainingQuantity?: unknown;
  qualityStatus?: unknown;
  expiryDate?: unknown;
  isActive?: unknown;
  notes?: unknown;
}>;

export type NormalizedRawMaterialBatchPayload = Readonly<{
  lotCode: string;
  intakeId: string;
  storageLocationId: string;
  materialName: string;
  unit: RawMaterialUnit;
  quantity: number;
  remainingQuantity: number;
  qualityStatus: RawMaterialBatchQualityStatus;
  expiryDate: Date | null;
  isActive: boolean;
  notes: string | null;
}>;

export type RawMaterialBatchUpdatePayload = Partial<{
  lotCode: string;
  intakeId: string;
  storageLocationId: string;
  materialName: string;
  unit: RawMaterialUnit;
  quantity: number;
  remainingQuantity: number;
  qualityStatus: RawMaterialBatchQualityStatus;
  expiryDate: Date | null;
  isActive: boolean;
  notes: string | null;
}>;
