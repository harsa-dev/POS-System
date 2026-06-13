import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";

const WEIGHING_NET_TOLERANCE = 0.001;

function validationError(message: string, details?: Record<string, unknown>): never {
  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message,
    details,
  });
}

export function parseWeighingRequiredString(value: unknown, field: string) {
  if (typeof value !== "string") {
    validationError(`${field} is required.`, { field });
  }

  const trimmed = value.trim();

  if (!trimmed) {
    validationError(`${field} is required.`, { field });
  }

  return trimmed;
}

export function parseWeighingOptionalString(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") validationError("notes must be a string.", { field: "notes" });

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function parseWeighingPositiveNumber(value: unknown, field: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    validationError(`${field} must be a positive number.`, { field, value });
  }

  return parsed;
}

export function parseWeighingNonNegativeNumber(value: unknown, field: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    validationError(`${field} must be a non-negative number.`, { field, value });
  }

  return parsed;
}

export function parseWeighingOptionalDate(value: unknown) {
  if (value === undefined || value === null || value === "") return new Date();
  if (typeof value !== "string") validationError("measuredAt must be an ISO date string.", { field: "measuredAt" });

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    validationError("measuredAt must be a valid ISO date string.", { field: "measuredAt", value });
  }

  return parsed;
}

export function assertWeighingNetBalance(params: {
  grossKg: number;
  tareKg: number;
  netKg: number;
}) {
  if (params.tareKg > params.grossKg) {
    validationError("tareKg cannot exceed grossKg.", params);
  }

  const expectedNetKg = params.grossKg - params.tareKg;
  const delta = Math.abs(expectedNetKg - params.netKg);

  if (delta <= WEIGHING_NET_TOLERANCE) return;

  validationError("netKg must equal grossKg - tareKg.", {
    ...params,
    expectedNetKg,
  });
}
