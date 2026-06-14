import { RawMaterialUnit } from "@prisma/client";

import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import type {
  RawMaterialStockMovementReason,
  RawMaterialStockMovementSource,
  RawMaterialStockMovementType,
} from "./raw-material-stock-movement.types.js";

export const RAW_MATERIAL_QUANTITY_TOLERANCE = 0.0001;

function rawMaterialRuleError(message: string, details?: Record<string, unknown>): never {
  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message,
    details,
  });
}

function isCloseToZero(value: number) {
  return Math.abs(value) <= RAW_MATERIAL_QUANTITY_TOLERANCE;
}

function assertFiniteNumber(value: number, label: string) {
  if (Number.isFinite(value)) return;
  rawMaterialRuleError(`${label} must be a finite number.`, { value });
}

export function assertRawMaterialKgBatch(unit: RawMaterialUnit) {
  if (unit === RawMaterialUnit.KG) return;
  rawMaterialRuleError("Raw material stock movement currently supports KG batches only.", { unit });
}

export function assertRawMaterialQuantityRange(params: {
  nextRemaining: number;
  batchQuantity: number;
}) {
  assertFiniteNumber(params.nextRemaining, "Next remaining quantity");
  assertFiniteNumber(params.batchQuantity, "Batch quantity");

  if (params.nextRemaining < -RAW_MATERIAL_QUANTITY_TOLERANCE) {
    rawMaterialRuleError("Batch remaining quantity cannot become negative.", params);
  }

  if (params.nextRemaining > params.batchQuantity + RAW_MATERIAL_QUANTITY_TOLERANCE) {
    rawMaterialRuleError("Batch remaining quantity cannot exceed batch quantity.", params);
  }
}

export function assertRawMaterialStorageUsage(params: {
  nextUsedKg: number;
  capacityKg: number;
}) {
  assertFiniteNumber(params.nextUsedKg, "Storage used quantity");
  assertFiniteNumber(params.capacityKg, "Storage capacity");

  if (params.nextUsedKg < -RAW_MATERIAL_QUANTITY_TOLERANCE) {
    rawMaterialRuleError("Storage used quantity cannot become negative.", params);
  }

  if (params.capacityKg > 0 && params.nextUsedKg > params.capacityKg + RAW_MATERIAL_QUANTITY_TOLERANCE) {
    rawMaterialRuleError("Storage capacity would be exceeded.", params);
  }
}

export function assertRawMaterialStorageContainsQuantity(params: {
  storageUsedKg: number;
  quantity: number;
  storageLocationId: string;
}) {
  assertFiniteNumber(params.storageUsedKg, "Storage used quantity");
  assertRawMaterialPositiveMovementQuantity(params.quantity, "Storage movement quantity");

  if (params.storageUsedKg + RAW_MATERIAL_QUANTITY_TOLERANCE >= params.quantity) return;

  rawMaterialRuleError("Storage does not contain enough quantity for this stock movement.", params);
}

export function assertRawMaterialPositiveMovementQuantity(quantity: number, label = "Movement quantity") {
  if (Number.isFinite(quantity) && quantity > RAW_MATERIAL_QUANTITY_TOLERANCE) return;
  rawMaterialRuleError(`${label} must be greater than zero.`, { quantity });
}

export function assertRawMaterialDifferentStorage(params: {
  sourceStorageLocationId: string;
  targetStorageLocationId: string;
}) {
  if (params.sourceStorageLocationId !== params.targetStorageLocationId) return;
  rawMaterialRuleError("Target storage location must be different from source storage location.", params);
}

export function assertRawMaterialManualAdjustmentNote(params: {
  reason: RawMaterialStockMovementReason;
  note?: string | null;
}) {
  const reasonRequiresNote = params.reason === "MANUAL_ADJUSTMENT" || params.reason === "CORRECTION";
  const hasNote = typeof params.note === "string" && params.note.trim().length > 0;

  if (!reasonRequiresNote || hasNote) return;

  rawMaterialRuleError("Manual adjustment or correction requires a note.", {
    reason: params.reason,
  });
}

