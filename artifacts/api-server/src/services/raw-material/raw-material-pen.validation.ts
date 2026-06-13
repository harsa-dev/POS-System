import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import type { RawMaterialPenHealthStatus, RawMaterialPenInput } from "./raw-material-pen.types.js";

const healthStatuses = new Set<RawMaterialPenHealthStatus>(["STABLE", "MONITORING", "CRITICAL"]);

function validationError(message: string): never {
  throw new AppError({ statusCode: 400, code: errorCodes.validationError, message });
}

function optionalString(value: unknown, field: string) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") validationError(`${field} must be a string.`);
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredString(value: unknown, field: string, mode: "create" | "update") {
  if (value === undefined || value === null) {
    if (mode === "create") validationError(`${field} is required.`);
    return undefined;
  }
  if (typeof value !== "string") validationError(`${field} must be a string.`);
  const trimmed = value.trim();
  if (!trimmed) validationError(`${field} is required.`);
  return trimmed;
}

function optionalNonNegativeInteger(value: unknown, field: string) {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    validationError(`${field} must be a non-negative integer.`);
  }
  return value;
}

function optionalBoolean(value: unknown, field: string) {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") validationError(`${field} must be a boolean.`);
  return value;
}

function optionalHealthStatus(value: unknown) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") validationError("healthStatus must be a string.");
  const normalized = value.toUpperCase() as RawMaterialPenHealthStatus;
  if (!healthStatuses.has(normalized)) validationError("Invalid healthStatus.");
  return normalized;
}

export function validateRawMaterialPenInput(input: RawMaterialPenInput, mode: "create" | "update") {
  const code = requiredString(input.code, "code", mode);
  const flockName = requiredString(input.flockName, "flockName", mode);
  const capacity = optionalNonNegativeInteger(input.capacity, "capacity");
  const occupancy = optionalNonNegativeInteger(input.occupancy, "occupancy");
  const feedBatchId = optionalString(input.feedBatchId, "feedBatchId");
  const healthStatus = optionalHealthStatus(input.healthStatus);
  const isActive = optionalBoolean(input.isActive, "isActive");
  const notes = optionalString(input.notes, "notes");

  if (capacity !== undefined && occupancy !== undefined && occupancy > capacity) {
    validationError("occupancy cannot exceed capacity.");
  }

  return {
    code,
    flockName,
    capacity,
    occupancy,
    feedBatchId,
    healthStatus,
    isActive,
    notes,
  };
}
