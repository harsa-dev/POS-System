import type { OrderStatus } from "@prisma/client";
import { Router, type IRouter, type Request, type Response } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";
import { restaurantCancellationService } from "../services/restaurant/restaurant.cancellation.js";
import { RestaurantWriteError, restaurantOrderWriteService } from "../services/restaurant/restaurant.order-write.js";
import {
  RESTAURANT_CANCELLATION_ROLES,
  RESTAURANT_KITCHEN_ROLES,
  RESTAURANT_PAYMENT_ROLES,
  RESTAURANT_POS_ROLES,
  RESTAURANT_READ_ROLES,
  RESTAURANT_SERVING_ROLES,
} from "../services/restaurant/restaurant.policy.js";
import { restaurantPreviewService } from "../services/restaurant/restaurant.preview.js";
import { restaurantService } from "../services/restaurant/restaurant.service.js";
import { restaurantStatusWriteService } from "../services/restaurant/restaurant.status-write.js";
import type {
  RestaurantActorContext,
  RestaurantBusinessScope,
  RestaurantCancellationPreviewInput,
  RestaurantOrderPreviewInput,
  RestaurantPaymentPreviewInput,
  RestaurantSharedDashboardId,
  RestaurantStatusActionPreviewInput,
  RestaurantStatusActionSurface,
} from "../services/restaurant/restaurant.types.js";

const router: IRouter = Router();
const restaurantSharedDashboardIds = new Set<string>([
  "overview",
  "sales",
  "customers",
  "inventory",
  "cashflow",
  "financial-reports",
  "invoice-generator",
  "shift-reports",
  "team-management",
  "employee-performance",
  "approvals",
  "audit-controls",
  "roster-overview",
  "employee-attendance",
  "employee-contracts",
  "payroll",
]);
const RESTAURANT_STATUS_WRITE_ROLES = Array.from(new Set([
  ...RESTAURANT_KITCHEN_ROLES,
  ...RESTAURANT_SERVING_ROLES,
]));

function isRestaurantSharedDashboardId(value: string): value is RestaurantSharedDashboardId {
  return restaurantSharedDashboardIds.has(value);
}

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

function readOrderPreviewInput(req: Request, res: Response): RestaurantOrderPreviewInput | null {
  if (!isObject(req.body)) {
    badRequest(res, "Restaurant order preview requires an object body.");
    return null;
  }

  if (!Array.isArray(req.body.items)) {
    badRequest(res, "Restaurant order preview requires an items array.");
    return null;
  }

  return {
    type: req.body.type === "TAKEAWAY" ? "TAKEAWAY" : "DINE_IN",
    tableId: typeof req.body.tableId === "string" ? req.body.tableId : null,
    paymentMethod: typeof req.body.paymentMethod === "string" ? req.body.paymentMethod : "CASH",
    amountPaid: typeof req.body.amountPaid === "number" ? req.body.amountPaid : null,
    items: req.body.items.map((item) => {
      if (!isObject(item)) return { menuItemId: "", quantity: 0 };

      return {
        menuItemId: typeof item.menuItemId === "string" ? item.menuItemId : "",
        quantity: typeof item.quantity === "number" ? item.quantity : 0,
      };
    }),
  };
}

function readPaymentPreviewInput(req: Request, res: Response): RestaurantPaymentPreviewInput | null {
  if (!isObject(req.body)) {
    badRequest(res, "Restaurant payment preview requires an object body.");
    return null;
  }

  if (typeof req.body.orderId !== "string" || req.body.orderId.length === 0) {
    badRequest(res, "Restaurant payment preview requires orderId.");
    return null;
  }

  return {
    orderId: req.body.orderId,
    paymentMethod: typeof req.body.paymentMethod === "string" ? req.body.paymentMethod : null,
    amountPaid: typeof req.body.amountPaid === "number" ? req.body.amountPaid : null,
  };
}

function readStatusActionPreviewInput(req: Request, res: Response): RestaurantStatusActionPreviewInput | null {
  if (!isObject(req.body)) {
    badRequest(res, "Restaurant status preview requires an object body.");
    return null;
  }

  if (typeof req.body.orderId !== "string" || req.body.orderId.length === 0) {
    badRequest(res, "Restaurant status preview requires orderId.");
    return null;
  }

  return {
    orderId: req.body.orderId,
    targetStatus: typeof req.body.targetStatus === "string" ? req.body.targetStatus as RestaurantStatusActionPreviewInput["targetStatus"] : null,
  };
}

