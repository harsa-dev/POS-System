import { Router, type Request, type Response } from "express";

import {
  previewServiceBusinessInvoice,
  previewServiceBusinessInvoicePayment,
  previewServiceBusinessQuotation,
} from "../features/service-business/service-business-preview.service.js";
import {
  SERVICE_BUSINESS_PERMISSIONS,
  requireServiceBusinessPermission,
  type ServiceBusinessPermission,
} from "../features/service-business/service-business.permissions.js";
import { requireBodyObject } from "../features/service-business/service-business.validators.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

type PreviewHandler = (args: {
  businessId: string;
  body: Record<string, unknown>;
}) => Promise<unknown>;

async function handlePreviewRoute({
  req,
  res,
  permission,
  preview,
}: {
  req: Request;
  res: Response;
  permission: ServiceBusinessPermission;
  preview: PreviewHandler;
}) {
  const user = await requireServiceBusinessPermission(req, res, permission);
  if (!user) return;

  const businessContext = await requireBusinessContextForUser(user);
  const body = requireBodyObject(req.body);
  if (!body) {
    return errorResponse(res, {
      status: 400,
      code: errorCodes.validationError,
      message: "Request payload is required.",
    });
  }

  const data = await preview({
    businessId: businessContext.businessId,
    body,
  });

  return successResponse(res, {
    data,
  });
}

router.post("/custom-business/service/previews/quotation", async (req, res) => {
  try {
    return await handlePreviewRoute({
      req,
      res,
      permission: SERVICE_BUSINESS_PERMISSIONS.quoteCreate,
      preview: previewServiceBusinessQuotation,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/custom-business/service/previews/invoice", async (req, res) => {
  try {
    return await handlePreviewRoute({
      req,
      res,
      permission: SERVICE_BUSINESS_PERMISSIONS.invoiceCreate,
      preview: previewServiceBusinessInvoice,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/custom-business/service/previews/invoice-payment", async (req, res) => {
  try {
    return await handlePreviewRoute({
      req,
      res,
      permission: SERVICE_BUSINESS_PERMISSIONS.invoicePaymentRecord,
      preview: previewServiceBusinessInvoicePayment,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
