import type { Role } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { ALL_ROLES } from "../lib/constants.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { successResponse } from "../lib/responses/success-response.js";
import { getInventoryModePolicy } from "../services/inventory/inventory.mode-policy.js";
import {
  createInventoryItem,
  createStockMovement,
  deleteInventoryItem,
  getInventoryDashboard,
  listInventoryItems,
  listStockMovements,
  updateInventoryItem,
} from "../services/inventory/index.js";

const router = Router();

function getActor(user: { id: string; role: Role }) {
  return {
    id: user.id,
    role: user.role,
  };
}

router.get("/inventory-items", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const data = await listInventoryItems({
      actor: getActor(user),
      businessContext,
    });

    return successResponse(res, { data });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/inventory-items", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const data = await createInventoryItem({
      actor: getActor(user),
      businessContext,
      input: req.body ?? {},
    });

    return successResponse(res, {
      data,
      status: 201,
      message: "Inventory item created.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/inventory-items/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const data = await updateInventoryItem({
      actor: getActor(user),
      businessContext,
      id: req.params.id,
      input: req.body ?? {},
    });

    return successResponse(res, {
      data,
      message: "Inventory item updated.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.delete("/inventory-items/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const data = await deleteInventoryItem({
      actor: getActor(user),
      businessContext,
      id: req.params.id,
    });

    return successResponse(res, {
      data,
      message: "Inventory item deleted.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/inventory-capabilities", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const data = {
      businessId: businessContext.businessId,
      restaurantId: businessContext.restaurantId,
      businessMode: businessContext.businessMode,
      policy: getInventoryModePolicy(businessContext),
    };

    return successResponse(res, { data });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/inventory-dashboard", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const data = await getInventoryDashboard({
      actor: getActor(user),
      businessContext,
    });

    return successResponse(res, { data });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/inventory", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const data = await listStockMovements({
      actor: getActor(user),
      businessContext,
      inventoryItemId: typeof req.query.inventoryItemId === "string" ? req.query.inventoryItemId : undefined,
      limit: typeof req.query.limit === "string" ? Number(req.query.limit) : undefined,
    });

    return successResponse(res, { data });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/inventory", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const data = await createStockMovement({
      actor: getActor(user),
      businessContext,
      input: req.body ?? {},
    });

    return successResponse(res, {
      data,
      status: 201,
      message: "Stock movement created.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
