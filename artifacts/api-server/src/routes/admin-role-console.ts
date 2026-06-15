import { Router, type IRouter } from "express";

import { requireRole } from "../lib/auth.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { ADMIN_ROLE_CONSOLE_POLICY } from "../services/platform-admin/admin-role-console/admin-role-console.policy.js";
import { adminRoleConsoleSuccessResponse } from "../services/platform-admin/admin-role-console/admin-role-console-response.js";
import { getAdminRoleConsoleOverview } from "../services/platform-admin/admin-role-console/admin-role-console.service.js";

const router: IRouter = Router();

async function requireAdminRoleConsoleAccess(req: Parameters<typeof requireRole>[0], res: Parameters<typeof requireRole>[1]) {
  return requireRole(req, res, [...ADMIN_ROLE_CONSOLE_POLICY.allowedRoles]);
}

router.get("/internal/admin-console/roles", async (req, res) => {
  try {
    const user = await requireAdminRoleConsoleAccess(req, res);
    if (!user) return;

    const data = getAdminRoleConsoleOverview();

    return adminRoleConsoleSuccessResponse(res, {
      data,
      generatedAt: data.generatedAt,
      source: data.source,
      mock: true,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
