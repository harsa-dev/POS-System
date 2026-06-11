import type { Response } from "express";

import { errorCodes } from "./error-codes.js";
import { isAppError } from "./app-error.js";
import { errorResponse } from "../responses/error-response.js";

export function handleApiError(
  res: Response,
  error: unknown,
  requestId?: string
) {
  if (isAppError(error)) {
    return errorResponse(res, {
      message: error.message,
      code: error.code,
      details: error.details,
      status: error.statusCode,
      requestId,
    });
  }

  console.error("Unhandled API error", {
    requestId,
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorMessage: error instanceof Error ? error.message : "Unknown error",
  });

  return errorResponse(res, {
    message: "Internal server error.",
    code: errorCodes.internalServerError,
    status: 500,
    requestId,
  });
}