export function assertRawMaterialManualAdjustmentReason(reason: RawMaterialStockMovementReason) {
  const blockedReasons = new Set<RawMaterialStockMovementReason>([
    "PURCHASE",
    "RECEIVING",
    "TRANSFER_IN",
    "TRANSFER_OUT",
    "PRODUCTION_USAGE",
  ]);

  if (!blockedReasons.has(reason)) return;

  rawMaterialRuleError("Adjustment reason is not allowed for manual stock adjustment.", { reason });
}

export function assertRawMaterialStockMovementLedger(params: {
  type: RawMaterialStockMovementType;
  reason: RawMaterialStockMovementReason;
  source: RawMaterialStockMovementSource;
  sourceId?: string | null;
  sourceStorageLocationId?: string | null;
  targetStorageLocationId?: string | null;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
}) {
  assertRawMaterialPositiveMovementQuantity(params.quantity);
  assertFiniteNumber(params.beforeQuantity, "Movement before quantity");
  assertFiniteNumber(params.afterQuantity, "Movement after quantity");

  if (params.beforeQuantity < -RAW_MATERIAL_QUANTITY_TOLERANCE || params.afterQuantity < -RAW_MATERIAL_QUANTITY_TOLERANCE) {
    rawMaterialRuleError("Movement before/after quantity cannot be negative.", params);
  }

  if (params.type === "ADJUSTMENT" || params.type === "CORRECTION") {
    const delta = Math.abs(params.afterQuantity - params.beforeQuantity);
    if (Math.abs(delta - params.quantity) > RAW_MATERIAL_QUANTITY_TOLERANCE) {
      rawMaterialRuleError("Adjustment movement quantity must match before/after quantity delta.", params);
    }
    if (params.source !== "MANUAL" && params.source !== "STOCK_COUNT" && params.source !== "SYSTEM") {
      rawMaterialRuleError("Adjustment movement source must be manual, stock count, or system.", params);
    }
    if (!params.sourceStorageLocationId || !params.targetStorageLocationId) {
      rawMaterialRuleError("Adjustment movement must keep source and target storage references.", params);
    }
    if (params.sourceStorageLocationId !== params.targetStorageLocationId) {
      rawMaterialRuleError("Adjustment movement source and target storage must match.", params);
    }
    return;
  }

  if (params.type === "TRANSFER_OUT" || params.type === "TRANSFER_IN") {
    if (params.reason !== params.type || params.source !== "TRANSFER") {
      rawMaterialRuleError("Transfer movement type, reason, and source must be aligned.", params);
    }
    if (!params.sourceStorageLocationId || !params.targetStorageLocationId) {
      rawMaterialRuleError("Transfer movement requires both source and target storage references.", params);
    }
    assertRawMaterialDifferentStorage({
      sourceStorageLocationId: params.sourceStorageLocationId,
      targetStorageLocationId: params.targetStorageLocationId,
    });
    if (Math.abs(params.beforeQuantity - params.afterQuantity) > RAW_MATERIAL_QUANTITY_TOLERANCE) {
      rawMaterialRuleError("Transfer movement must not change batch remaining quantity.", params);
    }
    return;
  }

  if (params.type === "PRODUCTION_USAGE") {
    if (params.reason !== "PRODUCTION_USAGE" || params.source !== "PROCESSING_RUN" || !params.sourceId) {
      rawMaterialRuleError("Production usage movement must reference a processing run.", params);
    }
    if (!params.sourceStorageLocationId || params.targetStorageLocationId) {
      rawMaterialRuleError("Production usage movement must have source storage only.", params);
    }
    const consumedQuantity = params.beforeQuantity - params.afterQuantity;
    if (Math.abs(consumedQuantity - params.quantity) > RAW_MATERIAL_QUANTITY_TOLERANCE || consumedQuantity <= RAW_MATERIAL_QUANTITY_TOLERANCE) {
      rawMaterialRuleError("Production usage movement quantity must match consumed before/after quantity.", params);
    }
    return;
  }

  if (isCloseToZero(params.afterQuantity - params.beforeQuantity)) return;
}
