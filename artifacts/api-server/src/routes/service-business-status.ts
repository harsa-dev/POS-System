import { Router } from "express";

import {
  findServiceWorkflowTarget,
  loadServiceWorkflowReadiness,
  updateServiceWorkflowStatus,
} from "../features/service-business/service-business.repository.js";
import {
  SERVICE_BUSINESS_PERMISSIONS,
  requireServiceBusinessPermission,
} from "../features/service-business/service-business.permissions.js";
import { presentServiceStatusMutation } from "../features/service-business/service-business.presenter.js";
import { buildServiceTransitionPreview } from "../features/service-business/service-business.workflow.js";
import {
  getText,
  parseServiceBusinessWorkflowStatus,
  requireBodyObject,
} from "../features/service-business/service-business.validators.js";
import { writeServiceBusinessAuditLog } from "../features/service-business/service-business.audit.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

async function handleServiceStatusUpdate(req: Parameters<Parameters<typeof router.post>[1]>[0], res: Parameters<Parameters<typeof router.post>[1]>[1]) {
  try {
    const user = await requireServiceBusinessPermission(
      req,
      res,
      SERVICE_BUSINESS_PERMISSIONS.jobStatusUpdate,
    );
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const body = requireBodyObject(req.body);
    const nextStatus = parseServiceBusinessWorkflowStatus(body?.nextStatus ?? body?.status);
    const note = getText(body?.note);

    if (!nextStatus) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "nextStatus/status is required and must be a valid service status.",
      });
    }

    const target = await findServiceWorkflowTarget(businessContext.businessId, req.params.id ?? "");
    if (!target) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Service workflow target not found.",
      });
    }

    const readiness = await loadServiceWorkflowReadiness(target);
    const preview = buildServiceTransitionPreview(target, nextStatus, readiness);

    if (!preview.isAllowedTransition) {
      return errorResponse(res, {
        status: 409,
        code: errorCodes.validationError,
        message: `Cannot move service workflow from ${target.currentStatus} to ${nextStatus}.`,
      });
    }

    if (preview.unmetRequirements.length > 0) {
      return errorResponse(res, {
        status: 422,
        code: errorCodes.validationError,
        message: "Service transition requirements are not met.",
      });
    }

    await updateServiceWorkflowStatus({
      target,
      nextStatus,
      actorName: user.name ?? "System",
      note,
    });

    await writeServiceBusinessAuditLog({
      businessId: businessContext.businessId,
      userId: user.id,
      action: "UPDATE",
      entityType: "ServiceWorkflowStatus",
      entityId: target.jobId ?? target.requestId,
      changes: {
        requestCode: target.requestCode,
        from: target.currentStatus,
        to: nextStatus,
        note: note || null,
        targetType: target.jobId ? "job" : "request",
        unmetRequirements: preview.unmetRequirements.length,
      },
    });

    return successResponse(res, {
      data: presentServiceStatusMutation({ nextStatus, preview }),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}

router.post("/custom-business/service/status/jobs/:id", handleServiceStatusUpdate);
router.post("/custom-business/service/status/requests/:id", handleServiceStatusUpdate);

export default router;
