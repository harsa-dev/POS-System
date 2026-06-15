import type { Response } from "express";

import { successResponse } from "../../../lib/responses/success-response.js";
import { ADMIN_ROLE_CONSOLE_POLICY } from "./admin-role-console.policy.js";
import type { AdminRoleConsoleApiMetaDto, AdminRoleConsoleSource } from "./admin-role-console.types.js";

export function getAdminRoleConsoleApiMeta({
  generatedAt = new Date().toISOString(),
  source = "api",
  mock = true,
}: {
  generatedAt?: string;
  source?: AdminRoleConsoleSource;
  mock?: boolean;
} = {}): AdminRoleConsoleApiMetaDto {
  return {
    generatedAt,
    source,
    mock,
    mode: ADMIN_ROLE_CONSOLE_POLICY.mode,
    capability: ADMIN_ROLE_CONSOLE_POLICY.capability,
    readOnly: true,
  };
}

export function adminRoleConsoleSuccessResponse<TData>(res: Response, payload: {
  data: TData;
  generatedAt?: string;
  source?: AdminRoleConsoleSource;
  mock?: boolean;
}) {
  return successResponse(res, {
    data: payload.data,
    meta: getAdminRoleConsoleApiMeta({
      generatedAt: payload.generatedAt,
      source: payload.source,
      mock: payload.mock,
    }),
  });
}
