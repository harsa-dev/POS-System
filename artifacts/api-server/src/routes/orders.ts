import { Router } from "express";
import { Prisma } from "@prisma/client";
import type { OrderStatus, OrderType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireRole, getRestaurantForUser } from "../lib/auth.js";
import { canTransitionOrderStatus } from "../services/permissions/index.js";
import {
  ALL_ROLES,
  POS_ROLES,
  OPS_ROLES,
  ERR,
  PAYMENT_METHODS,
} from "../lib/constants.js";
import { realtime } from "../lib/realtime.js";
import { REALTIME_EVENTS } from "../lib/realtime-events.js";

const router = Router();

const orderStatuses = [
  "PENDING_PAYMENT",
  "PAID",
  "PREPARING",
  "READY",
  "SERVED",
  "COMPLETED",
  "CANCELLED",
] satisfies OrderStatus[];

const orderTypes = ["DINE_IN", "TAKEAWAY"] satisfies OrderType[];

function isOrderStatus(value: string): value is OrderStatus {
  return orderStatuses.includes(value as OrderStatus);
}

function isOrderType(value: string): value is OrderType {
  return orderTypes.includes(value as OrderType);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
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
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant)
      return void res
        .status(404)
        .json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });

    const { status, type, limit, page } = req.query as Record<string, string>;
    const take = Number(limit ?? 50);
    const skip = (Number(page ?? 1) - 1) * take;
    const orderStatus = status && isOrderStatus(status) ? status : undefined;
    const orderType = type && isOrderType(type) ? type : undefined;

    const orders = await prisma.order.findMany({
      where: {
        restaurantId: restaurant.id,
        ...(orderStatus ? { status: orderStatus } : {}),
        ...(orderType ? { type: orderType } : {}),
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
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant)
      return void res
        .status(404)
        .json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });

    const body = req.body ?? {};
    const paymentMethod = String(body.paymentMethod ?? "").toUpperCase();
    const amountPaid = Number(body.amountPaid ?? 0);
    const orderTypeValue = String(body.orderType ?? "TAKEAWAY");
    if (!isOrderType(orderTypeValue))
      return void res.status(400).json({ success: false, message: "Invalid order type" });
    const orderType = orderTypeValue;
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
        .json({ success: false, message: ERR.NO_OPEN_SHIFT });

    // Validate payment method
    const paymentEnabledMap: Record<string, boolean> = {
      [PAYMENT_METHODS.CASH]: restaurant.cashEnabled,
      [PAYMENT_METHODS.QRIS]: restaurant.qrisEnabled,
      [PAYMENT_METHODS.CARD]: restaurant.cardEnabled,
      [PAYMENT_METHODS.TRANSFER]: restaurant.transferEnabled,
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
            inventoryItem: { select: { id: true, name: true, currentStock: true } },
          },
        },
      },
    });

    // Calculate totals
    let subtotal = 0;
    const orderItemsData: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = [];
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

    const isCash = paymentMethod === PAYMENT_METHODS.CASH;
    const finalAmountPaid = isCash ? amountPaid : total;
    if (isCash && finalAmountPaid < total)
      return void res.status(400).json({ success: false, message: "Insufficient payment amount" });

    const changeAmount = isCash ? finalAmountPaid - total : 0;

    // Bug #4: wrap the transaction in a retry loop.
    // If two concurrent requests compute the same orderNumber, the DB unique
    // constraint (@@unique([restaurantId, orderNumber])) raises P2002. The
    // entire $transaction is rolled back atomically, so no partial writes occur.
    // A fresh attempt recomputes orderNumber from the latest row and succeeds.
    const order = await (async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          return await prisma.$transaction(async (tx) => {
            if (tableId) {
              await tx.diningTable.update({
                where: { id: tableId },
                data: { status: "OCCUPIED" },
              });
            }

            // Generate order number FIRST so it is available for StockMovement
            // notes (Bug #7) and the order create below.
            const lastOrder = await tx.order.findFirst({
              where: { restaurantId: restaurant.id },
              orderBy: { orderNumber: "desc" },
              select: { orderNumber: true },
            });
            const nextOrderNumber = (lastOrder?.orderNumber ?? 0) + 1;

            // Deduct stock immediately for cash orders
            if (isCash) {
              // Step 1: aggregate total required qty per inventory item across
              // all order lines. One ingredient can appear in multiple recipes
              // (e.g. two menu items both use the same ingredient), so we must
              // sum before checking — not check each recipe independently.
              const requiredQtyMap = new Map<string, number>();
              for (const item of items) {
                const mi = menuItems.find((m) => m.id === item.menuItemId)!;
                for (const recipe of mi.recipes) {
                  const qty = recipe.quantityNeeded * item.quantity;
                  requiredQtyMap.set(
                    recipe.inventoryItemId,
                    (requiredQtyMap.get(recipe.inventoryItemId) ?? 0) + qty,
                  );
                }
              }

              // Step 2: SELECT ... FOR UPDATE — acquire an exclusive row-level
              // lock on every InventoryItem row needed by this order before
              // reading currentStock.
              //
              // Why raw SQL?
              //   Prisma's query API has no FOR UPDATE option on any find*
              //   method. tx.$queryRaw participates in the same database
              //   transaction, so locks are held until commit or rollback.
              //
              // Why sort by id?
              //   Acquiring locks in a consistent global order across all
              //   concurrent transactions prevents circular waits (deadlocks).
              //
              // How this fixes the race:
              //   Two concurrent requests for the same ingredient serialize at
              //   this point. The second request blocks here until the first
              //   transaction commits. It then reads the already-decremented
              //   currentStock from the locked row and rejects if stock is now
              //   insufficient — eliminating the TOCTOU race condition.
              const sortedIds = [...requiredQtyMap.keys()].sort();
              const lockedStockMap = new Map<
                string,
                { id: string; currentStock: number; name: string }
              >();
              for (const invId of sortedIds) {
                const rows = await tx.$queryRaw<
                  { id: string; currentStock: number; name: string }[]
                >`
                  SELECT id, "currentStock", name
                  FROM "InventoryItem"
                  WHERE id = ${invId}
                  FOR UPDATE
                `;
                if (rows[0]) lockedStockMap.set(invId, rows[0]);
              }

              // Step 3: check currentStock from the freshly-locked rows, not
              // from the pre-transaction snapshot captured in menuItems above.
              for (const [invId, totalQty] of requiredQtyMap) {
                const locked = lockedStockMap.get(invId)!;
                if (locked.currentStock < totalQty) {
                  throw Object.assign(
                    new Error(
                      `Insufficient stock for "${locked.name}". ` +
                      `Available: ${locked.currentStock}, required: ${totalQty}.`,
                    ),
                    { code: "INSUFFICIENT_STOCK" },
                  );
                }
              }

              // Step 4: stock confirmed — decrement and record movements.
              for (const item of items) {
                const mi = menuItems.find((m) => m.id === item.menuItemId)!;
                for (const recipe of mi.recipes) {
                  const qty = recipe.quantityNeeded * item.quantity;
                  await tx.inventoryItem.update({
                    where: { id: recipe.inventoryItemId },
                    data: { currentStock: { decrement: qty } },
                  });
                  // Bug #7: include order number in the note so cash-order
                  // deductions are traceable in stock movement history.
                  await tx.stockMovement.create({
                    data: {
                      inventoryItemId: recipe.inventoryItemId,
                      type: "OUT",
                      reason: "RECIPE_USAGE",
                      quantity: qty,
                      note: `Order #${nextOrderNumber}`,
                    },
                  });
                }
              }

              // Bug #3: shift expectedCash update is now INSIDE the transaction —
              // atomic with order creation. Previously this ran after the transaction
              // committed, risking an orphaned order (no matching shift credit) on a
              // server crash or DB error between the two operations.
              await tx.shift.update({
                where: { id: currentShift.id },
                data: { expectedCash: { increment: total } },
              });
            }

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
        } catch (err: unknown) {
          // P2002 = unique constraint violation on orderNumber — safe to retry
          // because the failed transaction is fully rolled back.
          if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && attempt < 3) continue;
          // INSUFFICIENT_STOCK is a business rule error, surface it immediately.
          throw err;
        }
      }
      /* istanbul ignore next */
      throw new Error("Failed to generate a unique order number after 3 attempts.");
    })();

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

    realtime.broadcast(restaurant.id, REALTIME_EVENTS.ORDER_CREATED, {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: getErrorMessage(err, "Failed to create order") });
  }
});

