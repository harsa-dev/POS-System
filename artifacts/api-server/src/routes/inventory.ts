import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireRole, getRestaurantForUser } from "../lib/auth.js";

const router = Router();

router.get("/inventory-items", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const items = await prisma.inventoryItem.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: items });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch inventory items" });
  }
});

router.post("/inventory-items", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const { name, sku, type, unit, currentStock, minimumStock, costPerUnit } = req.body ?? {};
    if (!name || !type || !unit) return void res.status(400).json({ success: false, message: "Name, type and unit required" });
    const item = await prisma.inventoryItem.create({
      data: {
        name,
        sku: sku || null,
        type,
        unit,
        currentStock: Number(currentStock ?? 0),
        minimumStock: Number(minimumStock ?? 0),
        costPerUnit: Number(costPerUnit ?? 0),
        restaurantId: restaurant.id,
      },
    });
    res.status(201).json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create inventory item" });
  }
});

router.patch("/inventory-items/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const { id } = req.params;
    const existing = await prisma.inventoryItem.findFirst({ where: { id, restaurantId: restaurant.id } });
    if (!existing) return void res.status(404).json({ success: false, message: "Inventory item not found" });
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
    res.json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update inventory item" });
  }
});

router.delete("/inventory-items/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const { id } = req.params;
    const existing = await prisma.inventoryItem.findFirst({ where: { id, restaurantId: restaurant.id } });
    if (!existing) return void res.status(404).json({ success: false, message: "Inventory item not found" });
    await prisma.inventoryItem.delete({ where: { id } });
    res.json({ success: true, message: "Inventory item deleted" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete inventory item" });
  }
});

// Stock movements
router.get("/inventory", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const movements = await prisma.stockMovement.findMany({
      where: { inventoryItem: { restaurantId: restaurant.id } },
      include: { inventoryItem: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: movements });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch inventory movements" });
  }
});

router.post("/inventory", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const { inventoryItemId, type, quantity, note, reason } = req.body ?? {};
    if (!inventoryItemId || !type || quantity === undefined)
      return void res.status(400).json({ success: false, message: "inventoryItemId, type and quantity required" });
    const inventoryItem = await prisma.inventoryItem.findFirst({
      where: { id: inventoryItemId, restaurantId: restaurant.id },
    });
    if (!inventoryItem) return void res.status(404).json({ success: false, message: "Inventory item not found" });
    let newStock = inventoryItem.currentStock;
    const qty = Number(quantity);
    if (type === "IN") newStock += qty;
    else if (type === "OUT") newStock -= qty;
    else if (type === "ADJUSTMENT") newStock = qty;
    if (newStock < 0) return void res.status(400).json({ success: false, message: "Stock cannot be negative" });
    const movement = await prisma.$transaction(async (tx) => {
      const m = await tx.stockMovement.create({
        data: { inventoryItemId, type, quantity: qty, note: note || null, reason },
        include: { inventoryItem: true },
      });
      await tx.inventoryItem.update({ where: { id: inventoryItemId }, data: { currentStock: newStock } });
      return m;
    });
    res.json({ success: true, data: movement });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create inventory movement" });
  }
});

export default router;
