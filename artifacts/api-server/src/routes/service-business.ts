import { Router, type Request, type Response } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { ALL_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";
import {
  addServiceBusinessCostLine,
  approveServiceBusinessQuotation,
  createServiceBusinessInvoice,
  createServiceBusinessQuotation,
  createServiceBusinessRequest,
  getServiceBusinessWorkspace,
  listServiceBusinessJobs,
  recordServiceBusinessInvoicePayment,
  updateServiceBusinessStatusDirect,
  type ServiceBusinessResult,
} from "../features/service-business/service-business.crud.service.js";
import {
  presentServiceBusinessMutation,
  presentServiceJobList,
  presentServiceWorkspace,
} from "../features/service-business/service-business.presenter.js";
import type {
  ServiceBusinessListQuery,
  ServiceBusinessMutationResult,
} from "../features/service-business/service-business.types.js";
import { requireBodyObject } from "../features/service-business/service-business.validators.js";

const router = Router();

async function getServiceRequestContext(req: Request, res: Response) {
  const user = await requireRole(req, res, ALL_ROLES);
  if (!user) return null;

  const businessContext = await requireBusinessContextForUser(user);

  return {
    actorName: user.name ?? "System",
    businessId: businessContext.businessId,
  };
}

function sendMutationResult(res: Response, result: ServiceBusinessResult<ServiceBusinessMutationResult>) {
  if (!result.ok) {
    return errorResponse(res, {
      status: result.status,
      code: result.code,
      message: result.message,
    });
  }

  return successResponse(res, {
    status: result.status,
    data: presentServiceBusinessMutation(result.data),
  });
}

function readBodyOrError(reqBody: unknown, res: Response) {
  const body = requireBodyObject(reqBody);
  if (!body) {
    errorResponse(res, {
      status: 400,
      code: errorCodes.validationError,
      message: "Request payload is required.",
    });
    return null;
  }
  return body;
}

router.get("/custom-business/service/workspace", async (req, res) => {
  try {
    const context = await getServiceRequestContext(req, res);
    if (!context) return;

    const jobs = await getServiceBusinessWorkspace(context.businessId);

    return successResponse(res, {
      data: presentServiceWorkspace(jobs),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/custom-business/service/jobs", async (req, res) => {
  try {
    const context = await getServiceRequestContext(req, res);
    if (!context) return;

    const jobs = await listServiceBusinessJobs(context.businessId, req.query as ServiceBusinessListQuery);
    const presented = presentServiceJobList(jobs);

    return successResponse(res, presented);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/custom-business/service/requests", async (req, res) => {
  try {
    const context = await getServiceRequestContext(req, res);
    if (!context) return;

    const body = readBodyOrError(req.body, res);
    if (!body) return;

    const result = await createServiceBusinessRequest({
      businessId: context.businessId,
      actorName: context.actorName,
      body,
    });

    return sendMutationResult(res, result);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/custom-business/service/jobs/:id/status", async (req, res) => {
  try {
    const context = await getServiceRequestContext(req, res);
    if (!context) return;

    const body = readBodyOrError(req.body, res);
    if (!body) return;

    const result = await updateServiceBusinessStatusDirect({
      businessId: context.businessId,
      actorName: context.actorName,
      id: req.params.id,
      body,
    });

    return sendMutationResult(res, result);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/custom-business/service/jobs/:id/cost-lines", async (req, res) => {
  try {
    const context = await getServiceRequestContext(req, res);
    if (!context) return;

    const body = readBodyOrError(req.body, res);
    if (!body) return;

    const result = await addServiceBusinessCostLine({
      businessId: context.businessId,
      id: req.params.id,
      body,
    });

    return sendMutationResult(res, result);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/custom-business/service/quotations", async (req, res) => {
  try {
    const context = await getServiceRequestContext(req, res);
    if (!context) return;

    const body = readBodyOrError(req.body, res);
    if (!body) return;

    const result = await createServiceBusinessQuotation({
      businessId: context.businessId,
      actorName: context.actorName,
      body,
    });

    return sendMutationResult(res, result);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/custom-business/service/quotations/:id/approve", async (req, res) => {
  try {
    const context = await getServiceRequestContext(req, res);
    if (!context) return;

    const result = await approveServiceBusinessQuotation({
      businessId: context.businessId,
      actorName: context.actorName,
      id: req.params.id,
    });

    return sendMutationResult(res, result);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/custom-business/service/invoices", async (req, res) => {
  try {
    const context = await getServiceRequestContext(req, res);
    if (!context) return;

    const body = readBodyOrError(req.body, res);
    if (!body) return;

    const result = await createServiceBusinessInvoice({
      businessId: context.businessId,
      actorName: context.actorName,
      body,
    });

    return sendMutationResult(res, result);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/custom-business/service/invoices/:id/payment", async (req, res) => {
  try {
    const context = await getServiceRequestContext(req, res);
    if (!context) return;

    const body = readBodyOrError(req.body, res);
    if (!body) return;

    const result = await recordServiceBusinessInvoicePayment({
      businessId: context.businessId,
      actorName: context.actorName,
      id: req.params.id,
      body,
    });

    return sendMutationResult(res, result);
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
