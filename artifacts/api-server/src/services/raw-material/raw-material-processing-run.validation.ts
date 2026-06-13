import type { RawMaterialProcessingStatus } from "@prisma/client";

import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import type { RawMaterialProcessingRunInput } from "./raw-material-processing-run.types.js";

const PROCESSING_STATUSES: readonly RawMaterialProcessingStatus[] = ["PLANNED", "RUNNING", "COMPLETED", "CANCELLED"];

function fail(message: string, field?: string): never {
  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message,
    details: field ? { field } : undefined,
  });
}

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

export function validateRawMaterialProcessingRunInput(input: RawMaterialProcessingRunInput, mode: "create" | "update") {
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
    if (!runNumber) fail("runNumber is required", "runNumber");
    if (!inputBatchId) fail("inputBatchId is required", "inputBatchId");
    if (!outputName) fail("outputName is required", "outputName");
    if (inputQuantity === undefined) fail("inputQuantity is required", "inputQuantity");
  }

  if (input.runNumber !== undefined && !runNumber) fail("runNumber must be a non-empty string", "runNumber");
  if (input.inputBatchId !== undefined && !inputBatchId) fail("inputBatchId must be a non-empty string", "inputBatchId");
  if (input.outputName !== undefined && !outputName) fail("outputName must be a non-empty string", "outputName");
  if (input.status !== undefined && !status) fail("status is invalid", "status");
  if (inputQuantity !== undefined && inputQuantity <= 0) fail("inputQuantity must be greater than 0", "inputQuantity");
  if (outputQuantity < 0 || byproductQuantity < 0 || wasteQuantity < 0) fail("processing quantities cannot be negative");
  if (input.startedAt !== undefined && !startedAt) fail("startedAt must be a valid date", "startedAt");
  if (input.completedAt !== undefined && !completedAt) fail("completedAt must be a valid date", "completedAt");
  if (startedAt && completedAt && completedAt < startedAt) fail("completedAt cannot be earlier than startedAt", "completedAt");
  if (inputQuantity !== undefined && outputQuantity + byproductQuantity + wasteQuantity > inputQuantity) fail("processing output cannot exceed inputQuantity");
  if (status === "COMPLETED" && outputQuantity <= 0) fail("completed processing run must have outputQuantity greater than 0", "outputQuantity");

  return { runNumber, inputBatchId, outputName, inputQuantity, outputQuantity, byproductQuantity, wasteQuantity, status, startedAt, completedAt, notes };
}
