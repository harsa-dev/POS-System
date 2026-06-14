import { Router, type Request, type Response } from "express";
import type { Prisma } from "@prisma/client";

import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";
import {
  SERVICE_BUSINESS_PERMISSIONS,
  requireServiceBusinessPermission,
  type ServiceBusinessPermission,
} from "../features/service-business/service-business.permissions.js";
import {
  cancelServiceBusinessInvoice,
  cancelServiceBusinessQuotation,
} from "../features/service-business/service-business-reversal.service.js";
import { presentServiceBusinessMutation } from "../features/service-business/service-business.presenter.js";
import { requireBodyObject, getText } from "../features/service-business/service-business.validators.js";
import {
  writeServiceBusinessAuditLog,
  type ServiceBusinessAuditAction,
} from "../features/service-business/service-business.audit.js";
import type { ServiceBusinessResult } from "../features/service-business/service-business.crud.service.js";
import type { ServiceBusinessMutationResult } from "../features/service-business/service-business.types.js";

const router = Router();

type ServiceReversalContext = {
  actorId: string;
  actorName: string;
  businessId: string;
};

type ServiceReversalAuditDraft = {
  action: ServiceBusinessAuditAction;
  entityType: string;
  entityId: string;
  changes: Prisma.InputJsonObject;
};

async function getServiceReversalContext(
  req: Request,
  res: Response,
  permission: ServiceBusinessPermission,
): Promise<ServiceReversalContext | null> {
  const user = await requireServiceBusinessPermission(req, res, permission);
  if (!user) return null;

  const businessContext = await requireBusinessContextForUser(user);

  return {
    actorId: user.id,
    actorName: user.name ?? "System",
    businessId: businessContext.businessId,
  };
}

function readBodyOrEmpty(reqBody: unknown) {
  return requireBodyObject(reqBody) ?? {};
}

function sendReversalResult(res: Response, result: ServiceBusinessResult<ServiceBusinessMutationResult>) {
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

async function auditServiceReversal(
  context: ServiceReversalContext,
  result: ServiceBusinessResult<ServiceBusinessMutationResult>,
  buildAudit: (data: ServiceBusinessMutationResult) => ServiceReversalAuditDraft | null,
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

router.post("/custom-business/service/reversals/quotations/:id/cancel", async (req, res) => {
  try {
    const context = await getServiceReversalContext(req, res, SERVICE_BUSINESS_PERMISSIONS.quoteApprove);
    if (!context) return;

    const body = readBodyOrEmpty(req.body);
    const note = getText(body.note) || undefined;

    const result = await cancelServiceBusinessQuotation({
      businessId: context.businessId,
      actorName: context.actorName,
      id: req.params.id,
      note,
    });

    await auditServiceReversal(context, result, (data) => {
      const preview = (data.preview ?? {}) as Record<string, unknown>;
      const quotationId = typeof preview.quotationId === "string" ? preview.quotationId : "";
      if (!quotationId) return null;

      return {
        action: "UPDATE",
        entityType: "ServiceQuotation",
        entityId: quotationId,
        changes: {
          message: data.message,
          reversalType: "quotation-cancellation",
          quotationCode: typeof preview.quotationCode === "string" ? preview.quotationCode : null,
          previousQuoteStatus: typeof preview.previousQuoteStatus === "string" ? preview.previousQuoteStatus : null,
          nextQuoteStatus: typeof preview.nextQuoteStatus === "string" ? preview.nextQuoteStatus : null,
          previousWorkflowStatus: typeof preview.previousWorkflowStatus === "string" ? preview.previousWorkflowStatus : null,
          nextWorkflowStatus: typeof preview.nextWorkflowStatus === "string" ? preview.nextWorkflowStatus : null,
          note: typeof preview.note === "string" ? preview.note : null,
        },
      };
    });

    return sendReversalResult(res, result);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/custom-business/service/reversals/invoices/:id/cancel", async (req, res) => {
  try {
    const context = await getServiceReversalContext(req, res, SERVICE_BUSINESS_PERMISSIONS.invoiceCreate);
    if (!context) return;

    const body = readBodyOrEmpty(req.body);
    const note = getText(body.note) || undefined;

    const result = await cancelServiceBusinessInvoice({
      businessId: context.businessId,
      actorName: context.actorName,
      id: req.params.id,
      note,
    });

    await auditServiceReversal(context, result, (data) => {
      const preview = (data.preview ?? {}) as Record<string, unknown>;
      const invoiceId = typeof preview.invoiceId === "string" ? preview.invoiceId : "";
      if (!invoiceId) return null;

      return {
        action: "UPDATE",
        entityType: "ServiceInvoice",
        entityId: invoiceId,
        changes: {
          message: data.message,
          reversalType: "invoice-cancellation",
          invoiceCode: typeof preview.invoiceCode === "string" ? preview.invoiceCode : null,
          previousInvoiceStatus: typeof preview.previousInvoiceStatus === "string" ? preview.previousInvoiceStatus : null,
          nextInvoiceStatus: typeof preview.nextInvoiceStatus === "string" ? preview.nextInvoiceStatus : null,
          previousWorkflowStatus: typeof preview.previousWorkflowStatus === "string" ? preview.previousWorkflowStatus : null,
          nextWorkflowStatus: typeof preview.nextWorkflowStatus === "string" ? preview.nextWorkflowStatus : null,
          quotationId: typeof preview.quotationId === "string" ? preview.quotationId : null,
          quotationCode: typeof preview.quotationCode === "string" ? preview.quotationCode : null,
          note: typeof preview.note === "string" ? preview.note : null,
        },
      };
    });

    return sendReversalResult(res, result);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.use((req, res, next) => {
  if (!req.path.startsWith("/custom-business/service/reversals")) return next();

  return errorResponse(res, {
    status: 404,
    code: errorCodes.notFound,
    message: "Service Business reversal route not found.",
  });
});

export default router;
