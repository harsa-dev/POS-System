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
  RestaurantWorkflowNextActionDto,
  RestaurantWorkflowStageDto,
  RestaurantWorkflowStageStatus,
  RestaurantWorkflowSummaryDto,
} from "./restaurant.types.js";
import {
  RESTAURANT_ACTIVE_ORDER_STATUSES,
  RESTAURANT_KITCHEN_QUEUE_STATUSES,
  RESTAURANT_ORDER_TRANSITIONS,
  RESTAURANT_PAYMENT_QUEUE_STATUSES,
  RESTAURANT_SERVING_QUEUE_STATUSES,
  RESTAURANT_WORKFLOW_STAGE_DEFINITIONS,
} from "./restaurant.workflow.js";

const activeOrderStatuses: OrderStatus[] = [...RESTAURANT_ACTIVE_ORDER_STATUSES];
const kitchenQueueStatuses: OrderStatus[] = [...RESTAURANT_KITCHEN_QUEUE_STATUSES];
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

function getOrderAgeMinutes(order: { createdAt: Date }, now = new Date()) {
  return Math.max(0, Math.round((now.getTime() - order.createdAt.getTime()) / 60000));
}

function getQueueAgeMinutes(orders: Array<{ createdAt: Date }>, now = new Date()) {
  if (orders.length === 0) return 0;

  const oldest = orders.reduce((currentOldest, order) => (order.createdAt < currentOldest ? order.createdAt : currentOldest), orders[0]?.createdAt ?? now);

  return getOrderAgeMinutes({ createdAt: oldest }, now);
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

function getWorkflowStageStatus(count: number, oldestOrderAgeMinutes: number, reviewAgeMinutes: number, blockedAgeMinutes: number): RestaurantWorkflowStageStatus {
  if (count === 0) return "empty";
  if (blockedAgeMinutes > 0 && oldestOrderAgeMinutes >= blockedAgeMinutes) return "blocked";
  if (reviewAgeMinutes > 0 && oldestOrderAgeMinutes >= reviewAgeMinutes) return "review";
  return "healthy";
}

function getTransitionLabel(from: OrderStatus, to: OrderStatus) {
  if (from === "PENDING_PAYMENT" && to === "PAID") return "Confirm payment";
  if (from === "PAID" && to === "PREPARING") return "Send to kitchen";
  if (from === "PREPARING" && to === "READY") return "Mark ready";
  if (from === "READY" && to === "SERVED") return "Mark served";
  if (from === "SERVED" && to === "COMPLETED") return "Complete order";
  if (to === "CANCELLED") return "Cancel order";
  return `Move ${from} to ${to}`;
}

function getTransitionRoleScope(from: OrderStatus, to: OrderStatus) {
  if (to === "CANCELLED") return "manager" as const;
  if (from === "PENDING_PAYMENT") return "cashier" as const;
  if (from === "PAID" || from === "PREPARING") return "kitchen" as const;
  if (from === "READY" || from === "SERVED") return "server" as const;
  return "manager" as const;
}

function getWorkflowTransitions() {
  return (Object.entries(RESTAURANT_ORDER_TRANSITIONS) as Array<[OrderStatus, readonly OrderStatus[]]>).flatMap(([from, nextStatuses]) =>
    nextStatuses.map((to) => ({
      from,
      to,
      actionKey: `${from.toLowerCase()}_to_${to.toLowerCase()}`,
      label: getTransitionLabel(from, to),
      roleScope: getTransitionRoleScope(from, to),
    })),
  );
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
        where: { businessId: scope.businessId, status: { in: ["READY"] } },
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

  async getWorkflowSummary(scope) {
    const today = startOfToday();
    const now = new Date();

    const workflowOrders = await prisma.order.findMany({
      where: {
        businessId: scope.businessId,
        OR: [
          { status: { in: [...RESTAURANT_ACTIVE_ORDER_STATUSES] } },
          { status: { in: ["COMPLETED", "CANCELLED"] }, createdAt: { gte: today } },
        ],
      },
      include: orderInclude,
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      take: 200,
    });

    const mappedOrders = workflowOrders.map(mapOrder);
    const orderById = new Map(mappedOrders.map((order) => [order.id, order]));

    const stageOrderRecords = RESTAURANT_WORKFLOW_STAGE_DEFINITIONS.map((definition): RestaurantWorkflowStageDto => {
      const definitionStatuses = [...definition.statuses] as OrderStatus[];
      const records = workflowOrders.filter((order) => definitionStatuses.includes(order.status));
      const orders = records.map((order) => orderById.get(order.id)).filter((order): order is RestaurantOrderDto => Boolean(order));
      const oldestOrderAgeMinutes = getQueueAgeMinutes(records, now);
      const status = getWorkflowStageStatus(records.length, oldestOrderAgeMinutes, definition.reviewAgeMinutes, definition.blockedAgeMinutes);

      return {
        id: definition.id,
        title: definition.title,
        description: definition.description,
        statuses: definitionStatuses,
        count: records.length,
        totalValue: sumOrders(records),
        oldestOrderAgeMinutes,
        status,
        orders,
      };
    });

    const nextActions = stageOrderRecords
      .filter((stage): stage is RestaurantWorkflowStageDto & { status: Exclude<RestaurantWorkflowStageStatus, "empty"> } => stage.status !== "empty")
      .map<RestaurantWorkflowNextActionDto>((stage) => ({
        key: `review_${stage.id}`,
        stageId: stage.id,
        label: stage.status === "blocked" ? `Unblock ${stage.title}` : `Review ${stage.title}`,
        count: stage.count,
        orderIds: stage.orders.map((order) => order.id),
        status: stage.status,
      }));

    const stuckOrders = stageOrderRecords
      .filter((stage) => stage.status === "review" || stage.status === "blocked")
      .flatMap((stage) => stage.orders.filter((order) => {
        const definition = RESTAURANT_WORKFLOW_STAGE_DEFINITIONS.find((item) => item.id === stage.id);
        if (!definition || definition.reviewAgeMinutes === 0) return false;
        return getOrderAgeMinutes({ createdAt: new Date(order.createdAt) }, now) >= definition.reviewAgeMinutes;
      }));

    const completedToday = stageOrderRecords.find((stage) => stage.id === "completed")?.count ?? 0;
    const cancelledToday = stageOrderRecords.find((stage) => stage.id === "cancelled")?.count ?? 0;
    const paymentQueue = stageOrderRecords.find((stage) => stage.id === "payment")?.count ?? 0;
    const kitchenQueue = stageOrderRecords.find((stage) => stage.id === "kitchen")?.count ?? 0;
    const servingQueue = stageOrderRecords.find((stage) => stage.id === "serving")?.count ?? 0;
    const activeOrders = paymentQueue + kitchenQueue + servingQueue;
    const blockedStages = stageOrderRecords.filter((stage) => stage.status === "blocked").length;
    const operationalValue = sumOrders(stageOrderRecords.filter((stage) => stage.id !== "completed" && stage.id !== "cancelled").flatMap((stage) => stage.orders));

    return {
      generatedAt: now.toISOString(),
      totals: {
        activeOrders,
        paymentQueue,
        kitchenQueue,
        servingQueue,
        completedToday,
        cancelledToday,
        blockedStages,
        operationalValue,
      },
      stages: stageOrderRecords,
      transitions: getWorkflowTransitions(),
      nextActions,
      stuckOrders,
    } satisfies RestaurantWorkflowSummaryDto;
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
