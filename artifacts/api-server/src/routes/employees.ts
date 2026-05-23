import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { requireRole, getCurrentUser } from "../lib/auth.js";

const router = Router();

router.get("/employees", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER"]);
    if (!user) return;
    const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: user.id } });
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const employees = await prisma.user.findMany({
      where: { restaurantId: restaurant.id, role: { in: ["MANAGER", "CASHIER", "KITCHEN", "SERVER"] } },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: employees });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch employees" });
  }
});

router.post("/employees", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER"]);
    if (!user) return;
    const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: user.id } });
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const { name, email, password, role } = req.body ?? {};
    const allowedRoles = ["MANAGER", "CASHIER", "KITCHEN", "SERVER"];
    if (!name || !email || !password || !role || !allowedRoles.includes(role))
      return void res.status(400).json({ success: false, message: "Invalid employee data" });
    if (password.length < 6) return void res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return void res.status(409).json({ success: false, message: "Email already registered" });
    const passwordHash = await bcrypt.hash(password, 10);
    const employee = await prisma.user.create({
      data: { name, email, passwordHash, role, restaurantId: restaurant.id },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
    res.status(201).json({ success: true, data: employee });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create employee" });
  }
});

router.patch("/employees/:id", async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return void res.status(401).json({ success: false, message: "Unauthorized" });
    if (currentUser.role !== "OWNER") return void res.status(403).json({ success: false, message: "Only owner can update employee" });
    const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: currentUser.id } });
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const { id } = req.params;
    if (id === currentUser.id) return void res.status(400).json({ success: false, message: "Owner cannot update themselves here" });
    const existing = await prisma.user.findFirst({ where: { id, restaurantId: restaurant.id } });
    if (!existing) return void res.status(404).json({ success: false, message: "Employee not found" });
    const { name, role, isActive } = req.body ?? {};
    const allowedRoles = ["MANAGER", "CASHIER", "KITCHEN", "SERVER"];
    if (role && !allowedRoles.includes(role)) return void res.status(400).json({ success: false, message: "Invalid employee role" });
    const employee = await prisma.user.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(role ? { role } : {}),
        ...(typeof isActive === "boolean" ? { isActive } : {}),
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
    res.json({ success: true, data: employee });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update employee" });
  }
});

router.delete("/employees/:id", async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return void res.status(401).json({ success: false, message: "Unauthorized" });
    if (currentUser.role !== "OWNER") return void res.status(403).json({ success: false, message: "Only owner can deactivate employee" });
    const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: currentUser.id } });
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const { id } = req.params;
    if (id === currentUser.id) return void res.status(400).json({ success: false, message: "Owner cannot deactivate themselves" });
    const existing = await prisma.user.findFirst({ where: { id, restaurantId: restaurant.id } });
    if (!existing) return void res.status(404).json({ success: false, message: "Employee not found" });
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true, message: "Employee deactivated" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to deactivate employee" });
  }
});

router.patch("/employees/:id/reset-password", async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return void res.status(401).json({ success: false, message: "Unauthorized" });
    if (currentUser.role !== "OWNER") return void res.status(403).json({ success: false, message: "Only owner can reset password" });
    const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: currentUser.id } });
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const { id } = req.params;
    const password = String(req.body?.password ?? "");
    if (password.length < 6) return void res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    const employee = await prisma.user.findFirst({ where: { id, restaurantId: restaurant.id } });
    if (!employee) return void res.status(404).json({ success: false, message: "Employee not found" });
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id }, data: { passwordHash } });
    res.json({ success: true, message: "Employee password reset successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to reset employee password" });
  }
});

export default router;
