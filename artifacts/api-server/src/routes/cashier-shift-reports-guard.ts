import type { Role } from "@prisma/client";
import { Router, type NextFunction, type Request, type Response } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { ALL_ROLES, MANAGEMENT_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

function isPlannedShiftReportMode(businessMode: string) {
  return businessMode === "custom-business";
}

function getPlannedReason(businessMode: string) {
  if (!isPlannedShiftReportMode(businessMode)) return null;

  return "Service/custom business cashier shift reports are planned and not operational yet.";
}

function hasRole(role: Role, roles: Role[]) {
  return roles.includes(role);
}

function getCashierShiftReportCapabilities(role: Role, businessMode: string) {
  const plannedReason = getPlannedReason(businessMode);
  const isPlannedMode = Boolean(plannedReason);
  const canManage = hasRole(role, MANAGEMENT_ROLES) && !isPlannedMode;

  return {
    canView: canManage,
    canExport: canManage,
    canSyncToCashflow: canManage,
    isPlannedMode,
    plannedReason,
  };
}

async function requireCashierShiftReportAccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const capabilities = getCashierShiftReportCapabilities(
      user.role,
      businessContext.businessMode,
    );

    if (capabilities.plannedReason) {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.forbidden,
        message: capabilities.plannedReason,
      });
    }

    const isShiftSync = req.path.startsWith("/cashflow/sync/shifts/");
    const isExport = req.path === "/cashier-shift-reports/export";

    if (isShiftSync && !capabilities.canSyncToCashflow) {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.forbidden,
        message: "Cashier shift cashflow sync requires a management role.",
      });
    }

    if (isExport && !capabilities.canExport) {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.forbidden,
        message: "Cashier shift report export requires a management role.",
      });
    }

    if (!capabilities.canView) {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.forbidden,
        message: "Cashier shift reports require a management role.",
      });
    }

    return next();
  } catch (error) {
    return handleApiError(res, error);
  }
}

router.get("/cashier-shift-reports-capabilities", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const capabilities = getCashierShiftReportCapabilities(
      user.role,
      businessContext.businessMode,
    );

    return successResponse(res, {
      data: {
        businessId: businessContext.businessId,
        businessMode: businessContext.businessMode,
        ...capabilities,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/cashier-shift-reports", requireCashierShiftReportAccess);
router.get("/cashier-shift-reports/export", requireCashierShiftReportAccess);
router.get("/cashier-shift-reports/reconciliation", requireCashierShiftReportAccess);
router.get("/cashier-shift-reports/sync-attempts", requireCashierShiftReportAccess);
router.get("/shifts", requireCashierShiftReportAccess);
router.post("/cashflow/sync/shifts/:shiftId", requireCashierShiftReportAccess);

export default router;
