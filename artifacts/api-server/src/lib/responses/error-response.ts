import type { Response } from "express";

import type { ApiErrorResponse } from "./api-response.types.js";

export function errorResponse(
  res: Response,
  input: {
    message: string;
    code: string;
    details?: unknown;
    requestId?: string;
    status?: number;
  }
) {
  const body: ApiErrorResponse = {
    success: false,
    message: input.message,
    code: input.code,
  };

  if (input.details !== undefined) {
    body.details = input.details;
  }

  if (input.requestId) {
    body.requestId = input.requestId;
  }

  return res.status(input.status ?? 400).json(body);
}
