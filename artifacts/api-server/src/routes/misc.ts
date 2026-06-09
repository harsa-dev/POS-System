import { Router } from "express";
import { OrderStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireRole, getCurrentUser, getRestaurantForUser } from "../lib/auth.js";
import { MANAGEMENT_ROLES, OWNER_ONLY, ERR } from "../lib/constants.js";

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

// Settings
router.get("/settings", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    res.json({ success: true, data: restaurant });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch settings" });
  }
});

router.patch("/settings", async (req, res) => {
  try {
    const user = await requireRole(req, res, OWNER_ONLY);
    if (!user) return;
    const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: user.id } });
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const body = req.body ?? {};
    const updated = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        name: String(body.name ?? restaurant.name).trim(),
        address: body.address ? String(body.address).trim() : null,
        phone: body.phone ? String(body.phone).trim() : null,
        logoUrl: body.logoUrl ? String(body.logoUrl).trim() : null,
        taxRate: Number(body.taxRate ?? restaurant.taxRate),
        serviceRate: Number(body.serviceRate ?? restaurant.serviceRate),
        currency: String(body.currency ?? restaurant.currency).toUpperCase(),
        timezone: String(body.timezone ?? restaurant.timezone),
        receiptFooter: String(body.receiptFooter ?? restaurant.receiptFooter ?? ""),
        autoPrint: Boolean(body.autoPrint ?? restaurant.autoPrint),
        orderPrefix: String(body.orderPrefix ?? restaurant.orderPrefix).toUpperCase(),
        cashEnabled: body.cashEnabled ?? restaurant.cashEnabled,
        qrisEnabled: body.qrisEnabled ?? restaurant.qrisEnabled,
        cardEnabled: body.cardEnabled ?? restaurant.cardEnabled,
        transferEnabled: body.transferEnabled ?? restaurant.transferEnabled,
        midtransEnabled: body.midtransEnabled ?? restaurant.midtransEnabled,
        midtransServerKey: body.midtransServerKey ? String(body.midtransServerKey) : null,
        midtransClientKey: body.midtransClientKey ? String(body.midtransClientKey) : null,
      },
    });
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update settings" });
  }
});

// Restaurants
router.get("/restaurants", async (req, res) => {
  res.json({ success: true });
});

// Recipes
router.get("/recipes", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const recipes = await prisma.recipe.findMany({
      where: { menuItem: { restaurantId: restaurant.id } },
      include: { menuItem: true, inventoryItem: true },
      orderBy: { menuItem: { name: "asc" } },
    });
    res.json({ success: true, data: recipes });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch recipes" });
  }
});

router.post("/recipes", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const menuItemId = cleanOptionalString(req.body?.menuItemId);
    const inventoryItemId = cleanOptionalString(req.body?.inventoryItemId);
    const { quantityNeeded } = req.body ?? {};
    if (!menuItemId || !inventoryItemId || quantityNeeded === undefined)
      return void res.status(400).json({ success: false, message: "menuItemId, inventoryItemId, quantityNeeded required" });
    const quantity = parsePositiveQuantity(quantityNeeded);
    if (quantity === null)
      return void res.status(400).json({ success: false, message: "quantityNeeded must be a positive number" });
    const [menuItem, inventoryItem] = await Promise.all([
      prisma.menuItem.findFirst({
        where: { id: menuItemId, restaurantId: restaurant.id },
        select: { id: true },
      }),
      prisma.inventoryItem.findFirst({
        where: { id: inventoryItemId, restaurantId: restaurant.id },
        select: { id: true },
      }),
    ]);
    if (!menuItem)
      return void res.status(404).json({ success: false, message: "Menu item not found" });
    if (!inventoryItem)
      return void res.status(404).json({ success: false, message: "Inventory item not found" });
    const recipe = await prisma.recipe.upsert({
      where: { menuItemId_inventoryItemId: { menuItemId, inventoryItemId } },
      create: { menuItemId, inventoryItemId, quantityNeeded: quantity },
      update: { quantityNeeded: quantity },
      include: { menuItem: true, inventoryItem: true },
    });
    res.status(201).json({ success: true, data: recipe });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create recipe" });
  }
});

router.patch("/recipes/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const { id } = req.params;
    const inventoryItemId = cleanOptionalString(req.body?.inventoryItemId);
    const { quantityNeeded } = req.body ?? {};
    if (!inventoryItemId && quantityNeeded === undefined)
      return void res.status(400).json({ success: false, message: "inventoryItemId or quantityNeeded required" });
    let quantity: number | undefined;
    if (quantityNeeded !== undefined) {
      const parsedQuantity = parsePositiveQuantity(quantityNeeded);
      if (parsedQuantity === null)
        return void res.status(400).json({ success: false, message: "quantityNeeded must be a positive number" });
      quantity = parsedQuantity;
    }
    const recipe = await prisma.recipe.findFirst({
      where: { id, menuItem: { restaurantId: restaurant.id } },
    });
    if (!recipe) return void res.status(404).json({ success: false, message: "Recipe not found" });
    if (inventoryItemId) {
      const inventoryItem = await prisma.inventoryItem.findFirst({
        where: { id: inventoryItemId, restaurantId: restaurant.id },
        select: { id: true },
      });
      if (!inventoryItem)
        return void res.status(404).json({ success: false, message: "Inventory item not found" });
      const duplicateRecipe = await prisma.recipe.findFirst({
        where: {
          id: { not: id },
          menuItemId: recipe.menuItemId,
          inventoryItemId,
        },
        select: { id: true },
      });
      if (duplicateRecipe)
        return void res.status(400).json({ success: false, message: "Recipe ingredient already exists for this menu item" });
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
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update recipe" });
  }
});

router.delete("/recipes/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const { id } = req.params;
    const recipe = await prisma.recipe.findFirst({
      where: { id, menuItem: { restaurantId: restaurant.id } },
      include: { menuItem: true },
    });
    if (!recipe) return void res.status(404).json({ success: false, message: "Recipe not found" });
    const activeOrderItem = await prisma.orderItem.findFirst({
      where: {
        menuItemId: recipe.menuItemId,
        order: {
          restaurantId: restaurant.id,
          status: { notIn: TERMINAL_ORDER_STATUSES },
        },
      },
      select: {
        id: true,
        order: { select: { orderNumber: true, status: true } },
      },
    });
    if (activeOrderItem)
      return void res.status(400).json({
        success: false,
        message:
          "This ingredient cannot be removed while active orders for this menu item exist.",
      });
    await prisma.recipe.delete({ where: { id } });
    res.json({ success: true, message: "Recipe deleted" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete recipe" });
  }
});

// Payments
router.get("/payments", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return void res.status(401).json({ success: false, message: "Unauthorized" });
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const payments = await prisma.payment.findMany({
      where: { order: { restaurantId: restaurant.id } },
      include: { order: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: payments });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch payments" });
  }
});

export default router;
