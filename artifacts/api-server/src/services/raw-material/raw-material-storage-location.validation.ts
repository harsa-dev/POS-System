import type { RawMaterialStorageType } from "@prisma/client";

import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";

export const RAW_MATERIAL_STORAGE_TYPES = [
  "DRY",
  "COLD",
  "OPEN_YARD",
  "KANDANG_SUPPORT",
] as const satisfies readonly RawMaterialStorageType[];

export function parseStorageRequiredString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: `${field} is required.`,
      details: { field },
    });
  }

  return value.trim();
}

export function parseStorageOptionalString(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseStorageOptionalBoolean(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  return undefined;
}

export function parseStorageType(value: unknown) {
  if (value === undefined || value === null || value === "") return "DRY";

  if (
    typeof value === "string" &&
    RAW_MATERIAL_STORAGE_TYPES.includes(value as RawMaterialStorageType)
  ) {
    return value as RawMaterialStorageType;
  }

  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message: "Invalid raw material storage type.",
    details: { allowed: RAW_MATERIAL_STORAGE_TYPES },
  });
}

export function parseStorageNonNegativeNumber(
  value: unknown,
  field: string,
  defaultValue: number,
) {
  if (value === undefined || value === null || value === "") return defaultValue;

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: `${field} must be a non-negative number.`,
      details: { field },
    });
  }

  return parsed;
}

export function parseStorageOptionalNumber(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return null;

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: `${field} must be a valid number.`,
      details: { field },
    });
  }

  return parsed;
}
