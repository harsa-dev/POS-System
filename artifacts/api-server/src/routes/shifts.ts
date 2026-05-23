import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireRole, getRestaurantForUser } from "../lib/auth.js";
import { POS_ROLES, ERR } from "../lib/constants.js";

const router = Router();

router.get("/shifts", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const shifts = await prisma.shift.findMany({
      where: { restaurantId: restaurant.id },
      include: {
        user: { select: { name: true, email: true } },
        orders: { select: { id: true, total: true, paymentMethod: true, status: true } },
      },
      orderBy: { openedAt: "desc" },
    });
    res.json({ success: true, data: shifts });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch shifts" });
  }
});

router.post("/shifts/open", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const openingCash = Number(req.body?.openingCash ?? 0);
    if (openingCash < 0) return void res.status(400).json({ success: false, message: "Opening cash cannot be negative" });
    const existing = await prisma.shift.findFirst({
      where: { userId: user.id, restaurantId: restaurant.id, status: "OPEN" },
    });
    if (existing) return void res.status(400).json({ success: false, message: "You already have an open shift" });
    const shift = await prisma.shift.create({
      data: {
        userId: user.id,
        restaurantId: restaurant.id,
        openingCash,
        expectedCash: openingCash,
        status: "OPEN",
      },
    });
    res.status(201).json({ success: true, data: shift });
  } catch {
    res.status(500).json({ success: false, message: "Failed to open shift" });
  }
});

router.get("/shifts/current", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const shift = await prisma.shift.findFirst({
      where: { userId: user.id, restaurantId: restaurant.id, status: "OPEN" },
      include: { orders: true },
      orderBy: { openedAt: "desc" },
    });
    res.json({ success: true, data: shift });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch current shift" });
  }
});

router.patch("/shifts/:id/close", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const { id } = req.params;
    const shift = await prisma.shift.findFirst({
      where: { id, restaurantId: restaurant.id },
      include: { orders: { select: { id: true, total: true, paymentMethod: true, status: true } } },
    });
    if (!shift) return void res.status(404).json({ success: false, message: "Shift not found" });
    if (shift.status === "CLOSED") return void res.status(400).json({ success: false, message: "Shift already closed" });
    const closingCash = Number(req.body?.closingCash ?? 0);
    if (closingCash < 0) return void res.status(400).json({ success: false, message: "Closing cash cannot be negative" });
    const cashOrders = shift.orders.filter(
      (o) => o.paymentMethod === "CASH" && o.status !== "CANCELLED" && o.status !== "PENDING_PAYMENT"
    );
    const cashSales = cashOrders.reduce((a, o) => a + o.total, 0);
    const expectedCash = shift.openingCash + cashSales;
    const cashDifference = closingCash - expectedCash;
    const updatedShift = await prisma.shift.update({
      where: { id },
      data: { status: "CLOSED", closingCash, expectedCash, cashDifference, closedAt: new Date() },
    });
    res.json({
      success: true,
      data: {
        shift: updatedShift,
        summary: { openingCash: shift.openingCash, cashSales, expectedCash, closingCash, cashDifference, orderCount: cashOrders.length },
      },
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to close shift" });
  }
});

export default router;
