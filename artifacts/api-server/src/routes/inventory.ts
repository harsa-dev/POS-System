import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import { requireRole } from "../lib/auth.js";
import { MANAGEMENT_ROLES } from "../lib/constants.js";
import {
  createRestaurantScopeWhere,
  requireBusinessContextForUser,
} from "../lib/business-context/index.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

router.get("/inventory-items", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);

    const items = await prisma.inventoryItem.findMany({
      where: createRestaurantScopeWhere(businessContext),
      orderBy: { createdAt: "desc" },
    });

    return successResponse(res, { data: items });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/inventory-items", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const { name, sku, type, unit, currentStock, minimumStock, costPerUnit } = req.body ?? {};

    if (!name || !type || !unit) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Name, type and unit are required.",
      });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        sku: sku || null,
        type,
        unit,
        currentStock: Number(currentStock ?? 0),
        minimumStock: Number(minimumStock ?? 0),
        costPerUnit: Number(costPerUnit ?? 0),
        restaurantId: businessContext.businessId,
      },
    });

    return successResponse(res, {
      data: item,
      status: 201,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/inventory-items/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const { id } = req.params;

    const existing = await prisma.inventoryItem.findFirst({
      where: {
        id,
        ...createRestaurantScopeWhere(businessContext),
      },
    });

    if (!existing) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.inventoryItemNotFound,
        message: "Inventory item not found.",
      });
    }

    const { name, sku, type, unit, currentStock, minimumStock, costPerUnit } = req.body ?? {};

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(sku !== undefined ? { sku: sku || null } : {}),
        ...(type ? { type } : {}),
        ...(unit ? { unit } : {}),
        ...(currentStock !== undefined ? { currentStock: Number(currentStock) } : {}),
        ...(minimumStock !== undefined ? { minimumStock: Number(minimumStock) } : {}),
        ...(costPerUnit !== undefined ? { costPerUnit: Number(costPerUnit) } : {}),
      },
    });

    return successResponse(res, { data: item });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.delete("/inventory-items/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const { id } = req.params;

    const existing = await prisma.inventoryItem.findFirst({
      where: {
        id,
        ...createRestaurantScopeWhere(businessContext),
      },
    });

    if (!existing) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.inventoryItemNotFound,
        message: "Inventory item not found.",
      });
    }

    await prisma.inventoryItem.delete({ where: { id } });

    return successResponse(res, {
      data: { id },
      message: "Inventory item deleted.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

// Stock movements
router.get("/inventory", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);

    const movements = await prisma.stockMovement.findMany({
      where: {
        inventoryItem: createRestaurantScopeWhere(businessContext),
      },
      include: { inventoryItem: true },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(res, { data: movements });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/inventory", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const { inventoryItemId, type, quantity, note, reason } = req.body ?? {};

    if (!inventoryItemId || !type || quantity === undefined) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "inventoryItemId, type and quantity are required.",
      });
    }

    const inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        id: inventoryItemId,
        ...createRestaurantScopeWhere(businessContext),
      },
    });

    if (!inventoryItem) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.inventoryItemNotFound,
        message: "Inventory item not found.",
      });
    }

    let newStock = inventoryItem.currentStock;
    const qty = Number(quantity);

    if (Number.isNaN(qty)) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.invalidStockQuantity,
        message: "Stock movement quantity must be a valid number.",
      });
    }

    if (type === "IN") {
      newStock += qty;
    } else if (type === "OUT") {
      newStock -= qty;
    } else if (type === "ADJUSTMENT") {
      newStock = qty;
    } else {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.invalidStockMovementType,
        message: "Invalid stock movement type.",
      });
    }

    if (newStock < 0) {
      return errorResponse(res, {
        status: 409,
        code: errorCodes.negativeStockNotAllowed,
        message: "Stock cannot be negative.",
      });
    }

    const movement = await prisma.$transaction(async (tx) => {
      const m = await tx.stockMovement.create({
        data: { inventoryItemId, type, quantity: qty, note: note || null, reason },
        include: { inventoryItem: true },
      });

      await tx.inventoryItem.update({
        where: { id: inventoryItemId },
        data: { currentStock: newStock },
      });

      return m;
    });

    return successResponse(res, { data: movement });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
