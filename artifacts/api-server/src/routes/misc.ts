import { Router } from "express";
import { mkdirSync } from "fs";
import path from "path";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { requireRole, getCurrentUser, getRestaurantForUser } from "../lib/auth.js";
import { MANAGEMENT_ROLES, OWNER_ONLY, ERR } from "../lib/constants.js";

const UPLOADS_DIR = path.resolve("data/uploads");
mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

const router = Router();

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

// Audit logs
router.get("/audit-logs", async (req, res) => {
  try {
    const user = await requireRole(req, res, OWNER_ONLY);
    if (!user) return;
    const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: user.id } });
    if (!restaurant) return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });
    const logs = await prisma.auditLog.findMany({
      where: { restaurantId: restaurant.id },
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ success: true, data: logs });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch audit logs" });
  }
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
    const { menuItemId, inventoryItemId, quantityNeeded } = req.body ?? {};
    if (!menuItemId || !inventoryItemId || quantityNeeded === undefined)
      return void res.status(400).json({ success: false, message: "menuItemId, inventoryItemId, quantityNeeded required" });
    const recipe = await prisma.recipe.upsert({
      where: { menuItemId_inventoryItemId: { menuItemId, inventoryItemId } },
      create: { menuItemId, inventoryItemId, quantityNeeded: Number(quantityNeeded) },
      update: { quantityNeeded: Number(quantityNeeded) },
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
    const { quantityNeeded } = req.body ?? {};
    const recipe = await prisma.recipe.findFirst({
      where: { id, menuItem: { restaurantId: restaurant.id } },
    });
    if (!recipe) return void res.status(404).json({ success: false, message: "Recipe not found" });
    const updated = await prisma.recipe.update({
      where: { id },
      data: { quantityNeeded: Number(quantityNeeded) },
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
    });
    if (!recipe) return void res.status(404).json({ success: false, message: "Recipe not found" });
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

// Image upload — auth check BEFORE multer writes anything to disk
router.post(
  "/uploads/menu-image",
  // 1. Verify auth first — reject unauthenticated callers before any file I/O
  async (req, res, next) => {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return; // requireRole already sent 401/403
    (req as Record<string, unknown>)._authedUser = user;
    next();
  },
  // 2. Only now let multer write to disk
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: (err as Error).message ?? "Upload failed" });
      }
      next();
    });
  },
  // 3. Handle the upload response
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }
    const url = `/api/media/${req.file.filename}`;
    res.status(201).json({ success: true, data: { url } });
  },
);

export default router;
