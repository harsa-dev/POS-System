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
  createRawMaterialPen,
  deactivateRawMaterialPen,
  listRawMaterialPens,
  updateRawMaterialPen,
  type RawMaterialPenHealthStatus,
} from "../services/raw-material/index.js";

const router = Router();

router.use("/raw-material", requireBusinessMode(["raw-material"]));

function getActor(user: { id: string; role: Role }) {
  return { id: user.id, role: user.role };
}

function getOptionalBoolean(value: unknown) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

router.get("/raw-material/pens", async (req, res) => {
  try {
    const user = await requireRawMaterialPermission(req, res, RAW_MATERIAL_PERMISSIONS.view);
    if (!user) return;
    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await listRawMaterialPens({
      actor: getActor(user),
      businessContext,
      query: {
        feedBatchId: typeof req.query.feedBatchId === "string" ? req.query.feedBatchId : undefined,
        healthStatus: typeof req.query.healthStatus === "string"
          ? (req.query.healthStatus.toUpperCase() as RawMaterialPenHealthStatus)
          : undefined,
        isActive: getOptionalBoolean(req.query.isActive),
        search: typeof req.query.search === "string" ? req.query.search : undefined,
      },
    });
    return successResponse(res, { data });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/raw-material/pens", async (req, res) => {
  try {
    const user = await requireRawMaterialPermission(req, res, RAW_MATERIAL_PERMISSIONS.kandangManage);
    if (!user) return;
    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await createRawMaterialPen({
      actor: getActor(user),
      businessContext,
      input: req.body ?? {},
    });
    return successResponse(res, { data, status: 201, message: "Raw material pen created." });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/raw-material/pens/:id", async (req, res) => {
  try {
    const user = await requireRawMaterialPermission(req, res, RAW_MATERIAL_PERMISSIONS.kandangManage);
    if (!user) return;
    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await updateRawMaterialPen({
      actor: getActor(user),
      businessContext,
      id: req.params.id,
      input: req.body ?? {},
    });
    return successResponse(res, { data, message: "Raw material pen updated." });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.delete("/raw-material/pens/:id", async (req, res) => {
  try {
    const user = await requireRawMaterialPermission(req, res, RAW_MATERIAL_PERMISSIONS.kandangManage);
    if (!user) return;
    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await deactivateRawMaterialPen({
      actor: getActor(user),
      businessContext,
      id: req.params.id,
    });
    return successResponse(res, { data, message: "Raw material pen deactivated." });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
