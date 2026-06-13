import type { RawMaterialSupplierCategory } from "@prisma/client";

import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";

export const RAW_MATERIAL_SUPPLIER_CATEGORIES = [
  "FEED",
  "LIVESTOCK",
  "PACKAGING",
  "RAW_GOODS",
] as const satisfies readonly RawMaterialSupplierCategory[];

export function parseRequiredString(value: unknown, field: string) {
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

export function parseOptionalString(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseOptionalBoolean(value: unknown) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  return undefined;
}

export function parseIntegerRange(
  value: unknown,
  field: string,
  defaultValue: number,
  min: number,
  max: number,
) {
  if (value === undefined || value === null || value === "") return defaultValue;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: `${field} must be an integer between ${min} and ${max}.`,
      details: { field, min, max },
    });
  }

  return parsed;
}

export function parseSupplierCategory(value: unknown) {
  if (value === undefined || value === null || value === "") return "RAW_GOODS";

  if (
    typeof value === "string" &&
    RAW_MATERIAL_SUPPLIER_CATEGORIES.includes(value as RawMaterialSupplierCategory)
  ) {
    return value as RawMaterialSupplierCategory;
  }

  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message: "Invalid raw material supplier category.",
    details: { allowed: RAW_MATERIAL_SUPPLIER_CATEGORIES },
  });
}
