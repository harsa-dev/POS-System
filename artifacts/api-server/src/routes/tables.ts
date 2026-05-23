import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireRole, getRestaurantForUser } from "../lib/auth.js";
import { OPS_ROLES, MANAGEMENT_ROLES, MANAGEMENT_AND_SERVER_ROLES, ERR } from "../lib/constants.js";

const router = Router();

router.get("/tables", async (req, res) => {
  try {
    const user = await requireRole(req, res, OPS_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const tables = await prisma.diningTable.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: tables });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch tables" });
  }
});

router.post("/tables", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const name = String(req.body?.name ?? "").trim();
    const capacity = Number(req.body?.capacity ?? 2);
    if (!name) return void res.status(400).json({ success: false, message: "Table name is required" });
    if (capacity <= 0) return void res.status(400).json({ success: false, message: "Capacity must be > 0" });
    const table = await prisma.diningTable.create({
      data: { name, capacity, status: "AVAILABLE", restaurantId: restaurant.id },
    });
    res.status(201).json({ success: true, data: table });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create table" });
  }
});

router.patch("/tables/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const { id } = req.params;
    const existing = await prisma.diningTable.findFirst({ where: { id, restaurantId: restaurant.id } });
    if (!existing) return void res.status(404).json({ success: false, message: "Table not found" });
    const { name, capacity, status, isActive } = req.body ?? {};
    const table = await prisma.diningTable.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(capacity !== undefined ? { capacity: Number(capacity) } : {}),
        ...(status ? { status } : {}),
        ...(typeof isActive === "boolean" ? { isActive } : {}),
      },
    });
    res.json({ success: true, data: table });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update table" });
  }
});

router.delete("/tables/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const { id } = req.params;
    const existing = await prisma.diningTable.findFirst({ where: { id, restaurantId: restaurant.id } });
    if (!existing) return void res.status(404).json({ success: false, message: "Table not found" });
    const table = await prisma.diningTable.update({
      where: { id },
      data: { isActive: false, status: "INACTIVE" },
    });
    res.json({ success: true, message: "Table deactivated", data: table });
  } catch {
    res.status(500).json({ success: false, message: "Failed to deactivate table" });
  }
});

router.patch("/tables/:id/mark-clean", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_AND_SERVER_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const { id } = req.params;
    const table = await prisma.diningTable.findFirst({ where: { id, restaurantId: restaurant.id } });
    if (!table) return void res.status(404).json({ success: false, message: "Table not found" });
    if (table.status !== "CLEANING") return void res.status(400).json({ success: false, message: "Table is not cleaning" });
    const updated = await prisma.diningTable.update({ where: { id }, data: { status: "AVAILABLE" } });
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: "Failed to clean table" });
  }
});

export default router;
