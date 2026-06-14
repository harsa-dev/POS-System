import type { Role } from "@prisma/client";
import { Router } from "express";

import { requireBusinessContextForRequest, requireBusinessMode } from "../lib/business-context/index.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { successResponse } from "../lib/responses/success-response.js";
import {
  RAW_MATERIAL_PERMISSIONS,
  requireRawMaterialPermission,
} from "../services/raw-material/raw-material.permissions.js";
import {
  setRawMaterialBatchStatus,
  setRawMaterialIntakeStatus,
  setRawMaterialPenHealthStatus,
  setRawMaterialProcessingStatus,
} from "../services/raw-material/raw-material-status.service.js";

const router = Router();

router.use("/raw-material", requireBusinessMode(["raw-material"]));

function getActor(user: { id: string; role: Role }) {
  return { id: user.id, role: user.role };
}

router.post("/raw-material/status/intakes/:id", async (req, res) => {
  try {
    const user = await requireRawMaterialPermission(req, res, RAW_MATERIAL_PERMISSIONS.intakeUpdate);
    if (!user) return;

    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await setRawMaterialIntakeStatus({
      actor: getActor(user),
      businessContext,
      id: req.params.id,
      input: req.body ?? {},
    });

    return successResponse(res, {
      data,
      message: "Raw material intake status updated.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/raw-material/status/batches/:id", async (req, res) => {
  try {
    const user = await requireRawMaterialPermission(req, res, RAW_MATERIAL_PERMISSIONS.batchManage);
    if (!user) return;

    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await setRawMaterialBatchStatus({
      actor: getActor(user),
      businessContext,
      id: req.params.id,
      input: req.body ?? {},
    });

    return successResponse(res, {
      data,
      message: "Raw material batch status updated.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/raw-material/status/processing-runs/:id", async (req, res) => {
  try {
    const user = await requireRawMaterialPermission(req, res, RAW_MATERIAL_PERMISSIONS.processingManage);
    if (!user) return;

    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await setRawMaterialProcessingStatus({
      actor: getActor(user),
      businessContext,
      id: req.params.id,
      input: req.body ?? {},
    });

    return successResponse(res, {
      data,
      message: "Raw material processing status updated.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/raw-material/status/pens/:id", async (req, res) => {
  try {
    const user = await requireRawMaterialPermission(req, res, RAW_MATERIAL_PERMISSIONS.kandangManage);
    if (!user) return;

    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await setRawMaterialPenHealthStatus({
      actor: getActor(user),
      businessContext,
      id: req.params.id,
      input: req.body ?? {},
    });

    return successResponse(res, {
      data,
      message: "Raw material pen health status updated.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
