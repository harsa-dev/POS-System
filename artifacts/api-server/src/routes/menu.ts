import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireRole } from "../lib/auth.js";
import { MANAGEMENT_AND_KITCHEN_ROLES, MANAGEMENT_ROLES, POS_ROLES } from "../lib/constants.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";

const router = Router();

async function getBusinessId(user: { id: string; role: any; businessId: string | null }) {
  const context = await requireBusinessContextForUser(user);
  return context.businessId;
}

router.get("/menu-items", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_AND_KITCHEN_ROLES);
    if (!user) return;
    const businessId = await getBusinessId(user);
    const includeUnavailable = req.query.includeUnavailable === "true";
    const menuItems = await prisma.menuItem.findMany({
      where: { businessId, ...(includeUnavailable ? {} : { isAvailable: true, recipes: { some: {} } }) },
      include: { category: true, recipes: { include: { inventoryItem: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: menuItems });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/menu-items", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const businessId = await getBusinessId(user);
    const { name, description, price, imageUrl, categoryId, isAvailable } = req.body ?? {};
    if (!name || price === undefined) return void res.status(400).json({ success: false, message: "Name and price are required" });
    const menuItem = await prisma.$transaction(async (tx) => {
      const created = await tx.menuItem.create({
        data: { name, description: description || null, price: Number(price), imageUrl: imageUrl || null, categoryId: categoryId || null, ...(typeof isAvailable === "boolean" ? { isAvailable } : {}), businessId },
        include: { category: true },
      });
      await tx.auditLog.create({ data: { businessId, userId: user.id, action: "CREATE", entityType: "MenuItem", entityId: created.id, changes: { name: created.name, price: created.price } } });
      return created;
    });
    res.status(201).json({ success: true, data: menuItem });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/menu-items/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const businessId = await getBusinessId(user);
    const { id } = req.params;
    const existing = await prisma.menuItem.findFirst({ where: { id, businessId }, include: { _count: { select: { recipes: true } } } });
    if (!existing) return void res.status(404).json({ success: false, message: "Menu item not found" });
    const { name, description, price, imageUrl, categoryId, isAvailable } = req.body ?? {};
    if (isAvailable === true && existing._count.recipes === 0) return void res.status(400).json({ success: false, message: "Menu item needs at least one recipe before it can be available." });
    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: { ...(name !== undefined ? { name } : {}), ...(description !== undefined ? { description: description || null } : {}), ...(price !== undefined ? { price: Number(price) } : {}), ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}), ...(categoryId !== undefined ? { categoryId: categoryId || null } : {}), ...(isAvailable !== undefined ? { isAvailable } : {}) },
      include: { category: true },
    });
    res.json({ success: true, data: menuItem });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.delete("/menu-items/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const businessId = await getBusinessId(user);
    const { id } = req.params;
    const existing = await prisma.menuItem.findFirst({ where: { id, businessId } });
    if (!existing) return void res.status(404).json({ success: false, message: "Menu item not found" });
    const menuItem = await prisma.$transaction(async (tx) => {
      const archived = await tx.menuItem.update({ where: { id }, data: { isAvailable: false } });
      await tx.auditLog.create({ data: { businessId, userId: user.id, action: "DELETE", entityType: "MenuItem", entityId: archived.id, changes: { isAvailable: false } } });
      return archived;
    });
    res.json({ success: true, message: "Menu item archived", data: menuItem });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/categories", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;
    const businessId = await getBusinessId(user);
    const categories = await prisma.category.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: categories });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/categories", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const businessId = await getBusinessId(user);
    const name = String(req.body?.name ?? "").trim();
    if (!name) return void res.status(400).json({ success: false, message: "Category name is required" });
    const category = await prisma.category.create({ data: { name, businessId } });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/categories/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const businessId = await getBusinessId(user);
    const { id } = req.params;
    const name = String(req.body?.name ?? "").trim();
    if (!name) return void res.status(400).json({ success: false, message: "Category name is required" });
    const existing = await prisma.category.findFirst({ where: { id, businessId } });
    if (!existing) return void res.status(404).json({ success: false, message: "Category not found" });
    const category = await prisma.category.update({ where: { id }, data: { name } });
    res.json({ success: true, data: category });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.delete("/categories/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const businessId = await getBusinessId(user);
    const { id } = req.params;
    const existing = await prisma.category.findFirst({ where: { id, businessId }, include: { menuItems: { select: { id: true }, take: 1 } } });
    if (!existing) return void res.status(404).json({ success: false, message: "Category not found" });
    if (existing.menuItems.length > 0) return void res.status(400).json({ success: false, message: "Category is still used by menu items." });
    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
