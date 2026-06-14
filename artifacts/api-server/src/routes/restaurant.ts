import { Router, type IRouter, type Request, type Response } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";
import { RESTAURANT_READ_ROLES } from "../services/restaurant/restaurant.policy.js";
import { restaurantService } from "../services/restaurant/restaurant.service.js";
import type { RestaurantActorContext, RestaurantBusinessScope } from "../services/restaurant/restaurant.types.js";

const router: IRouter = Router();

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

router.get("/restaurant/health", (_req, res) => {
  return successResponse(res, {
    data: {
      status: "ok",
      mode: "restaurant",
      persistence: "prisma",
      prisma: "wired-through-restaurant-repository",
      compatibility: "legacy-fnb-routes-still-mounted",
    },
  });
});

router.get("/restaurant/dashboard", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res);
    if (!context) return;

    return successResponse(res, {
      data: await restaurantService.getDashboardSummary(context.scope),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/restaurant/menu-items", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res);
    if (!context) return;

    const data = await restaurantService.listMenuItems(context.scope);

    return successResponse(res, {
      data,
      meta: {
        pagination: {
          limit: data.length,
          totalItems: data.length,
        },
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/restaurant/tables", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res);
    if (!context) return;

    const data = await restaurantService.listTables(context.scope);

    return successResponse(res, {
      data,
      meta: {
        pagination: {
          limit: data.length,
          totalItems: data.length,
        },
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/restaurant/orders/active", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res);
    if (!context) return;

    return successResponse(res, {
      data: await restaurantService.listActiveOrders(context.scope),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/restaurant/kitchen", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res);
    if (!context) return;

    return successResponse(res, {
      data: await restaurantService.listKitchenQueue(context.scope),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/restaurant/serving", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res);
    if (!context) return;

    return successResponse(res, {
      data: await restaurantService.listServingQueue(context.scope),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/restaurant/workflow-preview", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res);
    if (!context) return;

    const [activeOrders, kitchenQueue, servingQueue] = await Promise.all([
      restaurantService.listActiveOrders(context.scope),
      restaurantService.listKitchenQueue(context.scope),
      restaurantService.listServingQueue(context.scope),
    ]);

    return successResponse(res, {
      data: {
        activeOrders,
        kitchenQueue,
        servingQueue,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
