import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireRole, getRestaurantForUser } from "../lib/auth.js";

const router = Router();

const allowedTransitions: Record<string, string[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SERVED", "CANCELLED"],
  SERVED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

// GET /api/orders
router.get("/orders", async (req, res) => {
  try {
    const user = await requireRole(req, res, [
      "OWNER",
      "MANAGER",
      "CASHIER",
      "KITCHEN",
      "SERVER",
    ]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant)
      return void res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });

    const { status, type, limit, page } = req.query as Record<string, string>;
    const take = Number(limit ?? 50);
    const skip = (Number(page ?? 1) - 1) * take;

    const orders = await prisma.order.findMany({
      where: {
        restaurantId: restaurant.id,
        ...(status ? { status: status as any } : {}),
        ...(type ? { type: type as any } : {}),
      },
      include: {
        items: { include: { menuItem: true } },
        table: true,
        shift: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });

    res.json({ success: true, data: orders });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

// POST /api/orders
router.post("/orders", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER", "CASHIER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant)
      return void res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });

    const body = req.body ?? {};
    const paymentMethod = String(body.paymentMethod ?? "").toUpperCase();
    const amountPaid = Number(body.amountPaid ?? 0);
    const orderType = body.orderType ?? "TAKEAWAY";
    const tableId = body.tableId ? String(body.tableId) : null;
    const items = body.items as { menuItemId?: string; quantity: number }[];

    if (!items?.length)
      return void res
        .status(400)
        .json({ success: false, message: "No items provided" });

    if (orderType === "DINE_IN" && !tableId)
      return void res
        .status(400)
        .json({ success: false, message: "Table is required for dine-in order" });

    // Check open shift
    const currentShift = await prisma.shift.findFirst({
      where: { userId: user.id, restaurantId: restaurant.id, status: "OPEN" },
    });
    if (!currentShift)
      return void res
        .status(400)
        .json({ success: false, message: "Please open shift before creating order" });

    // Validate payment method
    const paymentEnabledMap: Record<string, boolean> = {
      CASH: restaurant.cashEnabled,
      QRIS: restaurant.qrisEnabled,
      CARD: restaurant.cardEnabled,
      TRANSFER: restaurant.transferEnabled,
    };
    if (!paymentEnabledMap[paymentMethod])
      return void res
        .status(400)
        .json({ success: false, message: `Payment method ${paymentMethod} is not enabled` });

    // Get menu items
    const menuItemIds = items.map((i) => i.menuItemId).filter(Boolean) as string[];
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, restaurantId: restaurant.id, isAvailable: true },
      select: {
        id: true,
        name: true,
        price: true,
        recipes: {
          select: {
            quantityNeeded: true,
            inventoryItemId: true,
            inventoryItem: { select: { id: true, currentStock: true } },
          },
        },
      },
    });

    // Calculate totals
    let subtotal = 0;
    const orderItemsData: any[] = [];
    for (const item of items) {
      const mi = menuItems.find((m) => m.id === item.menuItemId);
      if (!mi) return void res.status(400).json({ success: false, message: `Menu item not found: ${item.menuItemId}` });
      const lineTotal = mi.price * item.quantity;
      subtotal += lineTotal;
      orderItemsData.push({ menuItemId: mi.id, quantity: item.quantity, price: mi.price, subtotal: lineTotal });
    }

    const taxAmount = Math.round(subtotal * (restaurant.taxRate / 100));
    const serviceAmount = Math.round(subtotal * (restaurant.serviceRate / 100));
    const total = subtotal + taxAmount + serviceAmount;

    const isCash = paymentMethod === "CASH";
    const finalAmountPaid = isCash ? amountPaid : total;
    if (isCash && finalAmountPaid < total)
      return void res.status(400).json({ success: false, message: "Insufficient payment amount" });

    const changeAmount = isCash ? finalAmountPaid - total : 0;

    const order = await prisma.$transaction(async (tx) => {
      if (tableId) {
        await tx.diningTable.update({
          where: { id: tableId },
          data: { status: "OCCUPIED" },
        });
      }

      // Deduct stock immediately for cash orders
      if (isCash) {
        for (const item of items) {
          const mi = menuItems.find((m) => m.id === item.menuItemId)!;
          for (const recipe of mi.recipes) {
            const qty = recipe.quantityNeeded * item.quantity;
            await tx.inventoryItem.update({
              where: { id: recipe.inventoryItemId },
              data: { currentStock: { decrement: qty } },
            });
            await tx.stockMovement.create({
              data: { inventoryItemId: recipe.inventoryItemId, type: "OUT", reason: "RECIPE_USAGE", quantity: qty },
            });
          }
        }
      }

      // Generate order number
      const lastOrder = await tx.order.findFirst({
        where: { restaurantId: restaurant.id },
        orderBy: { orderNumber: "desc" },
        select: { orderNumber: true },
      });
      const nextOrderNumber = (lastOrder?.orderNumber ?? 0) + 1;

      return tx.order.create({
        data: {
          orderNumber: nextOrderNumber,
          type: orderType,
          subtotal,
          taxAmount,
          serviceAmount,
          total,
          paymentMethod,
          amountPaid: finalAmountPaid,
          changeAmount,
          status: isCash ? "PAID" : "PENDING_PAYMENT",
          inventoryDeducted: isCash,
          restaurantId: restaurant.id,
          tableId: orderType === "DINE_IN" ? tableId : null,
          shiftId: currentShift.id,
          items: { create: orderItemsData },
        },
        include: {
          items: { include: { menuItem: true } },
          table: true,
          shift: true,
        },
      });
    });

    // Update shift expected cash
    if (isCash) {
      await prisma.shift.update({
        where: { id: currentShift.id },
        data: { expectedCash: { increment: total } },
      });
    }

    // Audit log: order created
    await prisma.auditLog.create({
      data: {
        restaurantId: restaurant.id,
        userId: user.id,
        action: "CREATE",
        entityType: "Order",
        entityId: order.id,
        changes: {
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          paymentMethod: order.paymentMethod,
          type: order.type,
        },
      },
    });

    res.status(201).json({ success: true, message: "Order created successfully", data: order });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message ?? "Failed to create order" });
  }
});

