import type { RawMaterialIntakeStatus, RawMaterialUnit } from "@prisma/client";

import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";

const rawMaterialUnits: readonly RawMaterialUnit[] = [
  "KG",
  "SACK",
  "CRATE",
  "HEAD",
  "LITER",
  "PCS",
];

const rawMaterialIntakeStatuses: readonly RawMaterialIntakeStatus[] = [
  "DRAFT",
  "INSPECTION",
  "ACCEPTED",
  "PARTIALLY_REJECTED",
  "REJECTED",
  "CANCELLED",
];

function failValidation(message: string, details?: Record<string, unknown>): never {
  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message,
    details,
  });
}

export function parseIntakeRequiredString(value: unknown, field: string) {
  if (typeof value !== "string") {
    failValidation(`${field} is required.`, { field });
  }

  const trimmed = value.trim();
  if (!trimmed) {
    failValidation(`${field} cannot be empty.`, { field });
  }

  return trimmed;
}

export function parseIntakeOptionalString(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    failValidation("Optional text fields must be strings.");
  }

  const trimmed = value.trim();
  return trimmed || null;
}

export function parseIntakePositiveNumber(value: unknown, field: string) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    failValidation(`${field} must be greater than 0.`, { field, value });
  }

  return numericValue;
}

export function parseIntakeNonNegativeNumber(
  value: unknown,
  field: string,
  fallback = 0,
) {
  if (value === undefined || value === null || value === "") return fallback;

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    failValidation(`${field} must be 0 or greater.`, { field, value });
  }

  return numericValue;
}

export function parseRawMaterialUnit(value: unknown): RawMaterialUnit {
  if (value === undefined || value === null || value === "") return "KG";
  if (typeof value !== "string") {
    failValidation("unit must be a string.");
  }

  const normalized = value.trim().toUpperCase() as RawMaterialUnit;
  if (!rawMaterialUnits.includes(normalized)) {
    failValidation("Invalid raw material unit.", { unit: value, allowed: rawMaterialUnits });
  }

  return normalized;
}

export function parseRawMaterialIntakeStatus(value: unknown): RawMaterialIntakeStatus {
  if (value === undefined || value === null || value === "") return "INSPECTION";
  if (typeof value !== "string") {
    failValidation("qualityStatus must be a string.");
  }

  const normalized = value.trim().toUpperCase() as RawMaterialIntakeStatus;
  if (!rawMaterialIntakeStatuses.includes(normalized)) {
    failValidation("Invalid raw material intake status.", {
      qualityStatus: value,
      allowed: rawMaterialIntakeStatuses,
    });
  }

  return normalized;
}

export function parseIntakeOptionalDate(value: unknown, fallback = new Date()) {
  if (value === undefined || value === null || value === "") return fallback;

  if (typeof value !== "string" && !(value instanceof Date)) {
    failValidation("receivedAt must be a date string.");
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    failValidation("receivedAt must be a valid date.", { receivedAt: value });
  }

  return date;
}
