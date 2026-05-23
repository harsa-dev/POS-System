import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireRole, getRestaurantForUser } from "../lib/auth.js";

const router = Router();

// GET /api/menu-items
router.get("/menu-items", async (req, res) => {
  try {
    const user = await requireRole(req, res, [
      "OWNER",
      "MANAGER",
      "CASHIER",
      "KITCHEN",
    ]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant)
      return void res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });

    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId: restaurant.id, isAvailable: true },
      include: {
        category: true,
        recipes: { include: { inventoryItem: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const menuItemsWithStatus = menuItems.map((menuItem) => {
      if (menuItem.recipes.length === 0)
        return { ...menuItem, availabilityStatus: "NO_RECIPE" };
      const hasEnoughStock = menuItem.recipes.every(
        (r) =>
          r.inventoryItem && r.inventoryItem.currentStock >= r.quantityNeeded
      );
      return {
        ...menuItem,
        availabilityStatus: hasEnoughStock ? "AVAILABLE" : "OUT_OF_STOCK",
      };
    });

    menuItemsWithStatus.sort((a, b) => {
      const order: Record<string, number> = {
        AVAILABLE: 0,
        OUT_OF_STOCK: 1,
        NO_RECIPE: 2,
      };
      return order[a.availabilityStatus] - order[b.availabilityStatus];
    });

    res.json({ success: true, data: menuItemsWithStatus });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch menu items" });
  }
});

// POST /api/menu-items
router.post("/menu-items", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant)
      return void res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });

    const { name, description, price, imageUrl, categoryId } = req.body ?? {};
    if (!name || price === undefined)
      return void res
        .status(400)
        .json({ success: false, message: "Name and price are required" });

    const menuItem = await prisma.$transaction(async (tx) => {
      const created = await tx.menuItem.create({
        data: {
          name,
          description: description || null,
          price: Number(price),
          imageUrl: imageUrl || null,
          categoryId: categoryId || null,
          restaurantId: restaurant.id,
        },
        include: { category: true },
      });
      await tx.auditLog.create({
        data: {
          restaurantId: restaurant.id,
          userId: user.id,
          action: "CREATE",
          entityType: "MenuItem",
          entityId: created.id,
          changes: { name: created.name, price: created.price },
        },
      });
      return created;
    });

    res.status(201).json({ success: true, data: menuItem });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create menu item" });
  }
});

// PATCH /api/menu-items/:id
router.patch("/menu-items/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant)
      return void res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });

    const { id } = req.params;
    const existing = await prisma.menuItem.findFirst({
      where: { id, restaurantId: restaurant.id },
    });
    if (!existing)
      return void res
        .status(404)
        .json({ success: false, message: "Menu item not found" });

    const { name, description, price, imageUrl, categoryId, isAvailable } =
      req.body ?? {};

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
        ...(categoryId !== undefined ? { categoryId: categoryId || null } : {}),
        ...(isAvailable !== undefined ? { isAvailable } : {}),
      },
      include: { category: true },
    });

    res.json({ success: true, data: menuItem });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update menu item" });
  }
});

// DELETE /api/menu-items/:id
router.delete("/menu-items/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant)
      return void res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });

    const { id } = req.params;
    const existing = await prisma.menuItem.findFirst({
      where: { id, restaurantId: restaurant.id },
    });
    if (!existing)
      return void res
        .status(404)
        .json({ success: false, message: "Menu item not found" });

    const menuItem = await prisma.$transaction(async (tx) => {
      const archived = await tx.menuItem.update({
        where: { id },
        data: { isAvailable: false },
      });
      await tx.auditLog.create({
        data: {
          restaurantId: restaurant.id,
          userId: user.id,
          action: "DELETE",
          entityType: "MenuItem",
          entityId: archived.id,
          changes: { isAvailable: false },
        },
      });
      return archived;
    });

    res.json({ success: true, message: "Menu item archived", data: menuItem });
  } catch {
    res.status(500).json({ success: false, message: "Failed to archive menu item" });
  }
});

// GET /api/categories
router.get("/categories", async (req, res) => {
  try {
    const user = await requireRole(req, res, [
      "OWNER",
      "MANAGER",
      "CASHIER",
    ]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant)
      return void res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });

    const categories = await prisma.category.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: categories });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
});

// POST /api/categories
router.post("/categories", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant)
      return void res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });

    const name = String(req.body?.name ?? "").trim();
    if (!name)
      return void res
        .status(400)
        .json({ success: false, message: "Category name is required" });

    const category = await prisma.category.create({
      data: { name, restaurantId: restaurant.id },
    });
    res.status(201).json({ success: true, data: category });
  } catch {
    res.status(500).json({ success: false, message: "Failed to create category" });
  }
});

// PATCH /api/categories/:id
router.patch("/categories/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant)
      return void res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });

    const { id } = req.params;
    const name = String(req.body?.name ?? "").trim();
    if (!name)
      return void res
        .status(400)
        .json({ success: false, message: "Category name is required" });

    const existing = await prisma.category.findFirst({
      where: { id, restaurantId: restaurant.id },
    });
    if (!existing)
      return void res
        .status(404)
        .json({ success: false, message: "Category not found" });

    const category = await prisma.category.update({ where: { id }, data: { name } });
    res.json({ success: true, data: category });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update category" });
  }
});

// DELETE /api/categories/:id
router.delete("/categories/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant)
      return void res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });

    const { id } = req.params;
    const existing = await prisma.category.findFirst({
      where: { id, restaurantId: restaurant.id },
      include: { menuItems: { select: { id: true }, take: 1 } },
    });
    if (!existing)
      return void res
        .status(404)
        .json({ success: false, message: "Category not found" });
    if (existing.menuItems.length > 0)
      return void res
        .status(400)
        .json({
          success: false,
          message: "Category is still used by menu items. Move or edit those items first.",
        });

    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: "Category deleted" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete category" });
  }
});

export default router;
