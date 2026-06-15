import type { Role } from "@prisma/client";
import { Router, type NextFunction, type Request, type Response } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { ALL_ROLES, MANAGEMENT_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { errorResponse } from "../lib/responses/error-response.js";

const router = Router();

function hasRole(role: Role, roles: Role[]) {
  return roles.includes(role);
}

async function requireInventoryMovementAnomalyAccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    if (businessContext.businessMode === "custom-business") {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.forbidden,
        message: "Custom business inventory movement anomaly reporting is planned and not operational yet.",
      });
    }

    if (!hasRole(user.role, MANAGEMENT_ROLES)) {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.forbidden,
        message: "Inventory movement anomaly reporting requires a management role.",
      });
    }

    return next();
  } catch (error) {
    return handleApiError(res, error);
  }
}

router.get("/inventory-movement-anomalies", requireInventoryMovementAnomalyAccess);
router.get("/inventory-movement-anomalies/export", requireInventoryMovementAnomalyAccess);
router.get("/inventory-movement-anomalies/reviews", requireInventoryMovementAnomalyAccess);
router.post("/inventory-movement-anomalies/reviews", requireInventoryMovementAnomalyAccess);

export default router;
