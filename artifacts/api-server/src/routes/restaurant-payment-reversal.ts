import { Router, type IRouter, type Request, type Response } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";
import { RestaurantWriteError } from "../services/restaurant/restaurant.order-write.js";
import { restaurantPaymentReversalService, type RestaurantPaymentReversalInput } from "../services/restaurant/restaurant.payment-reversal.js";
import { RESTAURANT_PAYMENT_ROLES } from "../services/restaurant/restaurant.policy.js";
import type { RestaurantActorContext, RestaurantBusinessScope } from "../services/restaurant/restaurant.types.js";

const router: IRouter = Router();

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

function readPaymentReversalInput(req: Request, res: Response): RestaurantPaymentReversalInput | null {
  const orderId = req.params.orderId;

  if (typeof orderId !== "string" || orderId.length === 0) {
    badRequest(res, "Restaurant payment reversal route requires orderId in the URL.");
    return null;
  }

  if (req.body !== undefined && req.body !== null && !isObject(req.body)) {
    badRequest(res, "Restaurant payment reversal route requires an object body when a body is provided.");
    return null;
  }

  const body = isObject(req.body) ? req.body : {};
  const action = body.action === "refund" || body.action === "void" ? body.action : null;

  return {
    orderId,
    action,
    amount: typeof body.amount === "number" ? body.amount : null,
    reason: typeof body.reason === "string" ? body.reason : null,
  };
}

async function getRestaurantRequestContext(req: Request, res: Response) {
  const user = await requireRole(req, res, RESTAURANT_PAYMENT_ROLES);
  if (!user) return null;

  const businessContext = await requireBusinessContextForUser(user);

  if (businessContext.businessMode !== "restaurant") {
    errorResponse(res, {
      status: 409,
      code: errorCodes.businessModeMismatch,
      message: "Restaurant payment reversal API can only be used by a restaurant business mode.",
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

router.post("/restaurant/orders/:orderId/payment-reversal/preview", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res);
    if (!context) return;

    const input = readPaymentReversalInput(req, res);
    if (!input) return;

    return successResponse(res, {
      data: await restaurantPaymentReversalService.previewPaymentReversal(context.scope, input),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/restaurant/orders/:orderId/payment-reversal", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res);
    if (!context) return;

    const input = readPaymentReversalInput(req, res);
    if (!input) return;

    return successResponse(res, {
      data: await restaurantPaymentReversalService.reversePayment(context.actor, input),
      message: "Restaurant payment reversed.",
    });
  } catch (error) {
    const handledWriteError = handleRestaurantWriteError(res, error);
    if (handledWriteError) return handledWriteError;

    return handleApiError(res, error);
  }
});

export default router;