// GET /api/orders/:id
router.get("/orders/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant)
      return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });

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
      return void res.status(404).json({ success: false, message: ERR.ORDER_NOT_FOUND });

    res.json({ success: true, data: order });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
});

// PATCH /api/orders/:id/status
router.patch("/orders/:id/status", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant)
      return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });

    const { id } = req.params;
    const statusValue = String(req.body?.status ?? "");
    const cancelReason = String(req.body?.cancelReason ?? "").trim();

    if (!isOrderStatus(statusValue))
      return void res.status(400).json({ success: false, message: "Invalid order status" });
    const status = statusValue;

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
      return void res.status(404).json({ success: false, message: ERR.ORDER_NOT_FOUND });

    if (!allowedTransitions[existingOrder.status]?.includes(status))
      return void res
        .status(400)
        .json({
          success: false,
          message: `Cannot change from ${existingOrder.status} to ${status}`,
        });

    if (!canTransitionOrderStatus(user.role, status))
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
          status,
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
        existingOrder.paymentMethod === PAYMENT_METHODS.CASH &&
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

    realtime.broadcast(restaurant.id, REALTIME_EVENTS.ORDER_UPDATED, {
      id,
      orderNumber: existingOrder.orderNumber,
      status,
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: getErrorMessage(err, "Failed to update order status") });
  }
});

// PATCH /api/orders/:id/move-table
router.patch("/orders/:id/move-table", async (req, res) => {
  try {
    const user = await requireRole(req, res, OPS_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant)
      return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });

    const { id } = req.params;
    const tableId = String(req.body?.tableId ?? "");
    if (!tableId) return void res.status(400).json({ success: false, message: "Table is required" });

    const order = await prisma.order.findFirst({
      where: { id, restaurantId: restaurant.id },
      include: { table: true },
    });
    if (!order) return void res.status(404).json({ success: false, message: ERR.ORDER_NOT_FOUND });
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
