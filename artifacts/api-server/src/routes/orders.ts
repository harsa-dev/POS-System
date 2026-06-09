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
const isDevelopment = process.env.NODE_ENV !== "production";

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

type CreateOrderItemInput = {
  menuItemId: string;
  quantity: number;
};

type RequiredStockMovement = {
  inventoryItemId: string;
  quantity: number;
};

type ParseOrderItemsResult =
  | { success: true; items: CreateOrderItemInput[] }
  | { success: false; message: string };

class OrderValidationError extends Error {}

function logCreateOrderTiming(
  startedAt: number,
  label: string,
  extra?: Record<string, unknown>,
) {
  if (!isDevelopment) return;

  console.info("[orders:create]", {
    label,
    elapsedMs: Date.now() - startedAt,
    ...extra,
  });
}

function isOrderStatus(value: string): value is OrderStatus {
  return orderStatuses.includes(value as OrderStatus);
}

function isOrderType(value: string): value is OrderType {
  return orderTypes.includes(value as OrderType);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getNoRecipeOrderMessage(menuItemName: string) {
  return `Menu item "${menuItemName}" has no recipe configured and cannot be ordered. Add at least one ingredient first.`;
}

function getNoRecipeProcessingMessage(menuItemName: string) {
  return `Menu item "${menuItemName}" has no recipe configured and cannot be processed. Add at least one ingredient first.`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseOrderItems(value: unknown): ParseOrderItemsResult {
  if (!Array.isArray(value) || value.length === 0) {
    return { success: false, message: "No items provided" };
  }

  const items: CreateOrderItemInput[] = [];

  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) {
      return { success: false, message: `Invalid item at position ${index + 1}` };
    }

    const menuItemId = String(item.menuItemId ?? "").trim();
    const quantity = Number(item.quantity);

    if (!menuItemId) {
      return {
        success: false,
        message: `Menu item is required at position ${index + 1}`,
      };
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return {
        success: false,
        message: `Quantity must be a positive integer at position ${index + 1}`,
      };
    }

    items.push({ menuItemId, quantity });
  }

  return { success: true, items };
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
    const requestStartedAt = Date.now();
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
    if (!Number.isFinite(amountPaid) || !Number.isInteger(amountPaid) || amountPaid < 0)
      return void res.status(400).json({ success: false, message: "Invalid payment amount" });

    const orderTypeValue = String(body.orderType ?? "TAKEAWAY");
    if (!isOrderType(orderTypeValue))
      return void res.status(400).json({ success: false, message: "Invalid order type" });
    const orderType = orderTypeValue;
    const requestedTableId = body.tableId ? String(body.tableId).trim() : null;
    const tableId = orderType === "DINE_IN" ? requestedTableId : null;
    const parsedItems = parseOrderItems(body.items);

    if (!parsedItems.success)
      return void res
        .status(400)
        .json({ success: false, message: parsedItems.message });

    const items = parsedItems.items;

    if (orderType === "DINE_IN" && !tableId)
      return void res
        .status(400)
        .json({ success: false, message: "Table is required for dine-in order" });

    if (orderType === "DINE_IN" && tableId) {
      const table = await prisma.diningTable.findFirst({
        where: { id: tableId, restaurantId: restaurant.id },
        select: { id: true, isActive: true, status: true },
      });

      if (!table)
        return void res
          .status(400)
          .json({ success: false, message: "Table not found for this restaurant" });

      if (!table.isActive)
        return void res
          .status(400)
          .json({ success: false, message: "Table is inactive" });

      if (table.status !== "AVAILABLE")
        return void res
          .status(400)
          .json({ success: false, message: "Table is not available" });
    }

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

    const menuItemById = new Map(menuItems.map((menuItem) => [menuItem.id, menuItem]));

    // Calculate totals and immutable recipe requirements before opening the
    // interactive transaction. Stock freshness is still re-checked under row
    // lock inside the transaction.
    let subtotal = 0;
    const orderItemsData: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = [];
    const requiredQtyMap = new Map<string, number>();
    const requiredStockMovements: RequiredStockMovement[] = [];

    for (const item of items) {
      const mi = menuItemById.get(item.menuItemId);
      if (!mi) return void res.status(400).json({ success: false, message: `Menu item not found: ${item.menuItemId}` });
      if (mi.recipes.length === 0)
        return void res.status(400).json({
          success: false,
          message: getNoRecipeOrderMessage(mi.name),
        });

      const lineTotal = mi.price * item.quantity;
      subtotal += lineTotal;
      orderItemsData.push({ menuItemId: mi.id, quantity: item.quantity, price: mi.price, subtotal: lineTotal });

      for (const recipe of mi.recipes) {
        const quantity = recipe.quantityNeeded * item.quantity;
        requiredQtyMap.set(
          recipe.inventoryItemId,
          (requiredQtyMap.get(recipe.inventoryItemId) ?? 0) + quantity,
        );
        requiredStockMovements.push({
          inventoryItemId: recipe.inventoryItemId,
          quantity,
        });
      }
    }

    const sortedInventoryIds = [...requiredQtyMap.keys()].sort();

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
    logCreateOrderTiming(requestStartedAt, "before transaction", {
      itemCount: items.length,
      inventoryItemCount: sortedInventoryIds.length,
      isCash,
    });

    const order = await (async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const createdOrder = await prisma.$transaction(async (tx) => {
            logCreateOrderTiming(requestStartedAt, "transaction started", {
              attempt,
            });

            if (tableId) {
              const tableUpdate = await tx.diningTable.updateMany({
                where: {
                  id: tableId,
                  restaurantId: restaurant.id,
                  isActive: true,
                  status: "AVAILABLE",
                },
                data: { status: "OCCUPIED" },
              });

              if (tableUpdate.count !== 1) {
                throw new OrderValidationError("Table is not available");
              }
            }

            // Generate order number FIRST so it is available for StockMovement
            // notes (Bug #7) and the order create below.
            const lastOrder = await tx.order.findFirst({
              where: { restaurantId: restaurant.id },
              orderBy: { orderNumber: "desc" },
              select: { orderNumber: true },
            });
            const nextOrderNumber = (lastOrder?.orderNumber ?? 0) + 1;

            // Deduct stock immediately for cash orders. Required quantities were
            // aggregated before the transaction; the fresh stock read and row
            // locks stay here because they are race-sensitive.
            if (isCash) {
              logCreateOrderTiming(requestStartedAt, "inventory check started", {
                attempt,
                inventoryItemCount: sortedInventoryIds.length,
              });

              const lockedStockMap = new Map<
                string,
                { id: string; currentStock: number; name: string }
              >();

              if (sortedInventoryIds.length > 0) {
                const lockedStockRows = await tx.$queryRaw<
                  { id: string; currentStock: number; name: string }[]
                >(Prisma.sql`
                  SELECT id, "currentStock", name
                  FROM "InventoryItem"
                  WHERE id IN (${Prisma.join(sortedInventoryIds)})
                  ORDER BY id
                  FOR UPDATE
                `);

                for (const row of lockedStockRows) {
                  lockedStockMap.set(row.id, row);
                }
              }

              for (const [invId, totalQty] of requiredQtyMap) {
                const locked = lockedStockMap.get(invId);

                if (!locked) {
                  throw new OrderValidationError(`Inventory item not found: ${invId}`);
                }

                if (locked.currentStock < totalQty) {
                  throw new OrderValidationError(
                    `Insufficient stock for "${locked.name}". ` +
                    `Available: ${locked.currentStock}, required: ${totalQty}.`,
                  );
                }
              }

              logCreateOrderTiming(requestStartedAt, "inventory check completed", {
                attempt,
                inventoryItemCount: sortedInventoryIds.length,
              });

              for (const [inventoryItemId, quantity] of requiredQtyMap) {
                await tx.inventoryItem.update({
                  where: { id: inventoryItemId },
                  data: { currentStock: { decrement: quantity } },
                });
              }

              if (requiredStockMovements.length > 0) {
                await tx.stockMovement.createMany({
                  data: requiredStockMovements.map((movement) => ({
                    inventoryItemId: movement.inventoryItemId,
                    type: "OUT",
                    reason: "RECIPE_USAGE",
                    quantity: movement.quantity,
                    note: `Order #${nextOrderNumber}`,
                  })),
                });
              }

              // Keep expected cash atomic with the order creation. Re-check OPEN
              // here so a shift closed after the preflight lookup cannot be used.
              const shiftUpdate = await tx.shift.updateMany({
                where: {
                  id: currentShift.id,
                  userId: user.id,
                  restaurantId: restaurant.id,
                  status: "OPEN",
                },
                data: { expectedCash: { increment: total } },
              });

              if (shiftUpdate.count !== 1) {
                throw new OrderValidationError(ERR.NO_OPEN_SHIFT);
              }
            }

            const createdOrder = await tx.order.create({
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

            logCreateOrderTiming(requestStartedAt, "order created", {
              attempt,
              orderId: createdOrder.id,
            });

            return createdOrder;
          }, { maxWait: 5_000, timeout: 15_000 });

          logCreateOrderTiming(requestStartedAt, "transaction completed", {
            attempt,
            orderId: createdOrder.id,
          });

          return createdOrder;
        } catch (err: unknown) {
          // P2002 = unique constraint violation on orderNumber — safe to retry
          // because the failed transaction is fully rolled back.
          if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && attempt < 3) continue;
          // Business rule errors are surfaced by the outer route handler.
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
    if (err instanceof OrderValidationError)
      return void res.status(400).json({ success: false, message: err.message });

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

    if (shouldDeductStock || shouldRestoreStock) {
      const noRecipeOrderItem = existingOrder.items.find(
        (item) => item.menuItem.recipes.length === 0,
      );

      if (noRecipeOrderItem)
        return void res.status(400).json({
          success: false,
          message: getNoRecipeProcessingMessage(noRecipeOrderItem.menuItem.name),
        });
    }

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
