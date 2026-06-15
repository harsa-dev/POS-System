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

function isPlannedInventoryMode(businessMode: string) {
  return businessMode === "custom-business";
}

function getPlannedReason(businessMode: string) {
  if (!isPlannedInventoryMode(businessMode)) return null;

  return "Custom business inventory management is planned and not operational yet.";
}

function hasRole(role: Role, roles: Role[]) {
  return roles.includes(role);
}

function getInventoryManagementCapabilities(role: Role, businessMode: string) {
  const plannedReason = getPlannedReason(businessMode);
  const isPlannedMode = Boolean(plannedReason);
  const canManage = hasRole(role, MANAGEMENT_ROLES) && !isPlannedMode;

  return {
    canView: canManage,
    canCreateItem: canManage,
    canUpdateItem: canManage,
    canDeleteItem: canManage,
    canMoveStock: canManage,
    canImport: canManage,
    canExport: canManage,
    canRepairCostSnapshots: canManage,
    isPlannedMode,
    plannedReason,
  };
}

async function requireInventoryManagementAccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const capabilities = getInventoryManagementCapabilities(
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

    const isMutation = req.method !== "GET";
    const isExportLike = req.path.includes("export");
    const isRepair = req.path.startsWith("/inventory-cost-snapshot-repairs");

    if (isRepair && !capabilities.canRepairCostSnapshots) {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.forbidden,
        message: "Inventory cost snapshot repair requires a management role.",
      });
    }

    if (isExportLike && !capabilities.canExport) {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.forbidden,
        message: "Inventory export requires a management role.",
      });
    }

    if (isMutation && !capabilities.canMoveStock) {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.forbidden,
        message: "Inventory mutations require a management role.",
      });
    }

    if (!capabilities.canView) {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.forbidden,
        message: "Inventory management requires a management role.",
      });
    }

    return next();
  } catch (error) {
    return handleApiError(res, error);
  }
}

router.get("/inventory-management-capabilities", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const capabilities = getInventoryManagementCapabilities(
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

router.get("/inventory-capabilities", requireInventoryManagementAccess);
router.get("/inventory-dashboard", requireInventoryManagementAccess);
router.get("/inventory-items", requireInventoryManagementAccess);
router.post("/inventory-items", requireInventoryManagementAccess);
router.patch("/inventory-items/:id", requireInventoryManagementAccess);
router.delete("/inventory-items/:id", requireInventoryManagementAccess);
router.get("/inventory", requireInventoryManagementAccess);
router.post("/inventory", requireInventoryManagementAccess);
router.get("/inventory-reports", requireInventoryManagementAccess);
router.get("/inventory-reports/export", requireInventoryManagementAccess);
router.get("/inventory-cost-snapshot-repairs", requireInventoryManagementAccess);
router.post("/inventory-cost-snapshot-repairs/backfill", requireInventoryManagementAccess);

export default router;
