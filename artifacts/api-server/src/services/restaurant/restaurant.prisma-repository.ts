import type { OrderStatus, Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import type { RestaurantRepository } from "./restaurant.repository.js";
import type {
  RestaurantBusinessScope,
  RestaurantDashboardHealthSignalDto,
  RestaurantDashboardSummaryDto,
  RestaurantMenuItemDto,
  RestaurantOrderDto,
  RestaurantTableDto,
} from "./restaurant.types.js";

const activeOrderStatuses: OrderStatus[] = ["PENDING_PAYMENT", "PAID", "PREPARING", "READY", "SERVED"];
const kitchenQueueStatuses: OrderStatus[] = ["PAID", "PREPARING"];
const servingQueueStatuses: OrderStatus[] = ["READY"];

const menuItemInclude = {
  category: true,
  recipes: {
    include: {
      inventoryItem: true,
    },
  },
} satisfies Prisma.MenuItemInclude;

const orderInclude = {
  table: true,
  payment: true,
  items: {
    include: {
      menuItem: true,
    },
  },
} satisfies Prisma.OrderInclude;

type MenuItemRecord = Prisma.MenuItemGetPayload<{ include: typeof menuItemInclude }>;
type OrderRecord = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;
type TableRecord = Prisma.DiningTableGetPayload<{}>;

type SummaryOrderRecord = {
  status: OrderStatus;
  total: number;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
  payment: {
    status: string;
    paidAt: Date | null;
  } | null;
};

function toIsoDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function formatOrderNumber(orderNumber: number) {
  return `#${String(orderNumber).padStart(4, "0")}`;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getQueueAgeMinutes(orders: Array<{ createdAt: Date }>, now = new Date()) {
  if (orders.length === 0) return 0;

  const oldest = orders.reduce((currentOldest, order) => (order.createdAt < currentOldest ? order.createdAt : currentOldest), orders[0]?.createdAt ?? now);

  return Math.max(0, Math.round((now.getTime() - oldest.getTime()) / 60000));
}

function sumOrders(orders: Array<{ total: number }>) {
  return orders.reduce((total, order) => total + order.total, 0);
}

function getOrderStatusCounts(orders: SummaryOrderRecord[]) {
  return orders.reduce<Partial<Record<OrderStatus, number>>>((counts, order) => {
    counts[order.status] = (counts[order.status] ?? 0) + 1;
    return counts;
  }, {});
}

function getPaymentMethodTotals(orders: SummaryOrderRecord[]) {
  return orders.reduce<Record<string, number>>((totals, order) => {
    const key = order.paymentMethod || "UNKNOWN";
    totals[key] = (totals[key] ?? 0) + order.total;
    return totals;
  }, {});
}

function getHealthStatus(signals: RestaurantDashboardHealthSignalDto[]): RestaurantDashboardSummaryDto["health"]["status"] {
  if (signals.some((signal) => signal.status === "blocked")) return "blocked";
  if (signals.some((signal) => signal.status === "review")) return "review";
  return "healthy";
}

function getQueueSignal(key: string, label: string, ageMinutes: number, reviewThreshold: number, blockedThreshold: number): RestaurantDashboardHealthSignalDto {
  const status = ageMinutes >= blockedThreshold ? "blocked" : ageMinutes >= reviewThreshold ? "review" : "healthy";

  return {
    key,
    status,
    message: `${label} oldest order age is ${ageMinutes} minutes.`,
  };
}

function mapMenuItem(item: MenuItemRecord): RestaurantMenuItemDto {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    imageUrl: item.imageUrl,
    isAvailable: item.isAvailable,
    category: item.category ? { id: item.category.id, name: item.category.name } : null,
    recipeIngredients: item.recipes.map((recipe) => ({
      inventoryItemId: recipe.inventoryItem.id,
      inventoryItemName: recipe.inventoryItem.name,
      unit: recipe.inventoryItem.unit,
      quantityNeeded: recipe.quantityNeeded,
      currentStock: recipe.inventoryItem.currentStock,
      minimumStock: recipe.inventoryItem.minimumStock,
    })),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function mapTable(table: TableRecord): RestaurantTableDto {
  return {
    id: table.id,
    name: table.name,
    capacity: table.capacity,
    status: table.status,
    isActive: table.isActive,
    createdAt: table.createdAt.toISOString(),
  };
}

function mapOrder(order: OrderRecord): RestaurantOrderDto {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    code: formatOrderNumber(order.orderNumber),
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    serviceAmount: order.serviceAmount,
    total: order.total,
    paymentMethod: order.paymentMethod,
    amountPaid: order.amountPaid,
    changeAmount: order.changeAmount,
    status: order.status,
    inventoryDeducted: order.inventoryDeducted,
    type: order.type,
    table: order.table ? mapTable(order.table) : null,
    payment: order.payment
      ? {
          id: order.payment.id,
          provider: order.payment.provider,
          method: order.payment.method,
          status: order.payment.status,
          paidAt: toIsoDate(order.payment.paidAt),
          createdAt: order.payment.createdAt.toISOString(),
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      name: item.menuItem.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

async function listOrdersByStatuses(scope: RestaurantBusinessScope, statuses: OrderStatus[]) {
  const orders = await prisma.order.findMany({
    where: {
      businessId: scope.businessId,
      status: { in: statuses },
    },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });

  return orders.map(mapOrder);
}

export const restaurantPrismaRepository: RestaurantRepository = {
  async getDashboardSummary(scope) {
    const today = startOfToday();
    const now = new Date();

    const [
      restaurantSettings,
      menuItems,
      activeMenuItems,
      tables,
      occupiedTables,
      activeOrders,
      pendingPaymentOrders,
      kitchenQueueOrders,
      servingQueueOrders,
      inventoryStockLevels,
      menuRecipeLinks,
      todaysOrders,
      completedToday,
      todayRevenue,
    ] = await Promise.all([
      prisma.restaurant.findUnique({
        where: { businessId: scope.businessId },
        select: { timezone: true },
      }),
      prisma.menuItem.count({ where: { businessId: scope.businessId } }),
      prisma.menuItem.count({ where: { businessId: scope.businessId, isAvailable: true } }),
      prisma.diningTable.count({ where: { businessId: scope.businessId, isActive: true } }),
      prisma.diningTable.count({ where: { businessId: scope.businessId, isActive: true, status: "OCCUPIED" } }),
      prisma.order.findMany({
        where: { businessId: scope.businessId, status: { in: activeOrderStatuses } },
        select: { status: true, total: true, paymentMethod: true, createdAt: true, updatedAt: true, payment: { select: { status: true, paidAt: true } } },
      }),
      prisma.order.findMany({
        where: { businessId: scope.businessId, status: "PENDING_PAYMENT" },
        select: { status: true, total: true, paymentMethod: true, createdAt: true, updatedAt: true, payment: { select: { status: true, paidAt: true } } },
      }),
      prisma.order.findMany({
        where: { businessId: scope.businessId, status: { in: kitchenQueueStatuses } },
        select: { status: true, total: true, paymentMethod: true, createdAt: true, updatedAt: true, payment: { select: { status: true, paidAt: true } } },
      }),
      prisma.order.findMany({
        where: { businessId: scope.businessId, status: { in: servingQueueStatuses } },
        select: { status: true, total: true, paymentMethod: true, createdAt: true, updatedAt: true, payment: { select: { status: true, paidAt: true } } },
      }),
      prisma.inventoryItem.findMany({
        where: { businessId: scope.businessId },
        select: { currentStock: true, minimumStock: true },
      }),
      prisma.menuItem.findMany({
        where: { businessId: scope.businessId },
        select: { id: true, recipes: { select: { id: true }, take: 1 } },
      }),
      prisma.order.findMany({
        where: { businessId: scope.businessId, createdAt: { gte: today } },
        select: { status: true, total: true, paymentMethod: true, createdAt: true, updatedAt: true, payment: { select: { status: true, paidAt: true } } },
      }),
      prisma.order.count({
        where: {
          businessId: scope.businessId,
          status: "COMPLETED",
          createdAt: { gte: today },
        },
      }),
      prisma.order.aggregate({
        where: {
          businessId: scope.businessId,
          status: "COMPLETED",
          createdAt: { gte: today },
        },
        _sum: { total: true },
      }),
    ]);

    const revenue = todayRevenue._sum.total ?? 0;
    const paidTodayOrders = todaysOrders.filter((order) => order.payment?.status === "PAID");
    const lowStockItems = inventoryStockLevels.filter((item) => item.currentStock <= item.minimumStock).length;
    const outOfStockItems = inventoryStockLevels.filter((item) => item.currentStock <= 0).length;
    const recipeLinkedMenuItems = menuRecipeLinks.filter((item) => item.recipes.length > 0).length;
    const menuItemsWithoutRecipe = menuRecipeLinks.length - recipeLinkedMenuItems;
    const tableOccupancyRate = tables > 0 ? Math.round((occupiedTables / tables) * 100) : 0;
    const kitchenQueueAgeMinutes = getQueueAgeMinutes(kitchenQueueOrders, now);
    const servingQueueAgeMinutes = getQueueAgeMinutes(servingQueueOrders, now);
    const pendingPaymentValue = sumOrders(pendingPaymentOrders);

    const signals: RestaurantDashboardHealthSignalDto[] = [
      {
        key: "payments.pending",
        status: pendingPaymentOrders.length > 0 ? "review" : "healthy",
        message: `${pendingPaymentOrders.length} orders are waiting for payment.`,
      },
      getQueueSignal("operations.kitchen_age", "Kitchen queue", kitchenQueueAgeMinutes, 15, 30),
      getQueueSignal("operations.serving_age", "Serving queue", servingQueueAgeMinutes, 5, 15),
      {
        key: "inventory.low_stock",
        status: outOfStockItems > 0 ? "blocked" : lowStockItems > 0 ? "review" : "healthy",
        message: `${lowStockItems} inventory items are at or below minimum stock, ${outOfStockItems} are out of stock.`,
      },
      {
        key: "tables.occupancy",
        status: tableOccupancyRate >= 95 ? "review" : "healthy",
        message: `Dining room occupancy is ${tableOccupancyRate}%.`,
      },
    ];

    return {
      generatedAt: now.toISOString(),
      window: {
        start: today.toISOString(),
        end: now.toISOString(),
        timezone: restaurantSettings?.timezone ?? "Asia/Jakarta",
      },
      totals: {
        menuItems,
        activeMenuItems,
        tables,
        occupiedTables,
        activeOrders: activeOrders.length,
        pendingPayments: pendingPaymentOrders.length,
        kitchenQueue: kitchenQueueOrders.length,
        servingQueue: servingQueueOrders.length,
        lowStockItems,
      },
      sales: {
        todayRevenue: revenue,
        completedOrdersToday: completedToday,
        averageOrderValueToday: completedToday > 0 ? Math.round(revenue / completedToday) : 0,
        paidRevenueToday: sumOrders(paidTodayOrders),
        activeOrderValue: sumOrders(activeOrders),
        pendingPaymentValue,
      },
      payments: {
        pendingPayments: pendingPaymentOrders.length,
        paidPaymentsToday: paidTodayOrders.length,
        byMethodToday: getPaymentMethodTotals(todaysOrders),
      },
      operations: {
        tableOccupancyRate,
        activeOrdersByStatus: getOrderStatusCounts(activeOrders),
        kitchenQueueAgeMinutes,
        servingQueueAgeMinutes,
      },
      inventory: {
        lowStockItems,
        outOfStockItems,
        recipeLinkedMenuItems,
        menuItemsWithoutRecipe,
      },
      health: {
        status: getHealthStatus(signals),
        signals,
      },
    };
  },

  async listMenuItems(scope) {
    const items = await prisma.menuItem.findMany({
      where: { businessId: scope.businessId },
      include: menuItemInclude,
      orderBy: [{ isAvailable: "desc" }, { createdAt: "desc" }],
      take: 200,
    });

    return items.map(mapMenuItem);
  },

  async listTables(scope) {
    const tables = await prisma.diningTable.findMany({
      where: { businessId: scope.businessId, isActive: true },
      orderBy: [{ status: "asc" }, { name: "asc" }],
      take: 200,
    });

    return tables.map(mapTable);
  },

  async listActiveOrders(scope) {
    return listOrdersByStatuses(scope, activeOrderStatuses);
  },

  async listKitchenQueue(scope) {
    return listOrdersByStatuses(scope, kitchenQueueStatuses);
  },

  async listServingQueue(scope) {
    return listOrdersByStatuses(scope, servingQueueStatuses);
  },
};
