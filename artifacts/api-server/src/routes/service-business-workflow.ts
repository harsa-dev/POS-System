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
import {
  presentServiceStatusMutation,
  presentServiceTransitionPreview,
  presentServiceWorkflowStatuses,
} from "../features/service-business/service-business.presenter.js";
import { buildServiceTransitionPreview } from "../features/service-business/service-business.workflow.js";
import {
  getText,
  parseServiceBusinessWorkflowStatus,
  requireBodyObject,
} from "../features/service-business/service-business.validators.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

router.get("/custom-business/service/workflow/statuses", async (req, res) => {
  try {
    const user = await requireServiceBusinessPermission(req, res, SERVICE_BUSINESS_PERMISSIONS.view);
    if (!user) return;

    await requireBusinessContextForUser(user);

    return successResponse(res, {
      data: presentServiceWorkflowStatuses(),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/custom-business/service/jobs/:id/transition-preview", async (req, res) => {
  try {
    const user = await requireServiceBusinessPermission(req, res, SERVICE_BUSINESS_PERMISSIONS.view);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const nextStatus = parseServiceBusinessWorkflowStatus(req.query.nextStatus);

    if (!nextStatus) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "nextStatus is required and must be a valid service status.",
      });
    }

    const target = await findServiceWorkflowTarget(businessContext.businessId, req.params.id ?? "");
    if (!target) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Service job not found.",
      });
    }

    const readiness = await loadServiceWorkflowReadiness(target);
    const preview = buildServiceTransitionPreview(target, nextStatus, readiness);

    return successResponse(res, {
      data: presentServiceTransitionPreview(preview),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/custom-business/service/jobs/:id/guarded-status", async (req, res) => {
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
        message: "Service job not found.",
      });
    }

    const readiness = await loadServiceWorkflowReadiness(target);
    const preview = buildServiceTransitionPreview(target, nextStatus, readiness);

    if (!preview.isAllowedTransition) {
      return errorResponse(res, {
        status: 409,
        code: errorCodes.validationError,
        message: `Cannot move service job from ${target.currentStatus} to ${nextStatus}.`,
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

    return successResponse(res, {
      data: presentServiceStatusMutation({ nextStatus, preview }),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
