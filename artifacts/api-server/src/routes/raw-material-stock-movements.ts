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
  adjustRawMaterialBatchStock,
  consumeRawMaterialForProcessingRun,
  listRawMaterialStockMovements,
  reverseRawMaterialStockAdjustment,
  transferRawMaterialBatchStorage,
} from "../services/raw-material/index.js";

const router = Router();

router.use("/raw-material", requireBusinessMode(["raw-material"]));

function getActor(user: { id: string; role: Role }) {
  return { id: user.id, role: user.role };
}

router.get("/raw-material/stock-movements", async (req, res) => {
  try {
    const user = await requireRawMaterialPermission(req, res, RAW_MATERIAL_PERMISSIONS.view);
    if (!user) return;
    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await listRawMaterialStockMovements({
      actor: getActor(user),
      businessContext,
      query: {
        batchId: typeof req.query.batchId === "string" ? req.query.batchId : undefined,
        type: typeof req.query.type === "string" ? req.query.type : undefined,
        reason: typeof req.query.reason === "string" ? req.query.reason : undefined,
        source: typeof req.query.source === "string" ? req.query.source : undefined,
        sourceId: typeof req.query.sourceId === "string" ? req.query.sourceId : undefined,
        storageLocationId: typeof req.query.storageLocationId === "string" ? req.query.storageLocationId : undefined,
        search: typeof req.query.search === "string" ? req.query.search : undefined,
      },
    });
    return successResponse(res, { data });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/raw-material/stock-movements/adjust", async (req, res) => {
  try {
    const user = await requireRawMaterialPermission(req, res, RAW_MATERIAL_PERMISSIONS.stockAdjust);
    if (!user) return;
    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await adjustRawMaterialBatchStock({
      actor: getActor(user),
      businessContext,
      input: req.body ?? {},
    });
    return successResponse(res, { data, status: 201, message: "Raw material stock adjusted." });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/raw-material/stock-movements/:id/reverse-adjustment", async (req, res) => {
  try {
    const user = await requireRawMaterialPermission(req, res, RAW_MATERIAL_PERMISSIONS.stockAdjust);
    if (!user) return;
    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await reverseRawMaterialStockAdjustment({
      actor: getActor(user),
      businessContext,
      input: {
        ...(req.body ?? {}),
        movementId: req.params.id,
      },
    });
    return successResponse(res, { data, status: 201, message: "Raw material stock adjustment reversed." });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/raw-material/stock-movements/transfer", async (req, res) => {
  try {
    const user = await requireRawMaterialPermission(req, res, RAW_MATERIAL_PERMISSIONS.stockTransfer);
    if (!user) return;
    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await transferRawMaterialBatchStorage({
      actor: getActor(user),
      businessContext,
      input: req.body ?? {},
    });
    return successResponse(res, { data, status: 201, message: "Raw material batch transferred." });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/raw-material/stock-movements/consume-processing", async (req, res) => {
  try {
    const user = await requireRawMaterialPermission(req, res, RAW_MATERIAL_PERMISSIONS.stockConsume);
    if (!user) return;
    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await consumeRawMaterialForProcessingRun({
      actor: getActor(user),
      businessContext,
      input: req.body ?? {},
    });
    return successResponse(res, { data, status: 201, message: "Raw material stock consumed for processing." });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
