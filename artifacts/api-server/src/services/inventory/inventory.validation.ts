import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import {
  DEFAULT_STOCK_MOVEMENT_LIST_LIMIT,
  MAX_STOCK_MOVEMENT_LIST_LIMIT,
} from "./inventory.constants.js";

export function assertRequiredString(value: unknown, field: string) {
  if (typeof value === "string" && value.trim()) return value.trim();

  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message: `${field} is required.`,
  });
}

export function parseOptionalString(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "string") return value.trim() || null;
  return String(value).trim() || null;
}

export function assertEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string
) {
  if (typeof value === "string" && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }

  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message: `Invalid ${field}.`,
    details: { field, allowed },
  });
}

export function parseNonNegativeNumber(
  value: unknown,
  field: string,
  defaultValue?: number
) {
  if (value === undefined || value === null || value === "") {
    if (defaultValue !== undefined) return defaultValue;

    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: `${field} is required.`,
    });
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.invalidStockQuantity,
      message: `${field} must be a non-negative number.`,
    });
  }

  return numberValue;
}

export function parsePositiveNumber(value: unknown, field: string) {
  const numberValue = parseNonNegativeNumber(value, field);

  if (numberValue <= 0) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.invalidStockQuantity,
      message: `${field} must be greater than zero.`,
    });
  }

  return numberValue;
}

export function parseStockMovementLimit(value: unknown) {
  const rawLimit = value === undefined || value === null || value === ""
    ? DEFAULT_STOCK_MOVEMENT_LIST_LIMIT
    : Number(value);

  if (!Number.isFinite(rawLimit)) return DEFAULT_STOCK_MOVEMENT_LIST_LIMIT;

  return Math.min(
    Math.max(Math.floor(rawLimit), 1),
    MAX_STOCK_MOVEMENT_LIST_LIMIT
  );
}
