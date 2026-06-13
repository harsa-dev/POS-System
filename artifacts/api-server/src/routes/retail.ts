import { Router, type IRouter } from "express";

import { errorCodes } from "../lib/errors/error-codes.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";
import { retailService } from "../services/retail/retail.service.js";
import type {
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

router.get("/retail/health", (_req, res) => {
  return successResponse(res, {
    data: {
      status: "ok",
      mode: "retail",
      persistence: "mock-only",
      prisma: "not-wired-yet",
    },
  });
});

router.get("/retail/dashboard", (_req, res) => {
  return successResponse(res, {
    data: retailService.getDashboard(),
  });
});

router.get("/retail/products", (req, res) => {
  const data = retailService.listProducts({
    search: getStringQuery(req.query.search),
    category: getStringQuery(req.query.category),
    stockStatus: getStringQuery(req.query.stockStatus),
  });

  return successResponse(res, {
    data,
    meta: {
      total: data.length,
    },
  });
});

router.get("/retail/products/:id", (req, res) => {
  const product = retailService.getProductById(req.params.id);

  if (!product) {
    return errorResponse(res, {
      status: 404,
      code: errorCodes.notFound,
      message: "Retail product was not found.",
    });
  }

  return successResponse(res, { data: product });
});

router.get("/retail/barcode/:code", (req, res) => {
  const product = retailService.lookupBarcode(req.params.code);

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
      warning: product.currentStock <= 0 ? "Product is out of stock in mock inventory." : undefined,
    },
  });
});

router.get("/retail/inventory/risks", (_req, res) => {
  return successResponse(res, {
    data: retailService.getInventoryRisks(),
  });
});

router.get("/retail/receiving", (_req, res) => {
  return successResponse(res, {
    data: retailService.getReceivingQueue(),
  });
});

router.get("/retail/command-center", (_req, res) => {
  return successResponse(res, {
    data: retailService.getCommandCenter(),
  });
});

router.post("/retail/sales/preview", (req, res) => {
  if (!isSalePreviewInput(req.body)) {
    return errorResponse(res, {
      status: 400,
      code: errorCodes.validationError,
      message: "Request body must contain a sale lines array.",
    });
  }

  return successResponse(res, {
    data: retailService.previewSale(req.body),
  });
});

router.post("/retail/sales/mock-checkout", (req, res) => {
  if (!isSalePreviewInput(req.body)) {
    return errorResponse(res, {
      status: 400,
      code: errorCodes.validationError,
      message: "Request body must contain a sale lines array.",
    });
  }

  const data = retailService.mockCheckout(req.body);

  return successResponse(res, {
    status: data.canCheckout ? 201 : 409,
    data,
    message: data.canCheckout
      ? "Mock checkout created. No database mutation was executed."
      : "Mock checkout is blocked by validation rules.",
  });
});

router.post("/retail/returns/preview", (req, res) => {
  if (!isReturnPreviewInput(req.body)) {
    return errorResponse(res, {
      status: 400,
      code: errorCodes.validationError,
      message: "Request body must contain return lines and reason.",
    });
  }

  return successResponse(res, {
    data: retailService.previewReturn(req.body),
  });
});

export default router;