// GET /api/orders/:id
router.get("/orders/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, [
      "OWNER",
      "MANAGER",
      "CASHIER",
      "KITCHEN",
      "SERVER",
    ]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant)
      return void res.status(404).json({ success: false, message: "Restaurant not found" });

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, restaurantId: restaurant.id },
      include: {
        items: { include: { menuItem: { include: { recipes: { include: { inventoryItem: true } } } } } },
        table: true,
        shift: true,
        payment: true,
      },
    });
    if (!order)
      return void res.status(404).json({ success: false, message: "Order not found" });

    res.json({ success: true, data: order });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
});

// PATCH /api/orders/:id/status
router.patch("/orders/:id/status", async (req, res) => {
  try {
    const user = await requireRole(req, res, [
      "OWNER",
      "MANAGER",
      "KITCHEN",
      "SERVER",
      "CASHIER",
    ]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant)
      return void res.status(404).json({ success: false, message: "Restaurant not found" });

    const { id } = req.params;
    const status = req.body?.status as string;
    const cancelReason = String(req.body?.cancelReason ?? "").trim();

    if (!status || !Object.keys(allowedTransitions).includes(status))
      return void res.status(400).json({ success: false, message: "Invalid order status" });

    if (status === "CANCELLED" && !cancelReason)
      return void res.status(400).json({ success: false, message: "Cancel reason is required" });

    const existingOrder = await prisma.order.findFirst({
      where: { id, restaurantId: restaurant.id },
      include: {
        items: {
          include: {
            menuItem: { include: { recipes: { include: { inventoryItem: true } } } },
          },
        },
        payment: true,
        shift: true,
      },
    });
    if (!existingOrder)
      return void res.status(404).json({ success: false, message: "Order not found" });

    if (!allowedTransitions[existingOrder.status]?.includes(status))
      return void res
        .status(400)
        .json({
          success: false,
          message: `Cannot change from ${existingOrder.status} to ${status}`,
        });

    const rolePermissions: Record<string, string[]> = {
      OWNER: Object.keys(allowedTransitions),
      MANAGER: Object.keys(allowedTransitions),
      CASHIER: ["PAID", "CANCELLED", "COMPLETED"],
      KITCHEN: ["PREPARING", "READY", "CANCELLED"],
      SERVER: ["SERVED", "COMPLETED", "CANCELLED"],
    };
    if (!rolePermissions[user.role]?.includes(status))
      return void res.status(403).json({ success: false, message: "You cannot update to this status" });

    const isCancelling = status === "CANCELLED";
    const shouldDeductStock =
      existingOrder.status === "PREPARING" &&
      status === "READY" &&
      !existingOrder.inventoryDeducted;
    const shouldRestoreStock = isCancelling && existingOrder.inventoryDeducted;

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: {
          status: status as any,
          ...(shouldDeductStock ? { inventoryDeducted: true } : {}),
          ...(isCancelling ? { cancelReason, cancelledAt: new Date() } : {}),
        },
      });

      if (shouldDeductStock) {
        for (const oi of existingOrder.items) {
          for (const recipe of oi.menuItem.recipes) {
            const qty = recipe.quantityNeeded * oi.quantity;
            await tx.inventoryItem.update({
              where: { id: recipe.inventoryItemId },
              data: { currentStock: { decrement: qty } },
            });
            await tx.stockMovement.create({
              data: {
                inventoryItemId: recipe.inventoryItemId,
                type: "OUT",
                reason: "RECIPE_USAGE",
                quantity: qty,
                note: `Order #${existingOrder.orderNumber}`,
              },
            });
          }
        }
      }

      if (shouldRestoreStock) {
        for (const oi of existingOrder.items) {
          for (const recipe of oi.menuItem.recipes) {
            const qty = recipe.quantityNeeded * oi.quantity;
            await tx.inventoryItem.update({
              where: { id: recipe.inventoryItemId },
              data: { currentStock: { increment: qty } },
            });
            await tx.stockMovement.create({
              data: {
                inventoryItemId: recipe.inventoryItemId,
                type: "IN",
                reason: "RETURN",
                quantity: qty,
                note: `Cancelled order #${existingOrder.orderNumber}`,
              },
            });
          }
        }
      }

      if (
        isCancelling &&
        existingOrder.paymentMethod === "CASH" &&
        existingOrder.payment?.status === "PAID" &&
        existingOrder.shiftId
      ) {
        await tx.shift.update({
          where: { id: existingOrder.shiftId },
          data: { expectedCash: { decrement: existingOrder.total } },
        });
      }

      if (existingOrder.tableId && (status === "COMPLETED" || status === "CANCELLED")) {
        await tx.diningTable.update({
          where: { id: existingOrder.tableId },
          data: { status: status === "COMPLETED" ? "CLEANING" : "AVAILABLE" },
        });
      }
    });

    // Audit log: order status changed
    await prisma.auditLog.create({
      data: {
        restaurantId: restaurant.id,
        userId: user.id,
        action: "UPDATE",
        entityType: "Order",
        entityId: id,
        changes: {
          orderNumber: existingOrder.orderNumber,
          from: existingOrder.status,
          to: status,
          ...(isCancelling ? { cancelReason } : {}),
        },
      },
    });

    res.json({ success: true, message: "Order status updated" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message ?? "Failed to update order status" });
  }
});

