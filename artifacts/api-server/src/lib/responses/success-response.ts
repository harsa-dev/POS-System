import type { Response } from "express";

import type { ApiMeta, ApiSuccessResponse } from "./api-response.types.js";

export function successResponse<TData>(
  res: Response,
  {
    data,
    message,
    meta,
    requestId,
    status = 200,
  }: {
    data: TData;
    message?: string;
    meta?: ApiMeta;
    requestId?: string;
    status?: number;
  }
) {
  const body: ApiSuccessResponse<TData> = {
    success: true,
    data,
  };

  if (message) body.message = message;
  if (meta) body.meta = meta;
  if (requestId) body.requestId = requestId;

  return res.status(status).json(body);
}
