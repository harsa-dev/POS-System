import type { RawMaterialProcessingStatus } from "@prisma/client";

export type RawMaterialProcessingRunQuery = Readonly<{
  inputBatchId?: string;
  status?: RawMaterialProcessingStatus;
  search?: string;
}>;

export type RawMaterialProcessingRunInput = Readonly<{
  runNumber?: unknown;
  inputBatchId?: unknown;
  outputName?: unknown;
  inputQuantity?: unknown;
  outputQuantity?: unknown;
  byproductQuantity?: unknown;
  wasteQuantity?: unknown;
  status?: unknown;
  startedAt?: unknown;
  completedAt?: unknown;
  notes?: unknown;
}>;

export type RawMaterialProcessingRunDto = Readonly<{
  id: string;
  businessId: string;
  runNumber: string;
  inputBatchId: string;
  inputBatchLotCode: string;
  inputMaterialName: string;
  outputName: string;
  inputQuantity: number;
  outputQuantity: number;
  byproductQuantity: number;
  wasteQuantity: number;
  totalOutputQuantity: number;
  yieldPercent: number;
  lossQuantity: number;
  status: RawMaterialProcessingStatus;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}>;
