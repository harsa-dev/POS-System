import type { OrderStatus, Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import type { RestaurantRepository } from "./restaurant.repository.js";
import type {
  RestaurantBusinessScope,
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

    const [
      menuItems,
      activeMenuItems,
      tables,
      occupiedTables,
      activeOrders,
      pendingPayments,
      kitchenQueue,
      servingQueue,
      lowStockItems,
      completedToday,
      todayRevenue,
    ] = await Promise.all([
      prisma.menuItem.count({ where: { businessId: scope.businessId } }),
      prisma.menuItem.count({ where: { businessId: scope.businessId, isAvailable: true } }),
      prisma.diningTable.count({ where: { businessId: scope.businessId, isActive: true } }),
      prisma.diningTable.count({ where: { businessId: scope.businessId, isActive: true, status: "OCCUPIED" } }),
      prisma.order.count({ where: { businessId: scope.businessId, status: { in: activeOrderStatuses } } }),
      prisma.order.count({ where: { businessId: scope.businessId, status: "PENDING_PAYMENT" } }),
      prisma.order.count({ where: { businessId: scope.businessId, status: { in: kitchenQueueStatuses } } }),
      prisma.order.count({ where: { businessId: scope.businessId, status: { in: servingQueueStatuses } } }),
      prisma.inventoryItem.count({
        where: {
          businessId: scope.businessId,
          currentStock: { lte: prisma.inventoryItem.fields.minimumStock },
        },
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

    return {
      totals: {
        menuItems,
        activeMenuItems,
        tables,
        occupiedTables,
        activeOrders,
        pendingPayments,
        kitchenQueue,
        servingQueue,
        lowStockItems,
      },
      sales: {
        todayRevenue: revenue,
        completedOrdersToday: completedToday,
        averageOrderValueToday: completedToday > 0 ? Math.round(revenue / completedToday) : 0,
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
