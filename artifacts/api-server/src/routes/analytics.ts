import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireRole, getRestaurantForUser } from "../lib/auth.js";

const router = Router();

router.get("/analytics/overview", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });

    const completedOrders = await prisma.order.findMany({
      where: { restaurantId: restaurant.id, status: "COMPLETED" },
      include: { items: true },
    });
    const totalRevenue = completedOrders.reduce((a, o) => a + o.total, 0);
    const totalOrders = completedOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const activeOrders = await prisma.order.count({
      where: { restaurantId: restaurant.id, status: { in: ["PAID", "PREPARING", "READY"] } },
    });
    const allInventory = await prisma.inventoryItem.findMany({
      where: { restaurantId: restaurant.id },
      select: { currentStock: true, minimumStock: true },
    });
    const lowStockItems = allInventory.filter((i) => i.currentStock <= i.minimumStock).length;
    res.json({ success: true, data: { totalRevenue, totalOrders, averageOrderValue, activeOrders, lowStockItems } });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch analytics overview" });
  }
});

router.get("/analytics/sales", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const orders = await prisma.order.findMany({
      where: { restaurantId: restaurant.id, status: "COMPLETED" },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: "asc" },
    });
    const salesByDate: Record<string, number> = {};
    for (const o of orders) {
      const date = o.createdAt.toISOString().split("T")[0];
      salesByDate[date] = (salesByDate[date] ?? 0) + o.total;
    }
    const data = Object.entries(salesByDate).map(([date, revenue]) => ({ date, revenue }));
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch sales analytics" });
  }
});

router.get("/analytics/top-menu", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const items = await prisma.orderItem.groupBy({
      by: ["menuItemId"],
      where: { order: { restaurantId: restaurant.id, status: "COMPLETED" } },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    });
    const menuIds = items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuIds } } });
    const data = items.map((i) => {
      const mi = menuItems.find((m) => m.id === i.menuItemId);
      return { name: mi?.name ?? "Unknown", quantity: i._sum.quantity ?? 0, revenue: i._sum.subtotal ?? 0 };
    });
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch top menu analytics" });
  }
});

router.get("/analytics/category-sales", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const orderItems = await prisma.orderItem.findMany({
      where: { order: { restaurantId: restaurant.id, status: "COMPLETED" } },
      select: { quantity: true, subtotal: true, menuItem: { select: { category: { select: { name: true } } } } },
    });
    const grouped: Record<string, { revenue: number; quantity: number }> = {};
    for (const item of orderItems) {
      const cat = item.menuItem.category?.name ?? "Uncategorized";
      if (!grouped[cat]) grouped[cat] = { revenue: 0, quantity: 0 };
      grouped[cat].revenue += item.subtotal;
      grouped[cat].quantity += item.quantity;
    }
    const data = Object.entries(grouped).map(([category, v]) => ({ category, ...v })).sort((a, b) => b.revenue - a.revenue);
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch category analytics" });
  }
});

router.get("/analytics/payment-method", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const grouped = await prisma.order.groupBy({
      by: ["paymentMethod"],
      where: { restaurantId: restaurant.id, status: "COMPLETED", paymentMethod: { not: "" } },
      _count: { paymentMethod: true },
      _sum: { total: true },
    });
    const data = grouped.map((i) => ({
      paymentMethod: i.paymentMethod || "UNKNOWN",
      totalOrders: i._count.paymentMethod,
      revenue: Number(i._sum.total ?? 0),
    }));
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch payment analytics" });
  }
});

router.get("/analytics/peak-hours", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const orders = await prisma.order.findMany({
      where: { restaurantId: restaurant.id, status: "COMPLETED" },
      select: { createdAt: true },
    });
    const hoursMap = Array.from({ length: 24 }, (_, h) => ({ hour: h, total: 0 }));
    for (const o of orders) { hoursMap[new Date(o.createdAt).getHours()].total += 1; }
    const data = hoursMap.map((i) => ({ hour: `${String(i.hour).padStart(2, "0")}:00`, total: i.total }));
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch peak hours" });
  }
});

router.get("/analytics/order-status", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const orders = await prisma.order.groupBy({
      by: ["status"],
      where: { restaurantId: restaurant.id },
      _count: { status: true },
    });
    const allStatuses = ["PENDING_PAYMENT", "PAID", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"];
    const data = allStatuses.map((status) => {
      const found = orders.find((o) => o.status === status);
      return { status, total: found?._count.status ?? 0 };
    });
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch order status analytics" });
  }
});

router.get("/analytics/kitchen-performance", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const completedOrders = await prisma.order.findMany({
      where: { restaurantId: restaurant.id, status: "COMPLETED" },
      select: { createdAt: true, updatedAt: true },
    });
    const prepTimes = completedOrders.map((o) =>
      Math.max(1, Math.round((new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()) / 60000))
    );
    const averagePrepTime = prepTimes.length > 0 ? Math.round(prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length) : 0;
    const fastestOrder = prepTimes.length > 0 ? Math.min(...prepTimes) : 0;
    const slowestOrder = prepTimes.length > 0 ? Math.max(...prepTimes) : 0;
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const completedToday = await prisma.order.count({
      where: { restaurantId: restaurant.id, status: "COMPLETED", updatedAt: { gte: startOfDay } },
    });
    res.json({ success: true, data: { averagePrepTime, fastestOrder, slowestOrder, completedToday } });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch kitchen performance" });
  }
});

