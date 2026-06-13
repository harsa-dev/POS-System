import type {
  RawMaterialAdjustmentInput,
  RawMaterialProcessingConsumptionInput,
  RawMaterialStockMovementReason,
  RawMaterialStockMovementSource,
  RawMaterialStockMovementType,
  RawMaterialTransferInput,
} from "./raw-material-stock-movement.types.js";

const allowedTypes = new Set<RawMaterialStockMovementType>([
  "IN",
  "OUT",
  "ADJUSTMENT",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "PRODUCTION_USAGE",
  "WASTE",
  "CORRECTION",
]);

const allowedReasons = new Set<RawMaterialStockMovementReason>([
  "PURCHASE",
  "RECEIVING",
  "MANUAL_ADJUSTMENT",
  "STOCK_COUNT",
  "CORRECTION",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "PRODUCTION_USAGE",
  "WASTE",
  "DAMAGED",
  "EXPIRED",
  "RETURN",
]);

const allowedSources = new Set<RawMaterialStockMovementSource>([
  "MANUAL",
  "INTAKE",
  "BATCH",
  "PROCESSING_RUN",
  "TRANSFER",
  "STOCK_COUNT",
  "SYSTEM",
]);

function asString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asOptionalText(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim().length > 0) return Number(value);
  return Number.NaN;
}

export function normalizeRawMaterialStockMovementType(value: unknown) {
  const type = asString(value)?.toUpperCase() as RawMaterialStockMovementType | undefined;
  if (!type || !allowedTypes.has(type)) return undefined;
  return type;
}

export function normalizeRawMaterialStockMovementReason(value: unknown) {
  const reason = asString(value)?.toUpperCase() as RawMaterialStockMovementReason | undefined;
  if (!reason || !allowedReasons.has(reason)) return undefined;
  return reason;
}

export function normalizeRawMaterialStockMovementSource(value: unknown) {
  const source = asString(value)?.toUpperCase() as RawMaterialStockMovementSource | undefined;
  if (!source || !allowedSources.has(source)) return undefined;
  return source;
}

export function validateRawMaterialAdjustmentInput(input: RawMaterialAdjustmentInput) {
  const batchId = asString(input.batchId);
  const deltaQuantity = asNumber(input.deltaQuantity);
  const reason = normalizeRawMaterialStockMovementReason(input.reason) ?? "MANUAL_ADJUSTMENT";
  const note = asOptionalText(input.note);

  if (!batchId) throw new Error("Batch id is required");
  if (!Number.isFinite(deltaQuantity) || deltaQuantity === 0) {
    throw new Error("Adjustment delta quantity must be a non-zero number");
  }
  if (reason === "TRANSFER_IN" || reason === "TRANSFER_OUT" || reason === "PRODUCTION_USAGE") {
    throw new Error("Adjustment reason is not allowed for manual adjustment");
  }

  return { batchId, deltaQuantity, reason, note };
}

export function validateRawMaterialTransferInput(input: RawMaterialTransferInput) {
  const batchId = asString(input.batchId);
  const targetStorageLocationId = asString(input.targetStorageLocationId);
  const note = asOptionalText(input.note);

  if (!batchId) throw new Error("Batch id is required");
  if (!targetStorageLocationId) throw new Error("Target storage location id is required");

  return { batchId, targetStorageLocationId, note };
}

export function validateRawMaterialProcessingConsumptionInput(input: RawMaterialProcessingConsumptionInput) {
  const processingRunId = asString(input.processingRunId);
  const note = asOptionalText(input.note);

  if (!processingRunId) throw new Error("Processing run id is required");

  return { processingRunId, note };
}
