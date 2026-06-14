import { Router, type IRouter } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";
import {
  RESTAURANT_AUDIT_EVENT_REGISTRY,
  getRestaurantAuditEventKeys,
} from "../services/restaurant/restaurant.audit.js";
import {
  RESTAURANT_PERMISSION_MATRIX,
  RESTAURANT_POLICY_ROLES,
} from "../services/restaurant/restaurant.policy.js";

const router: IRouter = Router();

async function getRestaurantSecurityContext(req: Parameters<typeof requireRole>[0], res: Parameters<typeof requireRole>[1]) {
  const user = await requireRole(req, res, RESTAURANT_POLICY_ROLES);
  if (!user) return null;

  const businessContext = await requireBusinessContextForUser(user);

  if (businessContext.businessMode !== "restaurant") {
    errorResponse(res, {
      status: 409,
      code: errorCodes.businessModeMismatch,
      message: "Restaurant security policy can only be inspected from a restaurant business mode.",
      details: {
        expectedMode: "restaurant",
        actualMode: businessContext.businessMode,
      },
    });
    return null;
  }

  return {
    businessId: businessContext.businessId,
    userId: user.id,
    role: user.role,
  };
}

router.get("/restaurant/security/policy", async (req, res) => {
  try {
    const context = await getRestaurantSecurityContext(req, res);
    if (!context) return;

    return successResponse(res, {
      data: {
        generatedAt: new Date().toISOString(),
        businessId: context.businessId,
        viewer: {
          userId: context.userId,
          role: context.role,
        },
        permissions: RESTAURANT_PERMISSION_MATRIX,
        audit: {
          events: getRestaurantAuditEventKeys().map((event) => ({
            event,
            ...RESTAURANT_AUDIT_EVENT_REGISTRY[event],
          })),
        },
        source: "restaurant-security-policy",
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
