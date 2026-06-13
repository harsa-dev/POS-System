export type RawMaterialPenHealthStatus = "STABLE" | "MONITORING" | "CRITICAL";

export type RawMaterialPenInput = Readonly<{
  code?: unknown;
  flockName?: unknown;
  capacity?: unknown;
  occupancy?: unknown;
  feedBatchId?: unknown;
  healthStatus?: unknown;
  isActive?: unknown;
  notes?: unknown;
}>;

export type RawMaterialPenQuery = Readonly<{
  feedBatchId?: string;
  healthStatus?: RawMaterialPenHealthStatus;
  isActive?: boolean;
  search?: string;
}>;

export type RawMaterialPenRow = Readonly<{
  id: string;
  businessId: string;
  code: string;
  flockName: string;
  capacity: number;
  occupancy: number;
  feedBatchId: string | null;
  feedBatchLotCode: string | null;
  feedBatchMaterialName: string | null;
  healthStatus: RawMaterialPenHealthStatus;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}>;

export type RawMaterialPenDto = Readonly<{
  id: string;
  code: string;
  flockName: string;
  capacity: number;
  occupancy: number;
  availableCapacity: number;
  occupancyPercent: number;
  feedBatchId: string | null;
  feedBatchLotCode: string | null;
  feedBatchMaterialName: string | null;
  healthStatus: RawMaterialPenHealthStatus;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}>;
