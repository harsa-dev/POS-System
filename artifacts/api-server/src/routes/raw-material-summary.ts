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
import { getRawMaterialSummary } from "../services/raw-material/raw-material.summary.js";

const router = Router();

router.use("/raw-material", requireBusinessMode(["raw-material"]));

router.get("/raw-material/summary", async (req, res) => {
  try {
    const user = await requireRawMaterialPermission(req, res, RAW_MATERIAL_PERMISSIONS.view);
    if (!user) return;

    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await getRawMaterialSummary(businessContext);

    return successResponse(res, { data });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
