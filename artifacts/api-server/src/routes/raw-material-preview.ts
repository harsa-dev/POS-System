import { Router } from "express";

import {
  requireBusinessContextForRequest,
  requireBusinessMode,
} from "../lib/business-context/index.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { successResponse } from "../lib/responses/success-response.js";
import {
  RAW_MATERIAL_PERMISSIONS,
  requireRawMaterialPermission,
} from "../services/raw-material/raw-material.permissions.js";
import {
  previewRawMaterialBatch,
  previewRawMaterialIntake,
  previewRawMaterialProcessingRun,
} from "../services/raw-material/raw-material-preview.service.js";

const router = Router();

router.use("/raw-material", requireBusinessMode(["raw-material"]));

router.post("/raw-material/previews/intake", async (req, res) => {
  try {
    const user = await requireRawMaterialPermission(req, res, RAW_MATERIAL_PERMISSIONS.view);
    if (!user) return;

    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await previewRawMaterialIntake({
      businessId: businessContext.businessId,
      input: req.body ?? {},
    });

    return successResponse(res, { data });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/raw-material/previews/batch", async (req, res) => {
  try {
    const user = await requireRawMaterialPermission(req, res, RAW_MATERIAL_PERMISSIONS.view);
    if (!user) return;

    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await previewRawMaterialBatch({
      businessId: businessContext.businessId,
      input: req.body ?? {},
    });

    return successResponse(res, { data });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/raw-material/previews/processing-run", async (req, res) => {
  try {
    const user = await requireRawMaterialPermission(req, res, RAW_MATERIAL_PERMISSIONS.view);
    if (!user) return;

    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await previewRawMaterialProcessingRun({
      businessId: businessContext.businessId,
      input: req.body ?? {},
    });

    return successResponse(res, { data });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
