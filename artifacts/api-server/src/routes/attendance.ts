import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireRole, getRestaurantForUser } from "../lib/auth.js";
import { ALL_ROLES, MANAGEMENT_ROLES, OWNER_ONLY, ERR } from "../lib/constants.js";

const router = Router();

router.get("/attendance", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const attendances = await prisma.attendance.findMany({
      where: { restaurantId: restaurant.id },
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { clockInAt: "desc" },
    });
    res.json({ success: true, data: attendances });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch attendance" });
  }
});

router.post("/attendance/clock-in", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const open = await prisma.attendance.findFirst({
      where: { userId: user.id, restaurantId: restaurant.id, clockOutAt: null },
    });
    if (open) return void res.status(400).json({ success: false, message: "You already clocked in" });
    const setting = await prisma.attendanceSetting.findUnique({ where: { restaurantId: restaurant.id } });
    const now = new Date();
    let status = "PRESENT";
    if (setting) {
      const workStart = new Date(now);
      workStart.setHours(setting.workStartHour, setting.workStartMinute, 0, 0);
      const lateLimit = new Date(workStart.getTime() + setting.lateTolerance * 60 * 1000);
      if (now > lateLimit) status = "LATE";
    }
    const attendance = await prisma.attendance.create({
      data: {
        userId: user.id,
        restaurantId: restaurant.id,
        clockInAt: now,
        status: status as any,
      },
      include: { user: { select: { name: true, email: true, role: true } } },
    });
    res.status(201).json({ success: true, data: attendance });
  } catch {
    res.status(500).json({ success: false, message: "Failed to clock in" });
  }
});

router.post("/attendance/clock-out", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const active = await prisma.attendance.findFirst({
      where: { userId: user.id, restaurantId: restaurant.id, clockOutAt: null },
      orderBy: { clockInAt: "desc" },
    });
    if (!active) return void res.status(404).json({ success: false, message: "No active attendance found" });
    const setting = await prisma.attendanceSetting.findUnique({ where: { restaurantId: restaurant.id } });
    const clockOutAt = new Date();
    const workDurationMinutes = Math.max(0, Math.floor((clockOutAt.getTime() - active.clockInAt.getTime()) / 60000));
    const overtimeAfterMinutes = setting?.overtimeAfterMinutes ?? 480;
    const overtimeMinutes = Math.max(0, workDurationMinutes - overtimeAfterMinutes);
    const attendance = await prisma.attendance.update({
      where: { id: active.id },
      data: { clockOutAt, workDurationMinutes, overtimeMinutes },
      include: { user: { select: { name: true, email: true, role: true } } },
    });
    res.json({ success: true, data: attendance });
  } catch {
    res.status(500).json({ success: false, message: "Failed to clock out" });
  }
});

router.get("/attendance/settings", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const setting = await prisma.attendanceSetting.upsert({
      where: { restaurantId: restaurant.id },
      update: {},
      create: { restaurantId: restaurant.id, workStartHour: 9, workStartMinute: 0, lateTolerance: 15, overtimeAfterMinutes: 480 },
    });
    res.json({ success: true, data: setting });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch attendance setting" });
  }
});

router.patch("/attendance/settings", async (req, res) => {
  try {
    const user = await requireRole(req, res, OWNER_ONLY);
    if (!user) return;
    const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: user.id } });
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const { workStartHour, workStartMinute, lateTolerance, overtimeAfterMinutes } = req.body ?? {};
    const setting = await prisma.attendanceSetting.upsert({
      where: { restaurantId: restaurant.id },
      update: {
        workStartHour: Number(workStartHour),
        workStartMinute: Number(workStartMinute),
        lateTolerance: Number(lateTolerance),
        overtimeAfterMinutes: Number(overtimeAfterMinutes),
      },
      create: {
        restaurantId: restaurant.id,
        workStartHour: Number(workStartHour ?? 9),
        workStartMinute: Number(workStartMinute ?? 0),
        lateTolerance: Number(lateTolerance ?? 15),
        overtimeAfterMinutes: Number(overtimeAfterMinutes ?? 480),
      },
    });
    res.json({ success: true, data: setting });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update attendance setting" });
  }
});

export default router;
