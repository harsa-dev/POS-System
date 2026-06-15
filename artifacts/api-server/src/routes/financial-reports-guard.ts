import type { Role } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { ALL_ROLES, MANAGEMENT_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

function isPlannedFinancialReportMode(businessMode: string) {
  return businessMode === "custom-business";
}

function getPlannedReason(businessMode: string) {
  if (!isPlannedFinancialReportMode(businessMode)) return null;

  return "Service/custom business financial reporting is planned and not operational yet.";
}

function hasRole(role: Role, roles: Role[]) {
  return roles.includes(role);
}

function getReportCapabilities(role: Role, businessMode: string) {
  const plannedReason = getPlannedReason(businessMode);
  const isPlannedMode = Boolean(plannedReason);
  const canManage = hasRole(role, MANAGEMENT_ROLES) && !isPlannedMode;

  return {
    canView: canManage,
    canExport: canManage,
    canReconcile: canManage,
    canInspectSources: canManage,
    isPlannedMode,
    plannedReason,
  };
}

router.get("/financial-reports-capabilities", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const capabilities = getReportCapabilities(
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

router.use("/financial-reports", async (req, res, next) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const capabilities = getReportCapabilities(
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

    const path = req.path;
    const needsExportAccess = path.startsWith("/export");
    const needsReconciliationAccess = path.startsWith("/reconciliation");

    if (needsExportAccess && !capabilities.canExport) {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.forbidden,
        message: "Financial report export requires a management role.",
      });
    }

    if (needsReconciliationAccess && !capabilities.canReconcile) {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.forbidden,
        message: "Financial report reconciliation requires a management role.",
      });
    }

    if (!capabilities.canView) {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.forbidden,
        message: "Financial reports require a management role.",
      });
    }

    return next();
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