// PATCH /api/orders/:id/move-table
router.patch("/orders/:id/move-table", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER", "CASHIER", "SERVER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant)
      return void res.status(404).json({ success: false, message: "Restaurant not found" });

    const { id } = req.params;
    const tableId = String(req.body?.tableId ?? "");
    if (!tableId) return void res.status(400).json({ success: false, message: "Table is required" });

    const order = await prisma.order.findFirst({
      where: { id, restaurantId: restaurant.id },
      include: { table: true },
    });
    if (!order) return void res.status(404).json({ success: false, message: "Order not found" });
    if (order.type !== "DINE_IN") return void res.status(400).json({ success: false, message: "Only dine-in orders can move tables" });
    if (order.status === "COMPLETED" || order.status === "CANCELLED")
      return void res.status(400).json({ success: false, message: "Cannot move completed order" });

    const newTable = await prisma.diningTable.findFirst({
      where: { id: tableId, restaurantId: restaurant.id, isActive: true },
    });
    if (!newTable) return void res.status(404).json({ success: false, message: "Table not found" });
    if (newTable.status === "OCCUPIED") return void res.status(400).json({ success: false, message: "Table already occupied" });

    await prisma.$transaction(async (tx) => {
      if (order.tableId) {
        await tx.diningTable.update({ where: { id: order.tableId }, data: { status: "AVAILABLE" } });
      }
      await tx.diningTable.update({ where: { id: newTable.id }, data: { status: "OCCUPIED" } });
      await tx.order.update({ where: { id: order.id }, data: { tableId: newTable.id } });
    });

    res.json({ success: true, message: "Table moved successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to move table" });
  }
});

export default router;
