import { Router, type Request, type Response } from "express";
import type { Prisma } from "@prisma/client";

import { requireServiceBusinessContextForUser } from "../lib/business-context/index.js";
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
import { getServiceBusinessDashboardSummary } from "../features/service-business/service-business.summary.js";
import {
  SERVICE_BUSINESS_PERMISSIONS,
  requireServiceBusinessPermission,
  type ServiceBusinessPermission,
} from "../features/service-business/service-business.permissions.js";
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
import {
  writeServiceBusinessAuditLog,
  type ServiceBusinessAuditAction,
} from "../features/service-business/service-business.audit.js";

const router = Router();

type ServiceRequestContext = {
  actorId: string;
  actorName: string;
  businessId: string;
};

type ServiceMutationAuditDraft = {
  action: ServiceBusinessAuditAction;
  entityType: string;
  entityId: string;
  changes: Prisma.InputJsonObject;
};

async function getServiceRequestContext(
  req: Request,
  res: Response,
  permission: ServiceBusinessPermission,
): Promise<ServiceRequestContext | null> {
  const user = await requireServiceBusinessPermission(req, res, permission);
  if (!user) return null;

  const businessContext = await requireServiceBusinessContextForUser(user);

  return {
    actorId: user.id,
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

async function auditServiceMutation(
  context: ServiceRequestContext,
  result: ServiceBusinessResult<ServiceBusinessMutationResult>,
  buildAudit: (data: ServiceBusinessMutationResult) => ServiceMutationAuditDraft | null,
) {
  if (!result.ok) return;

  const audit = buildAudit(result.data);
  if (!audit || !audit.entityId) return;

  await writeServiceBusinessAuditLog({
    businessId: context.businessId,
    userId: context.actorId,
    action: audit.action,
    entityType: audit.entityType,
    entityId: audit.entityId,
    changes: audit.changes,
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
    const context = await getServiceRequestContext(req, res, SERVICE_BUSINESS_PERMISSIONS.view);
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
    const context = await getServiceRequestContext(req, res, SERVICE_BUSINESS_PERMISSIONS.view);
    if (!context) return;

    const jobs = await listServiceBusinessJobs(context.businessId, req.query as ServiceBusinessListQuery);
    const presented = presentServiceJobList(jobs);

    return successResponse(res, presented);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/custom-business/service/summary", async (req, res) => {
  try {
    const context = await getServiceRequestContext(req, res, SERVICE_BUSINESS_PERMISSIONS.view);
    if (!context) return;

    const summary = await getServiceBusinessDashboardSummary(context.businessId);

    return successResponse(res, {
      data: summary,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/custom-business/service/requests", async (req, res) => {
  try {
    const context = await getServiceRequestContext(
      req,
      res,
      SERVICE_BUSINESS_PERMISSIONS.requestCreate,
    );
    if (!context) return;

    const body = readBodyOrError(req.body, res);
    if (!body) return;

    const result = await createServiceBusinessRequest({
      businessId: context.businessId,
      actorName: context.actorName,
      body,
    });

    await auditServiceMutation(context, result, (data) => data.job ? ({
      action: "CREATE",
      entityType: "ServiceJob",
      entityId: data.job.id,
      changes: {
        message: data.message,
        requestCode: data.job.requestCode,
        title: data.job.title,
        customerName: data.job.customerName,
        serviceCategory: data.job.serviceCategory,
        priority: data.job.priority,
        status: data.job.status,
      },
    }) : null);

    return sendMutationResult(res, result);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/custom-business/service/jobs/:id/status", async (req, res) => {
  try {
    const context = await getServiceRequestContext(
      req,
      res,
      SERVICE_BUSINESS_PERMISSIONS.jobStatusUpdate,
    );
    if (!context) return;

    const body = readBodyOrError(req.body, res);
    if (!body) return;

    const result = await updateServiceBusinessStatusDirect({
      businessId: context.businessId,
      actorName: context.actorName,
      id: req.params.id,
      body,
    });

    await auditServiceMutation(context, result, (data) => data.job ? ({
      action: "UPDATE",
      entityType: "ServiceJob",
      entityId: data.job.id,
      changes: {
        message: data.message,
        requestCode: data.job.requestCode,
        nextStatus: data.job.status,
      },
    }) : null);

    return sendMutationResult(res, result);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/custom-business/service/jobs/:id/cost-lines", async (req, res) => {
  try {
    const context = await getServiceRequestContext(req, res, SERVICE_BUSINESS_PERMISSIONS.costCreate);
    if (!context) return;

    const body = readBodyOrError(req.body, res);
    if (!body) return;

    const result = await addServiceBusinessCostLine({
      businessId: context.businessId,
      id: req.params.id,
      body,
    });

    await auditServiceMutation(context, result, (data) => data.job ? ({
      action: "UPDATE",
      entityType: "ServiceJob",
      entityId: data.job.id,
      changes: {
        message: data.message,
        requestCode: data.job.requestCode,
        costLineCount: data.job.costLines.length,
      },
    }) : null);

    return sendMutationResult(res, result);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/custom-business/service/quotations", async (req, res) => {
  try {
    const context = await getServiceRequestContext(req, res, SERVICE_BUSINESS_PERMISSIONS.quoteCreate);
    if (!context) return;

    const body = readBodyOrError(req.body, res);
    if (!body) return;

    const result = await createServiceBusinessQuotation({
      businessId: context.businessId,
      actorName: context.actorName,
      body,
    });

    await auditServiceMutation(context, result, (data) => data.job?.quote.id ? ({
      action: "CREATE",
      entityType: "ServiceQuotation",
      entityId: data.job.quote.id,
      changes: {
        message: data.message,
        requestCode: data.job.requestCode,
        quotationCode: data.job.quote.code,
        quoteStatus: data.job.quote.status,
        validUntil: data.job.quote.validUntil || null,
      },
    }) : null);

    return sendMutationResult(res, result);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/custom-business/service/quotations/:id/approve", async (req, res) => {
  try {
    const context = await getServiceRequestContext(req, res, SERVICE_BUSINESS_PERMISSIONS.quoteApprove);
    if (!context) return;

    const result = await approveServiceBusinessQuotation({
      businessId: context.businessId,
      actorName: context.actorName,
      id: req.params.id,
    });

    await auditServiceMutation(context, result, (data) => data.job?.quote.id ? ({
      action: "UPDATE",
      entityType: "ServiceQuotation",
      entityId: data.job.quote.id,
      changes: {
        message: data.message,
        requestCode: data.job.requestCode,
        quotationCode: data.job.quote.code,
        quoteStatus: data.job.quote.status,
        approvedAt: data.job.quote.customerApprovedAt ?? null,
      },
    }) : null);

    return sendMutationResult(res, result);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/custom-business/service/invoices", async (req, res) => {
  try {
    const context = await getServiceRequestContext(req, res, SERVICE_BUSINESS_PERMISSIONS.invoiceCreate);
    if (!context) return;

    const body = readBodyOrError(req.body, res);
    if (!body) return;

    const result = await createServiceBusinessInvoice({
      businessId: context.businessId,
      actorName: context.actorName,
      body,
    });

    await auditServiceMutation(context, result, (data) => data.job?.invoice.id ? ({
      action: "CREATE",
      entityType: "ServiceInvoice",
      entityId: data.job.invoice.id,
      changes: {
        message: data.message,
        requestCode: data.job.requestCode,
        invoiceCode: data.job.invoice.code,
        invoiceStatus: data.job.invoice.status,
        dueDate: data.job.invoice.dueDate || null,
      },
    }) : null);

    return sendMutationResult(res, result);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/custom-business/service/invoices/:id/payment", async (req, res) => {
  try {
    const context = await getServiceRequestContext(
      req,
      res,
      SERVICE_BUSINESS_PERMISSIONS.invoicePaymentRecord,
    );
    if (!context) return;

    const body = readBodyOrError(req.body, res);
    if (!body) return;

    const result = await recordServiceBusinessInvoicePayment({
      businessId: context.businessId,
      actorName: context.actorName,
      id: req.params.id,
      body,
    });

    await auditServiceMutation(context, result, (data) => data.job?.invoice.id ? ({
      action: "UPDATE",
      entityType: "ServiceInvoice",
      entityId: data.job.invoice.id,
      changes: {
        message: data.message,
        requestCode: data.job.requestCode,
        invoiceCode: data.job.invoice.code,
        invoiceStatus: data.job.invoice.status,
        paidAmount: data.job.invoice.paidAmount,
        paymentPreview: data.preview ? JSON.stringify(data.preview) : null,
      },
    }) : null);

    return sendMutationResult(res, result);
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