router.get("/analytics/live-orders", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER", "KITCHEN", "CASHIER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const now = Date.now();
    const orders = await prisma.order.findMany({
      where: { restaurantId: restaurant.id, status: { in: ["PAID", "PREPARING", "READY"] } },
      select: { id: true, orderNumber: true, status: true, createdAt: true, table: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take: 10,
    });
    const data = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      table: o.table?.name ?? "Takeaway",
      elapsedMinutes: Math.max(1, Math.floor((now - new Date(o.createdAt).getTime()) / 60000)),
    }));
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch live orders" });
  }
});

router.get("/analytics/low-stock", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const items = await prisma.inventoryItem.findMany({
      where: { restaurantId: restaurant.id, currentStock: { lte: 10 } },
      orderBy: { currentStock: "asc" },
      take: 8,
    });
    res.json({ success: true, data: items });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch low stock" });
  }
});

router.get("/analytics/food-cost", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const orderItems = await prisma.orderItem.findMany({
      where: { order: { restaurantId: restaurant.id, status: "COMPLETED" } },
      select: { quantity: true, subtotal: true, menuItem: { select: { name: true, recipes: { select: { quantityNeeded: true, inventoryItem: { select: { costPerUnit: true } } } } } } },
    });
    const grouped: Record<string, any> = {};
    for (const item of orderItems) {
      const name = item.menuItem.name;
      const cost = item.menuItem.recipes.reduce((t, r) => t + r.quantityNeeded * r.inventoryItem.costPerUnit, 0) * item.quantity;
      if (!grouped[name]) grouped[name] = { name, quantitySold: 0, revenue: 0, estimatedFoodCost: 0 };
      grouped[name].quantitySold += item.quantity;
      grouped[name].revenue += item.subtotal;
      grouped[name].estimatedFoodCost += cost;
    }
    const data = Object.values(grouped).map((i: any) => ({
      ...i,
      grossProfit: i.revenue - i.estimatedFoodCost,
      foodCostPercentage: i.revenue > 0 ? Math.round((i.estimatedFoodCost / i.revenue) * 100) : 0,
    })).sort((a: any, b: any) => b.revenue - a.revenue);
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch food cost analytics" });
  }
});

router.get("/analytics/profit-margin", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const orderItems = await prisma.orderItem.findMany({
      where: { order: { restaurantId: restaurant.id, status: "COMPLETED" } },
      select: { quantity: true, subtotal: true, menuItem: { select: { name: true, recipes: { select: { quantityNeeded: true, inventoryItem: { select: { costPerUnit: true } } } } } } },
    });
    const grouped: Record<string, any> = {};
    for (const item of orderItems) {
      const name = item.menuItem.name;
      const cost = item.menuItem.recipes.reduce((t, r) => t + r.quantityNeeded * r.inventoryItem.costPerUnit, 0) * item.quantity;
      if (!grouped[name]) grouped[name] = { name, quantitySold: 0, revenue: 0, foodCost: 0 };
      grouped[name].quantitySold += item.quantity;
      grouped[name].revenue += item.subtotal;
      grouped[name].foodCost += cost;
    }
    const data = Object.values(grouped).map((i: any) => {
      const grossProfit = i.revenue - i.foodCost;
      return { ...i, grossProfit, marginPercentage: i.revenue > 0 ? Math.round((grossProfit / i.revenue) * 100) : 0 };
    }).sort((a: any, b: any) => b.marginPercentage - a.marginPercentage);
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch profit analytics" });
  }
});

router.get("/analytics/variance", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant) return void res.status(404).json({ success: false, message: "Restaurant not found" });
    const orderItems = await prisma.orderItem.findMany({
      where: { order: { restaurantId: restaurant.id, status: "COMPLETED" } },
      select: { quantity: true, menuItem: { select: { recipes: { select: { inventoryItemId: true, quantityNeeded: true, inventoryItem: { select: { name: true } } } } } } },
    });
    const theoreticalMap = new Map<string, { ingredient: string; theoretical: number }>();
    for (const item of orderItems) {
      for (const r of item.menuItem.recipes) {
        const existing = theoreticalMap.get(r.inventoryItemId);
        const qty = r.quantityNeeded * item.quantity;
        if (existing) existing.theoretical += qty;
        else theoreticalMap.set(r.inventoryItemId, { ingredient: r.inventoryItem.name, theoretical: qty });
      }
    }
    const movements = await prisma.stockMovement.findMany({
      where: { inventoryItem: { restaurantId: restaurant.id }, type: "OUT", reason: "RECIPE_USAGE" },
      include: { inventoryItem: true },
    });
    const actualMap = new Map<string, number>();
    for (const m of movements) {
      actualMap.set(m.inventoryItemId, (actualMap.get(m.inventoryItemId) ?? 0) + m.quantity);
    }
    const data = Array.from(theoreticalMap.entries()).map(([id, t]) => {
      const actual = actualMap.get(id) ?? 0;
      const variance = actual - t.theoretical;
      const variancePercentage = t.theoretical > 0 ? Math.round((variance / t.theoretical) * 100) : 0;
      return {
        ingredient: t.ingredient,
        theoretical: t.theoretical,
        actual,
        variance,
        variancePercentage,
        status: Math.abs(variancePercentage) <= 5 ? "GOOD" : Math.abs(variancePercentage) <= 15 ? "WARNING" : "CRITICAL",
      };
    }).sort((a, b) => Math.abs(b.variancePercentage) - Math.abs(a.variancePercentage));
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch variance analytics" });
  }
});

export default router;
