import type { RawMaterialProcessingStatus } from "@prisma/client";

import { ValidationError } from "../../utils/errors.js";
import type { RawMaterialProcessingRunInput } from "./raw-material-processing-run.types.js";

const PROCESSING_STATUSES: readonly RawMaterialProcessingStatus[] = [
  "PLANNED",
  "RUNNING",
  "COMPLETED",
  "CANCELLED",
];

function toText(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function toDate(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const date = new Date(value as string | Date);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toProcessingStatus(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toUpperCase() as RawMaterialProcessingStatus;
  return PROCESSING_STATUSES.includes(normalized) ? normalized : undefined;
}

export function validateRawMaterialProcessingRunInput(
  input: RawMaterialProcessingRunInput,
  mode: "create" | "update",
) {
  const runNumber = toText(input.runNumber);
  const inputBatchId = toText(input.inputBatchId);
  const outputName = toText(input.outputName);
  const inputQuantity = toNumber(input.inputQuantity);
  const outputQuantity = toNumber(input.outputQuantity) ?? 0;
  const byproductQuantity = toNumber(input.byproductQuantity) ?? 0;
  const wasteQuantity = toNumber(input.wasteQuantity) ?? 0;
  const status = toProcessingStatus(input.status);
  const startedAt = toDate(input.startedAt);
  const completedAt = toDate(input.completedAt);
  const notes = toText(input.notes);

  if (mode === "create") {
    if (!runNumber) throw new ValidationError("Run number is required");
    if (!inputBatchId) throw new ValidationError("Input batch is required");
    if (!outputName) throw new ValidationError("Output name is required");
    if (inputQuantity === undefined) throw new ValidationError("Input quantity is required");
  }

  if (input.runNumber !== undefined && !runNumber) throw new ValidationError("Run number must be a non-empty string");
  if (input.inputBatchId !== undefined && !inputBatchId) throw new ValidationError("Input batch must be a non-empty string");
  if (input.outputName !== undefined && !outputName) throw new ValidationError("Output name must be a non-empty string");
  if (input.status !== undefined && !status) throw new ValidationError("Invalid processing status");
  if (inputQuantity !== undefined && inputQuantity <= 0) throw new ValidationError("Input quantity must be greater than 0");
  if (outputQuantity < 0 || byproductQuantity < 0 || wasteQuantity < 0) {
    throw new ValidationError("Processing quantities cannot be negative");
  }
  if (input.startedAt !== undefined && !startedAt) throw new ValidationError("Started at must be a valid date");
  if (input.completedAt !== undefined && !completedAt) throw new ValidationError("Completed at must be a valid date");
  if (startedAt && completedAt && completedAt < startedAt) {
    throw new ValidationError("Completed at cannot be earlier than started at");
  }
  if (inputQuantity !== undefined && outputQuantity + byproductQuantity + wasteQuantity > inputQuantity) {
    throw new ValidationError("Processing output cannot exceed input quantity");
  }
  if (status === "COMPLETED" && outputQuantity <= 0) {
    throw new ValidationError("Completed processing run must have output quantity greater than 0");
  }

  return {
    runNumber,
    inputBatchId,
    outputName,
    inputQuantity,
    outputQuantity,
    byproductQuantity,
    wasteQuantity,
    status,
    startedAt,
    completedAt,
    notes,
  };
}
