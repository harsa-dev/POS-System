import type { Role } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForRequest, requireBusinessMode } from "../lib/business-context/index.js";
import { ALL_ROLES } from "../lib/constants.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { successResponse } from "../lib/responses/success-response.js";
import {
  createRawMaterialProcessingRun,
  listRawMaterialProcessingRuns,
} from "../services/raw-material/index.js";

const router = Router();

router.use("/raw-material", requireBusinessMode(["raw-material"]));

function getActor(user: { id: string; role: Role }) {
  return { id: user.id, role: user.role };
}

router.get("/raw-material/processing-runs", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await listRawMaterialProcessingRuns({
      actor: getActor(user),
      businessContext,
      inputBatchId: typeof req.query.inputBatchId === "string" ? req.query.inputBatchId : undefined,
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
    });
    return successResponse(res, { data });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/raw-material/processing-runs", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await createRawMaterialProcessingRun({
      actor: getActor(user),
      businessContext,
      input: req.body ?? {},
    });
    return successResponse(res, { data, status: 201, message: "Raw material processing run created." });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
