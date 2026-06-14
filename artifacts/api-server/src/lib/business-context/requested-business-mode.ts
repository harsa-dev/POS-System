import type { Request, RequestHandler } from "express";

import { errorCodes } from "../errors/error-codes.js";
import { errorResponse } from "../responses/error-response.js";

export const BUSINESS_MODE_HEADER = "x-business-mode" as const;

export const apiBusinessModes = [
  "restaurant",
  "retail",
  "raw-material",
  "custom-business",
] as const;

export type ApiBusinessMode = (typeof apiBusinessModes)[number];

function isApiBusinessMode(value: string): value is ApiBusinessMode {
  return apiBusinessModes.some((mode) => mode === value);
}

export function normalizeRequestedBusinessMode(
  value: unknown,
): ApiBusinessMode | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (isApiBusinessMode(normalized)) return normalized;

  return null;
}

export function getRequestedBusinessMode(req: Request): ApiBusinessMode | null {
  return normalizeRequestedBusinessMode(req.header(BUSINESS_MODE_HEADER));
}

export function requireBusinessMode(
  allowedModes: readonly ApiBusinessMode[],
): RequestHandler {
  return (req, res, next) => {
    const requestedMode = getRequestedBusinessMode(req);

    // Backward compatibility: old clients that do not send the header still use
    // auth + restaurantId ownership checks as the tenant isolation source.
    if (!requestedMode) {
      next();
      return;
    }

    if (allowedModes.includes(requestedMode)) {
      next();
      return;
    }

    return errorResponse(res, {
      status: 409,
      code: errorCodes.businessModeMismatch,
      message: `Business mode mismatch. This endpoint only supports ${allowedModes.join(", ")} mode.`,
      details: {
        requestedMode,
        allowedModes,
        header: BUSINESS_MODE_HEADER,
      },
    });
  };
}
