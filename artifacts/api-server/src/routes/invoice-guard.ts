import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { ALL_ROLES, MANAGEMENT_ROLES, POS_ROLES } from "../lib/constants.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

function isPlannedInvoiceMode(businessMode: string) {
  return businessMode === "custom-business";
}

function getPlannedReason(businessMode: string) {
  if (!isPlannedInvoiceMode(businessMode)) return null;
  return "Service/custom business invoice generation is planned and not operational yet.";
}

function isManagementRole(role: string) {
  return MANAGEMENT_ROLES.includes(role as (typeof MANAGEMENT_ROLES)[number]);
}

function isPosRole(role: string) {
  return POS_ROLES.includes(role as (typeof POS_ROLES)[number]);
}

router.get("/invoice-capabilities", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const plannedReason = getPlannedReason(businessContext.businessMode);
    const isPlannedMode = Boolean(plannedReason);
    const canManage = isManagementRole(user.role) && !isPlannedMode;
    const canView = isPosRole(user.role) && !isPlannedMode;

    return successResponse(res, {
      data: {
        businessId: businessContext.businessId,
        businessMode: businessContext.businessMode,
        canView,
        canCreate: canManage,
        canUpdate: canManage,
        canCancel: canManage,
        canPrint: canView,
        isPlannedMode,
        plannedReason,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.use("/invoices", async (req, res, next) => {
  if (!["POST", "PATCH", "DELETE"].includes(req.method.toUpperCase())) {
    return next();
    return;
  }

  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const plannedReason = getPlannedReason(businessContext.businessMode);
    if (plannedReason) {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.forbidden,
        message: plannedReason,
      });
    }

    next();
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
