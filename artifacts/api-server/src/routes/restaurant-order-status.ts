import type { OrderStatus } from "@prisma/client";
import { Router, type IRouter, type Request, type Response } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";
import { RestaurantWriteError } from "../services/restaurant/restaurant.order-write.js";
import {
  RESTAURANT_KITCHEN_ROLES,
  RESTAURANT_READ_ROLES,
  RESTAURANT_SERVING_ROLES,
} from "../services/restaurant/restaurant.policy.js";
import { restaurantPreviewService } from "../services/restaurant/restaurant.preview.js";
import { restaurantStatusWriteService } from "../services/restaurant/restaurant.status-write.js";
import type {
  RestaurantActorContext,
  RestaurantBusinessScope,
  RestaurantStatusActionPreviewInput,
  RestaurantStatusActionSurface,
} from "../services/restaurant/restaurant.types.js";

const router: IRouter = Router();
const RESTAURANT_STATUS_WRITE_ROLES = Array.from(new Set([
  ...RESTAURANT_KITCHEN_ROLES,
  ...RESTAURANT_SERVING_ROLES,
]));

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function badRequest(res: Response, message: string) {
  return errorResponse(res, {
    status: 400,
    code: errorCodes.badRequest,
    message,
  });
}

function handleRestaurantWriteError(res: Response, error: unknown) {
  if (!(error instanceof RestaurantWriteError)) return null;

  return errorResponse(res, {
    status: error.status,
    code: error.status === 404 ? errorCodes.notFound : error.status === 409 ? errorCodes.conflict : errorCodes.validationError,
    message: error.message,
    details: {
      warnings: error.warnings,
    },
  });
}

function getSurfaceForTargetStatus(targetStatus: OrderStatus): RestaurantStatusActionSurface | null {
  if (targetStatus === "PREPARING" || targetStatus === "READY") return "kitchen";
  if (targetStatus === "SERVED" || targetStatus === "COMPLETED") return "serving";
  return null;
}

function readOrderStatusInput(req: Request, res: Response): RestaurantStatusActionPreviewInput | null {
  const orderId = req.params.orderId;

  if (typeof orderId !== "string" || orderId.length === 0) {
    badRequest(res, "Restaurant order status route requires orderId in the URL.");
    return null;
  }

  if (!isObject(req.body)) {
    badRequest(res, "Restaurant order status route requires an object body.");
    return null;
  }

  if (typeof req.body.targetStatus !== "string" || req.body.targetStatus.length === 0) {
    badRequest(res, "Restaurant order status route requires targetStatus in the body.");
    return null;
  }

  return {
    orderId,
    targetStatus: req.body.targetStatus as OrderStatus,
  };
}

function getOrderStatusSurface(input: RestaurantStatusActionPreviewInput, res: Response) {
  if (!input.targetStatus) {
    badRequest(res, "Restaurant order status route requires targetStatus in the body.");
    return null;
  }

  const surface = getSurfaceForTargetStatus(input.targetStatus);

  if (!surface) {
    badRequest(
      res,
      "Restaurant order status route only handles kitchen/serving workflow targets. Use payment confirm for PAID and cancellation reversal workflow for CANCELLED.",
    );
    return null;
  }

  return surface;
}

async function getRestaurantRequestContext(req: Request, res: Response, roles = RESTAURANT_READ_ROLES) {
  const user = await requireRole(req, res, roles);
  if (!user) return null;

  const businessContext = await requireBusinessContextForUser(user);

  if (businessContext.businessMode !== "restaurant") {
    errorResponse(res, {
      status: 409,
      code: errorCodes.businessModeMismatch,
      message: "Restaurant API can only be used by a restaurant business mode.",
      details: {
        expectedMode: "restaurant",
        actualMode: businessContext.businessMode,
      },
    });
    return null;
  }

  const scope = {
    businessId: businessContext.businessId,
  } satisfies RestaurantBusinessScope;

  return {
    scope,
    actor: {
      ...scope,
      userId: user.id,
      role: user.role,
    } satisfies RestaurantActorContext,
  };
}

router.post("/restaurant/orders/:orderId/status/preview", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res);
    if (!context) return;

    const input = readOrderStatusInput(req, res);
    if (!input) return;

    const surface = getOrderStatusSurface(input, res);
    if (!surface) return;

    return successResponse(res, {
      data: await restaurantPreviewService.previewStatusAction(context.scope, surface, input),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/restaurant/orders/:orderId/status", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res, RESTAURANT_STATUS_WRITE_ROLES);
    if (!context) return;

    const input = readOrderStatusInput(req, res);
    if (!input) return;

    const surface = getOrderStatusSurface(input, res);
    if (!surface) return;

    return successResponse(res, {
      data: await restaurantStatusWriteService.updateStatus(context.actor, surface, input),
      message: "Restaurant order workflow status updated.",
    });
  } catch (error) {
    const handledWriteError = handleRestaurantWriteError(res, error);
    if (handledWriteError) return handledWriteError;

    return handleApiError(res, error);
  }
});

export default router;
