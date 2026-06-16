import type { Role } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { ALL_ROLES, MANAGEMENT_ROLES } from "../lib/constants.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

const PLANNED_MODE_REASON =
  "Customers & Partners is not operational for planned service/custom-business mode yet.";

function isPlannedMode(businessMode: string) {
  return businessMode === "custom-business";
}

function canManage(role: Role) {
  return MANAGEMENT_ROLES.includes(role);
}

router.get("/customers-partners-capabilities", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const planned = isPlannedMode(businessContext.businessMode);
    const manage = canManage(user.role) && !planned;

    return successResponse(res, {
      data: {
        businessId: businessContext.businessId,
        businessMode: businessContext.businessMode,
        canView: !planned,
        canCreate: manage,
        canUpdate: manage,
        canDelete: manage,
        canExport: !planned,
        canImport: manage,
        canSyncFromSales: manage,
        isPlannedMode: planned,
        plannedReason: planned ? PLANNED_MODE_REASON : null,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