function readCanonicalOrderStatusInput(req: Request, res: Response): RestaurantStatusActionPreviewInput | null {
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

function readCancellationPreviewInput(req: Request, res: Response): RestaurantCancellationPreviewInput | null {
  const orderId = req.params.orderId;

  if (typeof orderId !== "string" || orderId.length === 0) {
    badRequest(res, "Restaurant cancellation route requires orderId in the URL.");
    return null;
  }

  if (req.body !== undefined && req.body !== null && !isObject(req.body)) {
    badRequest(res, "Restaurant cancellation route requires an object body when a body is provided.");
    return null;
  }

  const body = isObject(req.body) ? req.body : {};

  return {
    orderId,
    reason: typeof body.reason === "string" ? body.reason : null,
  };
}

function getSurfaceForTargetStatus(targetStatus: OrderStatus): RestaurantStatusActionSurface | null {
  if (targetStatus === "PREPARING" || targetStatus === "READY") return "kitchen";
  if (targetStatus === "SERVED" || targetStatus === "COMPLETED") return "serving";
  return null;
}

function getCanonicalOrderStatusSurface(input: RestaurantStatusActionPreviewInput, res: Response) {
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

router.get("/restaurant/shared-dashboard/:dashboardId", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res);
    if (!context) return;

    if (!isRestaurantSharedDashboardId(req.params.dashboardId)) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Restaurant shared dashboard context was not found.",
      });
    }

    return successResponse(res, {
      data: await restaurantService.getSharedDashboard(context.scope, req.params.dashboardId),
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

router.post("/restaurant/orders/preview", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res);
    if (!context) return;

    const input = readOrderPreviewInput(req, res);
    if (!input) return;

    return successResponse(res, {
      data: await restaurantPreviewService.previewOrder(context.scope, input),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/restaurant/orders", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res, RESTAURANT_POS_ROLES);
    if (!context) return;

    const input = readOrderPreviewInput(req, res);
    if (!input) return;

    return successResponse(res, {
      status: 201,
      data: await restaurantOrderWriteService.createOrder(context.actor, input),
      message: "Restaurant order created.",
    });
  } catch (error) {
    const handledWriteError = handleRestaurantWriteError(res, error);
    if (handledWriteError) return handledWriteError;

    return handleApiError(res, error);
  }
});

router.post("/restaurant/orders/:orderId/status/preview", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res);
    if (!context) return;

    const input = readCanonicalOrderStatusInput(req, res);
    if (!input) return;

    const surface = getCanonicalOrderStatusSurface(input, res);
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

    const input = readCanonicalOrderStatusInput(req, res);
    if (!input) return;

    const surface = getCanonicalOrderStatusSurface(input, res);
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

router.post("/restaurant/orders/:orderId/cancellation/preview", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res);
    if (!context) return;

    const input = readCancellationPreviewInput(req, res);
    if (!input) return;

    return successResponse(res, {
      data: await restaurantCancellationService.previewCancellation(context.scope, input),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/restaurant/orders/:orderId/cancel", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res, RESTAURANT_CANCELLATION_ROLES);
    if (!context) return;

    const input = readCancellationPreviewInput(req, res);
    if (!input) return;

    return successResponse(res, {
      data: await restaurantCancellationService.cancelOrder(context.actor, input),
      message: "Restaurant order cancelled with reversal workflow.",
    });
  } catch (error) {
    const handledWriteError = handleRestaurantWriteError(res, error);
    if (handledWriteError) return handledWriteError;

    return handleApiError(res, error);
  }
});

router.post("/restaurant/payments/preview", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res);
    if (!context) return;

    const input = readPaymentPreviewInput(req, res);
    if (!input) return;

    return successResponse(res, {
      data: await restaurantPreviewService.previewPayment(context.scope, input),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/restaurant/payments/confirm", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res, RESTAURANT_PAYMENT_ROLES);
    if (!context) return;

    const input = readPaymentPreviewInput(req, res);
    if (!input) return;

    return successResponse(res, {
      data: await restaurantOrderWriteService.confirmPayment(context.actor, input),
      message: "Restaurant payment confirmed.",
    });
  } catch (error) {
    const handledWriteError = handleRestaurantWriteError(res, error);
    if (handledWriteError) return handledWriteError;

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

router.post("/restaurant/kitchen/preview", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res);
    if (!context) return;

    const input = readStatusActionPreviewInput(req, res);
    if (!input) return;

    return successResponse(res, {
      data: await restaurantPreviewService.previewStatusAction(context.scope, "kitchen", input),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/restaurant/kitchen/status", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res, RESTAURANT_KITCHEN_ROLES);
    if (!context) return;

    const input = readStatusActionPreviewInput(req, res);
    if (!input) return;

    return successResponse(res, {
      data: await restaurantStatusWriteService.updateStatus(context.actor, "kitchen", input),
      message: "Restaurant kitchen workflow status updated.",
    });
  } catch (error) {
    const handledWriteError = handleRestaurantWriteError(res, error);
    if (handledWriteError) return handledWriteError;

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

router.post("/restaurant/serving/preview", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res);
    if (!context) return;

    const input = readStatusActionPreviewInput(req, res);
    if (!input) return;

    return successResponse(res, {
      data: await restaurantPreviewService.previewStatusAction(context.scope, "serving", input),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/restaurant/serving/status", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res, RESTAURANT_SERVING_ROLES);
    if (!context) return;

    const input = readStatusActionPreviewInput(req, res);
    if (!input) return;

    return successResponse(res, {
      data: await restaurantStatusWriteService.updateStatus(context.actor, "serving", input),
      message: "Restaurant serving workflow status updated.",
    });
  } catch (error) {
    const handledWriteError = handleRestaurantWriteError(res, error);
    if (handledWriteError) return handledWriteError;

    return handleApiError(res, error);
  }
});

router.get("/restaurant/workflow", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res);
    if (!context) return;

    return successResponse(res, {
      data: await restaurantService.getWorkflowSummary(context.scope),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/restaurant/workflow-preview", async (req, res) => {
  try {
    const context = await getRestaurantRequestContext(req, res);
    if (!context) return;

    const workflow = await restaurantService.getWorkflowSummary(context.scope);
    const getOrdersByStage = (stageId: string) => workflow.stages.find((stage) => stage.id === stageId)?.orders ?? [];

    return successResponse(res, {
      data: {
        workflow,
        activeOrders: workflow.stages
          .filter((stage) => stage.id === "payment" || stage.id === "kitchen" || stage.id === "serving")
          .flatMap((stage) => stage.orders),
        kitchenQueue: getOrdersByStage("kitchen"),
        servingQueue: getOrdersByStage("serving").filter((order) => order.status === "READY"),
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
