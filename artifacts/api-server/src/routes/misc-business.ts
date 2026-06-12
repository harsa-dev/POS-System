import { Router } from "express";
import { OrderStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { getCurrentUser, requireRole } from "../lib/auth.js";
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

const TERMINAL_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
];

function cleanOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parsePositiveQuantity(value: unknown) {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : null;
}

router.get("/restaurants", async (_req, res) => {
  return successResponse(res, { data: null });
});

router.get("/recipes", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);

    const recipes = await prisma.recipe.findMany({
      where: { menuItem: createRestaurantScopeWhere(businessContext) },
      include: { menuItem: true, inventoryItem: true },
      orderBy: { menuItem: { name: "asc" } },
    });

    return successResponse(res, { data: recipes });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/recipes", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);

    const menuItemId = cleanOptionalString(req.body?.menuItemId);
    const inventoryItemId = cleanOptionalString(req.body?.inventoryItemId);
    const { quantityNeeded } = req.body ?? {};

    if (!menuItemId || !inventoryItemId || quantityNeeded === undefined) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "menuItemId, inventoryItemId, quantityNeeded required.",
      });
    }

    const quantity = parsePositiveQuantity(quantityNeeded);

    if (quantity === null) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "quantityNeeded must be a positive number.",
      });
    }

    const [menuItem, inventoryItem] = await Promise.all([
      prisma.menuItem.findFirst({
        where: { id: menuItemId, ...createRestaurantScopeWhere(businessContext) },
        select: { id: true },
      }),
      prisma.inventoryItem.findFirst({
        where: {
          id: inventoryItemId,
          ...createRestaurantScopeWhere(businessContext),
        },
        select: { id: true },
      }),
    ]);

    if (!menuItem) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Menu item not found.",
      });
    }

    if (!inventoryItem) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.inventoryItemNotFound,
        message: "Inventory item not found.",
      });
    }

    const recipe = await prisma.recipe.upsert({
      where: { menuItemId_inventoryItemId: { menuItemId, inventoryItemId } },
      create: { menuItemId, inventoryItemId, quantityNeeded: quantity },
      update: { quantityNeeded: quantity },
      include: { menuItem: true, inventoryItem: true },
    });

    return successResponse(res, { data: recipe, status: 201 });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/recipes/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);

    const { id } = req.params;
    const inventoryItemId = cleanOptionalString(req.body?.inventoryItemId);
    const { quantityNeeded } = req.body ?? {};

    if (!inventoryItemId && quantityNeeded === undefined) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "inventoryItemId or quantityNeeded required.",
      });
    }

    let quantity: number | undefined;

    if (quantityNeeded !== undefined) {
      const parsedQuantity = parsePositiveQuantity(quantityNeeded);

      if (parsedQuantity === null) {
        return errorResponse(res, {
          status: 400,
          code: errorCodes.validationError,
          message: "quantityNeeded must be a positive number.",
        });
      }

      quantity = parsedQuantity;
    }

    const recipe = await prisma.recipe.findFirst({
      where: { id, menuItem: createRestaurantScopeWhere(businessContext) },
    });

    if (!recipe) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Recipe not found.",
      });
    }

    if (inventoryItemId) {
      const inventoryItem = await prisma.inventoryItem.findFirst({
        where: {
          id: inventoryItemId,
          ...createRestaurantScopeWhere(businessContext),
        },
        select: { id: true },
      });

      if (!inventoryItem) {
        return errorResponse(res, {
          status: 404,
          code: errorCodes.inventoryItemNotFound,
          message: "Inventory item not found.",
        });
      }

      const duplicateRecipe = await prisma.recipe.findFirst({
        where: {
          id: { not: id },
          menuItemId: recipe.menuItemId,
          inventoryItemId,
        },
        select: { id: true },
      });

      if (duplicateRecipe) {
        return errorResponse(res, {
          status: 400,
          code: errorCodes.conflict,
          message: "Recipe ingredient already exists for this menu item.",
        });
      }
    }

    const updated = await prisma.recipe.update({
      where: { id },
      data: {
        ...(inventoryItemId
          ? { inventoryItem: { connect: { id: inventoryItemId } } }
          : {}),
        ...(quantity !== undefined ? { quantityNeeded: quantity } : {}),
      },
      include: { menuItem: true, inventoryItem: true },
    });

    return successResponse(res, { data: updated });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.delete("/recipes/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);

    const { id } = req.params;

    const recipe = await prisma.recipe.findFirst({
      where: { id, menuItem: createRestaurantScopeWhere(businessContext) },
      include: { menuItem: true },
    });

    if (!recipe) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Recipe not found.",
      });
    }

    const activeOrderItem = await prisma.orderItem.findFirst({
      where: {
        menuItemId: recipe.menuItemId,
        order: {
          ...createRestaurantScopeWhere(businessContext),
          status: { notIn: TERMINAL_ORDER_STATUSES },
        },
      },
      select: {
        id: true,
        order: { select: { orderNumber: true, status: true } },
      },
    });

    if (activeOrderItem) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.conflict,
        message:
          "This ingredient cannot be removed while active orders for this menu item exist.",
      });
    }

    const recipeCount = await prisma.recipe.count({
      where: { menuItemId: recipe.menuItemId },
    });

    if (recipe.menuItem.isAvailable && recipeCount <= 1) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message:
          "Cannot remove the last ingredient while this menu item is available. Make the menu item unavailable first.",
      });
    }

    await prisma.recipe.delete({ where: { id } });

    return successResponse(res, { data: null, message: "Recipe deleted." });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/payments", async (req, res) => {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return errorResponse(res, {
        status: 401,
        code: errorCodes.unauthorized,
        message: "Unauthorized.",
      });
    }

    const businessContext = await requireBusinessContextForUser(user);

    const payments = await prisma.payment.findMany({
      where: { order: createRestaurantScopeWhere(businessContext) },
      include: { order: true },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(res, { data: payments });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
