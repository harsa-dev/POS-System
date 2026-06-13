import { Router, type IRouter } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { ALL_ROLES, OPERATIONS_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";
import { retailService } from "../services/retail/retail.service.js";
import type {
  RetailActor,
  RetailBusinessScope,
  RetailReturnPreviewInput,
  RetailSalePreviewInput,
} from "../services/retail/retail.types.js";

const router: IRouter = Router();

function getStringQuery(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function isSalePreviewInput(value: unknown): value is RetailSalePreviewInput {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { lines?: unknown };
  return Array.isArray(candidate.lines);
}

function isReturnPreviewInput(value: unknown): value is RetailReturnPreviewInput {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { lines?: unknown; reason?: unknown };
  return Array.isArray(candidate.lines) && typeof candidate.reason === "string";
}

async function getRetailRequestContext(req, res, roles = ALL_ROLES) {
  const user = await requireRole(req, res, roles);
  if (!user) return null;

  const businessContext = await requireBusinessContextForUser(user);

  if (businessContext.businessMode !== "retail") {
    errorResponse(res, {
      status: 409,
      code: errorCodes.businessModeMismatch,
      message: "Retail API can only be used by a retail business mode.",
      details: {
        expectedMode: "retail",
        actualMode: businessContext.businessMode,
      },
    });
    return null;
  }

  return {
    scope: {
      businessId: businessContext.businessId,
    } satisfies RetailBusinessScope,
    actor: {
      id: user.id,
      role: user.role,
    } satisfies RetailActor,
  };
}

router.get("/retail/health", (_req, res) => {
  return successResponse(res, {
    data: {
      status: "ok",
      mode: "retail",
      persistence: "prisma",
      prisma: "wired-through-retail-repository",
    },
  });
});

router.get("/retail/dashboard", async (req, res) => {
  try {
    const context = await getRetailRequestContext(req, res);
    if (!context) return;

    return successResponse(res, {
      data: await retailService.getDashboard(context.scope),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/retail/products", async (req, res) => {
  try {
    const context = await getRetailRequestContext(req, res);
    if (!context) return;

    const data = await retailService.listProducts(context.scope, {
      search: getStringQuery(req.query.search),
      category: getStringQuery(req.query.category),
      stockStatus: getStringQuery(req.query.stockStatus),
    });

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

router.get("/retail/products/:id", async (req, res) => {
  try {
    const context = await getRetailRequestContext(req, res);
    if (!context) return;

    const product = await retailService.getProductById(context.scope, req.params.id);

    if (!product) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Retail product was not found.",
      });
    }

    return successResponse(res, { data: product });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/retail/barcode/:code", async (req, res) => {
  try {
    const context = await getRetailRequestContext(req, res);
    if (!context) return;

    const product = await retailService.lookupBarcode(context.scope, req.params.code);

    if (!product) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "No retail product matched this barcode or SKU.",
      });
    }

    return successResponse(res, {
      data: {
        found: true,
        product,
        canSell: product.currentStock > 0,
        warning: product.currentStock <= 0 ? "Product is out of stock in retail inventory." : undefined,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/retail/inventory/risks", async (req, res) => {
  try {
    const context = await getRetailRequestContext(req, res);
    if (!context) return;

    return successResponse(res, {
      data: await retailService.getInventoryRisks(context.scope),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/retail/receiving", async (req, res) => {
  try {
    const context = await getRetailRequestContext(req, res);
    if (!context) return;

    return successResponse(res, {
      data: await retailService.getReceivingQueue(context.scope),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/retail/command-center", async (req, res) => {
  try {
    const context = await getRetailRequestContext(req, res);
    if (!context) return;

    return successResponse(res, {
      data: await retailService.getCommandCenter(context.scope),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/retail/sales/preview", async (req, res) => {
  try {
    const context = await getRetailRequestContext(req, res, OPERATIONS_ROLES);
    if (!context) return;

    if (!isSalePreviewInput(req.body)) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Request body must contain a sale lines array.",
      });
    }

    return successResponse(res, {
      data: await retailService.previewSale(context.scope, req.body),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/retail/sales/mock-checkout", async (req, res) => {
  try {
    const context = await getRetailRequestContext(req, res, OPERATIONS_ROLES);
    if (!context) return;

    if (!isSalePreviewInput(req.body)) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Request body must contain a sale lines array.",
      });
    }

    const data = await retailService.mockCheckout(context.scope, req.body);

    return successResponse(res, {
      status: data.canCheckout ? 201 : 200,
      data,
      message: data.canCheckout
        ? "Mock checkout created. No database mutation was executed."
        : "Mock checkout is blocked by validation rules.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/retail/sales/checkout", async (req, res) => {
  try {
    const context = await getRetailRequestContext(req, res, OPERATIONS_ROLES);
    if (!context) return;

    if (!isSalePreviewInput(req.body)) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Request body must contain a sale lines array.",
      });
    }

    const data = await retailService.checkout(context.scope, context.actor, req.body);

    return successResponse(res, {
      status: data.persisted ? 201 : 409,
      data,
      message: data.persisted
        ? "Retail checkout persisted."
        : "Retail checkout blocked by validation rules.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/retail/returns/preview", async (req, res) => {
  try {
    const context = await getRetailRequestContext(req, res, OPERATIONS_ROLES);
    if (!context) return;

    if (!isReturnPreviewInput(req.body)) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Request body must contain return lines and reason.",
      });
    }

    return successResponse(res, {
      data: await retailService.previewReturn(context.scope, req.body),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
