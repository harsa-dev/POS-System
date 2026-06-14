export type RawMaterialStockMovementType =
  | "IN"
  | "OUT"
  | "ADJUSTMENT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "PRODUCTION_USAGE"
  | "WASTE"
  | "CORRECTION";

export type RawMaterialStockMovementReason =
  | "PURCHASE"
  | "RECEIVING"
  | "MANUAL_ADJUSTMENT"
  | "STOCK_COUNT"
  | "CORRECTION"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "PRODUCTION_USAGE"
  | "WASTE"
  | "DAMAGED"
  | "EXPIRED"
  | "RETURN";

export type RawMaterialStockMovementSource =
  | "MANUAL"
  | "INTAKE"
  | "BATCH"
  | "PROCESSING_RUN"
  | "TRANSFER"
  | "STOCK_COUNT"
  | "SYSTEM";

export type RawMaterialStockMovementRow = Readonly<{
  id: string;
  businessId: string;
  batchId: string;
  batchLotCode: string | null;
  materialName: string | null;
  sourceStorageLocationId: string | null;
  sourceStorageCode: string | null;
  targetStorageLocationId: string | null;
  targetStorageCode: string | null;
  type: RawMaterialStockMovementType;
  reason: RawMaterialStockMovementReason;
  source: RawMaterialStockMovementSource;
  sourceId: string | null;
  quantity: number;
  beforeQuantity: number | null;
  afterQuantity: number | null;
  note: string | null;
  createdById: string | null;
  createdAt: Date;
}>;

export type RawMaterialStockMovementDto = Readonly<{
  id: string;
  batchId: string;
  batchLotCode: string | null;
  materialName: string | null;
  sourceStorageLocationId: string | null;
  sourceStorageCode: string | null;
  targetStorageLocationId: string | null;
  targetStorageCode: string | null;
  type: RawMaterialStockMovementType;
  reason: RawMaterialStockMovementReason;
  source: RawMaterialStockMovementSource;
  sourceId: string | null;
  quantity: number;
  beforeQuantity: number | null;
  afterQuantity: number | null;
  note: string | null;
  createdById: string | null;
  createdAt: string;
}>;

export type RawMaterialStockMovementQuery = Readonly<{
  batchId?: string;
  type?: RawMaterialStockMovementType | string;
  reason?: RawMaterialStockMovementReason | string;
  source?: RawMaterialStockMovementSource | string;
  sourceId?: string;
  storageLocationId?: string;
  search?: string;
}>;

export type RawMaterialAdjustmentInput = Readonly<{
  batchId?: unknown;
  deltaQuantity?: unknown;
  reason?: unknown;
  note?: unknown;
}>;

export type RawMaterialAdjustmentReversalInput = Readonly<{
  movementId?: unknown;
  note?: unknown;
}>;

export type RawMaterialTransferInput = Readonly<{
  batchId?: unknown;
  targetStorageLocationId?: unknown;
  note?: unknown;
}>;

export type RawMaterialProcessingConsumptionInput = Readonly<{
  processingRunId?: unknown;
  note?: unknown;
}>;
