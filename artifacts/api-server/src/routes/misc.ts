import { OrderStatus } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { MANAGEMENT_ROLES, OWNER_ONLY } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

const TERMINAL_ORDER_STATUSES: OrderStatus[] = [OrderStatus.COMPLETED, OrderStatus.CANCELLED];

function cleanOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parsePositiveQuantity(value: unknown) {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : null;
}

router.get("/settings", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    return successResponse(res, {
      data: {
        ...businessContext.business.restaurant,
        businessId: businessContext.businessId,
        name: businessContext.businessName,
        type: businessContext.businessType,
        mode: businessContext.businessMode,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/settings", async (req, res) => {
  try {
    const user = await requireRole(req, res, OWNER_ONLY);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const body = req.body ?? {};
    const name = cleanOptionalString(body.name);

    const updated = await prisma.$transaction(async (tx) => {
      const business = name
        ? await tx.business.update({ where: { id: businessContext.businessId }, data: { name } })
        : businessContext.business;

      const restaurant = await tx.restaurant.upsert({
        where: { businessId: businessContext.businessId },
        create: {
          businessId: businessContext.businessId,
          address: cleanOptionalString(body.address) || null,
          phone: cleanOptionalString(body.phone) || null,
          logoUrl: cleanOptionalString(body.logoUrl) || null,
          taxRate: Number(body.taxRate ?? 0),
          serviceRate: Number(body.serviceRate ?? 0),
          currency: String(body.currency ?? "IDR").toUpperCase(),
          timezone: String(body.timezone ?? "Asia/Jakarta"),
          receiptFooter: String(body.receiptFooter ?? ""),
          autoPrint: Boolean(body.autoPrint ?? false),
          orderPrefix: String(body.orderPrefix ?? "ORD").toUpperCase(),
          cashEnabled: Boolean(body.cashEnabled ?? true),
          qrisEnabled: Boolean(body.qrisEnabled ?? false),
          cardEnabled: Boolean(body.cardEnabled ?? false),
          transferEnabled: Boolean(body.transferEnabled ?? false),
          midtransEnabled: Boolean(body.midtransEnabled ?? false),
          midtransServerKey: cleanOptionalString(body.midtransServerKey) || null,
          midtransClientKey: cleanOptionalString(body.midtransClientKey) || null,
        },
        update: {
          address: body.address !== undefined ? cleanOptionalString(body.address) || null : undefined,
          phone: body.phone !== undefined ? cleanOptionalString(body.phone) || null : undefined,
          logoUrl: body.logoUrl !== undefined ? cleanOptionalString(body.logoUrl) || null : undefined,
          taxRate: body.taxRate !== undefined ? Number(body.taxRate) : undefined,
          serviceRate: body.serviceRate !== undefined ? Number(body.serviceRate) : undefined,
          currency: body.currency !== undefined ? String(body.currency).toUpperCase() : undefined,
          timezone: body.timezone !== undefined ? String(body.timezone) : undefined,
          receiptFooter: body.receiptFooter !== undefined ? String(body.receiptFooter) : undefined,
          autoPrint: body.autoPrint !== undefined ? Boolean(body.autoPrint) : undefined,
          orderPrefix: body.orderPrefix !== undefined ? String(body.orderPrefix).toUpperCase() : undefined,
          cashEnabled: body.cashEnabled !== undefined ? Boolean(body.cashEnabled) : undefined,
          qrisEnabled: body.qrisEnabled !== undefined ? Boolean(body.qrisEnabled) : undefined,
          cardEnabled: body.cardEnabled !== undefined ? Boolean(body.cardEnabled) : undefined,
          transferEnabled: body.transferEnabled !== undefined ? Boolean(body.transferEnabled) : undefined,
          midtransEnabled: body.midtransEnabled !== undefined ? Boolean(body.midtransEnabled) : undefined,
          midtransServerKey: body.midtransServerKey !== undefined ? cleanOptionalString(body.midtransServerKey) || null : undefined,
          midtransClientKey: body.midtransClientKey !== undefined ? cleanOptionalString(body.midtransClientKey) || null : undefined,
        },
      });

      return { ...restaurant, businessId: business.id, name: business.name };
    });

    return successResponse(res, { data: updated });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/restaurants", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    return successResponse(res, {
      data: {
        businessId: businessContext.businessId,
        name: businessContext.businessName,
        type: businessContext.businessType,
        mode: businessContext.businessMode,
        restaurant: businessContext.business.restaurant,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/recipes", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    const recipes = await prisma.recipe.findMany({
      where: { menuItem: { businessId: businessContext.businessId } },
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
    const quantity = parsePositiveQuantity(req.body?.quantityNeeded);

    if (!menuItemId || !inventoryItemId || quantity === null) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "menuItemId, inventoryItemId, and positive quantityNeeded are required.",
      });
    }

    const [menuItem, inventoryItem] = await Promise.all([
      prisma.menuItem.findFirst({ where: { id: menuItemId, businessId: businessContext.businessId }, select: { id: true } }),
      prisma.inventoryItem.findFirst({ where: { id: inventoryItemId, businessId: businessContext.businessId }, select: { id: true } }),
    ]);

    if (!menuItem) return errorResponse(res, { status: 404, code: errorCodes.notFound, message: "Menu item not found." });
    if (!inventoryItem) return errorResponse(res, { status: 404, code: errorCodes.inventoryItemNotFound, message: "Inventory item not found." });

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
    const id = String(req.params.id ?? "").trim();
    const inventoryItemId = cleanOptionalString(req.body?.inventoryItemId);
    const quantity = req.body?.quantityNeeded === undefined ? undefined : parsePositiveQuantity(req.body.quantityNeeded);

    if (!inventoryItemId && quantity === undefined) {
      return errorResponse(res, { status: 400, code: errorCodes.validationError, message: "inventoryItemId or quantityNeeded is required." });
    }
    if (quantity === null) {
      return errorResponse(res, { status: 400, code: errorCodes.validationError, message: "quantityNeeded must be a positive number." });
    }

    const recipe = await prisma.recipe.findFirst({ where: { id, menuItem: { businessId: businessContext.businessId } } });
    if (!recipe) return errorResponse(res, { status: 404, code: errorCodes.notFound, message: "Recipe not found." });

    if (inventoryItemId) {
      const inventoryItem = await prisma.inventoryItem.findFirst({
        where: { id: inventoryItemId, businessId: businessContext.businessId },
        select: { id: true },
      });
      if (!inventoryItem) return errorResponse(res, { status: 404, code: errorCodes.inventoryItemNotFound, message: "Inventory item not found." });
    }

    const updated = await prisma.recipe.update({
      where: { id },
      data: {
        ...(inventoryItemId ? { inventoryItem: { connect: { id: inventoryItemId } } } : {}),
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
    const id = String(req.params.id ?? "").trim();

    const recipe = await prisma.recipe.findFirst({
      where: { id, menuItem: { businessId: businessContext.businessId } },
      include: { menuItem: true },
    });
    if (!recipe) return errorResponse(res, { status: 404, code: errorCodes.notFound, message: "Recipe not found." });

    const activeOrderItem = await prisma.orderItem.findFirst({
      where: {
        menuItemId: recipe.menuItemId,
        order: { businessId: businessContext.businessId, status: { notIn: TERMINAL_ORDER_STATUSES } },
      },
      select: { id: true },
    });
    if (activeOrderItem) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "This ingredient cannot be removed while active orders for this menu item exist.",
      });
    }

    await prisma.recipe.delete({ where: { id } });
    return successResponse(res, { data: { id }, message: "Recipe deleted." });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
