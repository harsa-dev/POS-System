import type { Role } from "@prisma/client";
import { Router } from "express";

import {
  requireBusinessContextForRequest,
  requireBusinessMode,
} from "../lib/business-context/index.js";
import { requireRole } from "../lib/auth.js";
import { ALL_ROLES } from "../lib/constants.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { successResponse } from "../lib/responses/success-response.js";
import {
  cancelRawMaterialIntake,
  createRawMaterialIntake,
  createRawMaterialStorageLocation,
  createRawMaterialSupplier,
  deactivateRawMaterialStorageLocation,
  deactivateRawMaterialSupplier,
  listRawMaterialIntakes,
  listRawMaterialStorageLocations,
  listRawMaterialSuppliers,
  updateRawMaterialIntake,
  updateRawMaterialStorageLocation,
  updateRawMaterialSupplier,
} from "../services/raw-material/index.js";

const router = Router();

router.use("/raw-material", requireBusinessMode(["raw-material"]));

function getActor(user: { id: string; role: Role }) {
  return {
    id: user.id,
    role: user.role,
  };
}

router.get("/raw-material/suppliers", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await listRawMaterialSuppliers({
      actor: getActor(user),
      businessContext,
      includeInactive: req.query.includeInactive === "true",
      search: typeof req.query.search === "string" ? req.query.search : undefined,
    });

    return successResponse(res, { data });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/raw-material/suppliers", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await createRawMaterialSupplier({
      actor: getActor(user),
      businessContext,
      input: req.body ?? {},
    });

    return successResponse(res, {
      data,
      status: 201,
      message: "Raw material supplier created.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/raw-material/suppliers/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await updateRawMaterialSupplier({
      actor: getActor(user),
      businessContext,
      id: req.params.id,
      input: req.body ?? {},
    });

    return successResponse(res, {
      data,
      message: "Raw material supplier updated.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.delete("/raw-material/suppliers/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await deactivateRawMaterialSupplier({
      actor: getActor(user),
      businessContext,
      id: req.params.id,
    });

    return successResponse(res, {
      data,
      message: "Raw material supplier deactivated.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/raw-material/storage-locations", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await listRawMaterialStorageLocations({
      actor: getActor(user),
      businessContext,
      includeInactive: req.query.includeInactive === "true",
      search: typeof req.query.search === "string" ? req.query.search : undefined,
    });

    return successResponse(res, { data });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/raw-material/storage-locations", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await createRawMaterialStorageLocation({
      actor: getActor(user),
      businessContext,
      input: req.body ?? {},
    });

    return successResponse(res, {
      data,
      status: 201,
      message: "Raw material storage location created.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/raw-material/storage-locations/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await updateRawMaterialStorageLocation({
      actor: getActor(user),
      businessContext,
      id: req.params.id,
      input: req.body ?? {},
    });

    return successResponse(res, {
      data,
      message: "Raw material storage location updated.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.delete("/raw-material/storage-locations/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await deactivateRawMaterialStorageLocation({
      actor: getActor(user),
      businessContext,
      id: req.params.id,
    });

    return successResponse(res, {
      data,
      message: "Raw material storage location deactivated.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/raw-material/intakes", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await listRawMaterialIntakes({
      actor: getActor(user),
      businessContext,
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      supplierId: typeof req.query.supplierId === "string" ? req.query.supplierId : undefined,
      targetStorageLocationId: typeof req.query.targetStorageLocationId === "string" ? req.query.targetStorageLocationId : undefined,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
    });

    return successResponse(res, { data });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/raw-material/intakes", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await createRawMaterialIntake({
      actor: getActor(user),
      businessContext,
      input: req.body ?? {},
    });

    return successResponse(res, {
      data,
      status: 201,
      message: "Raw material intake created.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/raw-material/intakes/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await updateRawMaterialIntake({
      actor: getActor(user),
      businessContext,
      id: req.params.id,
      input: req.body ?? {},
    });

    return successResponse(res, {
      data,
      message: "Raw material intake updated.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.delete("/raw-material/intakes/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForRequest(req, user);
    const data = await cancelRawMaterialIntake({
      actor: getActor(user),
      businessContext,
      id: req.params.id,
    });

    return successResponse(res, {
      data,
      message: "Raw material intake cancelled.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
