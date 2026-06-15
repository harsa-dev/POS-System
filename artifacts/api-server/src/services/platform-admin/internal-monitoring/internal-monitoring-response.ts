import type { Response } from "express";

import { successResponse } from "../../../lib/responses/success-response.js";
import { INTERNAL_MONITORING_POLICY } from "./internal-monitoring.policy.js";
import type {
  InternalMonitoringApiMetaDto,
  InternalMonitoringSource,
} from "./internal-monitoring.types.js";

export function getInternalMonitoringApiMeta({
  generatedAt = new Date().toISOString(),
  source = "api",
  mock = true,
  mutationMode,
}: {
  generatedAt?: string;
  source?: InternalMonitoringSource;
  mock?: boolean;
  mutationMode?: "design-only" | "disabled";
} = {}): InternalMonitoringApiMetaDto {
  return {
    generatedAt,
    source,
    mock,
    mode: INTERNAL_MONITORING_POLICY.mode,
    capability: INTERNAL_MONITORING_POLICY.capability,
    readOnly: true,
    ...(mutationMode ? { mutationMode } : {}),
  };
}

export function internalMonitoringSuccessResponse<TData>(
  res: Response,
  {
    data,
    generatedAt,
    source,
    mock,
    mutationMode,
  }: {
    data: TData;
    generatedAt?: string;
    source?: InternalMonitoringSource;
    mock?: boolean;
    mutationMode?: "design-only" | "disabled";
  },
) {
  return successResponse(res, {
    data,
    meta: getInternalMonitoringApiMeta({
      generatedAt,
      source,
      mock,
      mutationMode,
    }),
  });
}
