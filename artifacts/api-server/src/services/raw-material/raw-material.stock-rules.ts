import { RawMaterialUnit } from "@prisma/client";

import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import type { RawMaterialStockMovementReason } from "./raw-material-stock-movement.types.js";

export const RAW_MATERIAL_QUANTITY_TOLERANCE = 0.0001;

function rawMaterialRuleError(message: string, details?: Record<string, unknown>): never {
  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message,
    details,
  });
}

export function assertRawMaterialKgBatch(unit: RawMaterialUnit) {
  if (unit === RawMaterialUnit.KG) return;
  rawMaterialRuleError("Raw material stock movement currently supports KG batches only.", { unit });
}

export function assertRawMaterialQuantityRange(params: {
  nextRemaining: number;
  batchQuantity: number;
}) {
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
  if (params.nextUsedKg < -RAW_MATERIAL_QUANTITY_TOLERANCE) {
    rawMaterialRuleError("Storage used quantity cannot become negative.", params);
  }

  if (params.capacityKg > 0 && params.nextUsedKg > params.capacityKg + RAW_MATERIAL_QUANTITY_TOLERANCE) {
    rawMaterialRuleError("Storage capacity would be exceeded.", params);
  }
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
