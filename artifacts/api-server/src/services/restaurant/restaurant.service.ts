import type { RestaurantRepository } from "./restaurant.repository.js";
import { restaurantRepository } from "./restaurant.repository-provider.js";
import type {
  RestaurantBusinessScope,
  RestaurantDashboardSummaryDto,
  RestaurantMenuItemDto,
  RestaurantOrderDto,
  RestaurantSharedDashboardDto,
  RestaurantSharedDashboardId,
  RestaurantSharedDashboardRowDto,
  RestaurantTableDto,
} from "./restaurant.types.js";

function formatMoney(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getMenuRows(menuItems: RestaurantMenuItemDto[]): RestaurantSharedDashboardRowDto[] {
  return menuItems.slice(0, 6).map((item) => {
    const lowStockIngredients = item.recipeIngredients.filter((ingredient) => ingredient.currentStock <= ingredient.minimumStock);

    return {
      title: item.name,
      primary: `${formatMoney(item.price)} · ${item.isAvailable ? "available" : "disabled"}`,
      secondary: `${item.category?.name ?? "Uncategorized"} · ${item.recipeIngredients.length} recipe lines`,
      status: !item.isAvailable ? "blocked" : lowStockIngredients.length > 0 ? "review" : "healthy",
    };
  });
}

function getTableRows(tables: RestaurantTableDto[]): RestaurantSharedDashboardRowDto[] {
  return tables.slice(0, 6).map((table) => ({
    title: table.name,
    primary: `${table.status} · capacity ${table.capacity}`,
    secondary: table.isActive ? "Active dining table" : "Inactive dining table",
    status: table.status === "OCCUPIED" ? "review" : table.status === "AVAILABLE" ? "healthy" : "planned",
  }));
}

function getOrderRows(orders: RestaurantOrderDto[]): RestaurantSharedDashboardRowDto[] {
  return orders.slice(0, 6).map((order) => ({
    title: order.code,
    primary: `${order.status} · ${formatMoney(order.total)}`,
    secondary: `${order.items.length} items · ${order.table?.name ?? order.type}`,
    status: order.status === "PENDING_PAYMENT" ? "review" : order.status === "CANCELLED" ? "blocked" : "healthy",
  }));
}

function getInventoryRows(menuItems: RestaurantMenuItemDto[]): RestaurantSharedDashboardRowDto[] {
  const ingredientRows = menuItems
    .flatMap((item) => item.recipeIngredients.map((ingredient) => ({ item, ingredient })))
    .filter(({ ingredient }) => ingredient.currentStock <= ingredient.minimumStock)
    .slice(0, 6);

  return ingredientRows.map(({ item, ingredient }) => ({
    title: ingredient.inventoryItemName,
    primary: `${ingredient.currentStock}/${ingredient.minimumStock} ${ingredient.unit}`,
    secondary: `Used by ${item.name} · needs ${ingredient.quantityNeeded} ${ingredient.unit}`,
    status: ingredient.currentStock <= 0 ? "blocked" : "review",
  }));
}

function getSkippedRows(label: string, replacement: string): RestaurantSharedDashboardRowDto[] {
  return [
    {
      title: `${label} is not called in Restaurant mode yet`,
      primary: `Restaurant mode uses ${replacement} for this phase.`,
      secondary: "The generic shared dashboard remains available for other business modes.",
      status: "planned",
    },
  ];
}

function getOverviewMetrics(summary: RestaurantDashboardSummaryDto) {
  return [
    { label: "Active orders", value: String(summary.totals.activeOrders), helper: "PENDING_PAYMENT, PAID, PREPARING, READY, SERVED" },
    { label: "Today revenue", value: formatMoney(summary.sales.todayRevenue), helper: "Completed orders today" },
    { label: "Kitchen queue", value: String(summary.totals.kitchenQueue), helper: "PAID or PREPARING orders" },
  ];
}

export class RestaurantService {
  constructor(private readonly repository: RestaurantRepository = restaurantRepository) {}

  getDashboardSummary(scope: RestaurantBusinessScope) {
    return this.repository.getDashboardSummary(scope);
  }

  getWorkflowSummary(scope: RestaurantBusinessScope) {
    return this.repository.getWorkflowSummary(scope);
  }

  listMenuItems(scope: RestaurantBusinessScope) {
    return this.repository.listMenuItems(scope);
  }

  listTables(scope: RestaurantBusinessScope) {
    return this.repository.listTables(scope);
  }

  listActiveOrders(scope: RestaurantBusinessScope) {
    return this.repository.listActiveOrders(scope);
  }

  listKitchenQueue(scope: RestaurantBusinessScope) {
    return this.repository.listKitchenQueue(scope);
  }

  listServingQueue(scope: RestaurantBusinessScope) {
    return this.repository.listServingQueue(scope);
  }

  async getSharedDashboard(scope: RestaurantBusinessScope, dashboardId: RestaurantSharedDashboardId): Promise<RestaurantSharedDashboardDto> {
    const [summary, menuItems, tables, activeOrders, kitchenQueue, servingQueue] = await Promise.all([
      this.repository.getDashboardSummary(scope),
      this.repository.listMenuItems(scope),
      this.repository.listTables(scope),
      this.repository.listActiveOrders(scope),
      this.repository.listKitchenQueue(scope),
      this.repository.listServingQueue(scope),
    ]);

    const menuRows = getMenuRows(menuItems);
    const tableRows = getTableRows(tables);
    const orderRows = getOrderRows(activeOrders);
    const kitchenRows = getOrderRows(kitchenQueue);
    const servingRows = getOrderRows(servingQueue);
    const inventoryRows = getInventoryRows(menuItems);
    const revenuePerOrder = summary.sales.completedOrdersToday > 0
      ? Math.round(summary.sales.todayRevenue / summary.sales.completedOrdersToday)
      : 0;

    if (dashboardId === "inventory") {
      return {
        id: dashboardId,
        title: "Restaurant inventory and recipe stock",
        description: "Restaurant inventory is summarized from menu recipes and inventory item stock levels.",
        metrics: [
          { label: "Menu items", value: String(summary.totals.menuItems), helper: "All menu items scoped to this business" },
          { label: "Active menu", value: String(summary.totals.activeMenuItems), helper: "Available items" },
          { label: "Low stock", value: String(summary.totals.lowStockItems), helper: "Inventory at or below minimum stock" },
        ],
        rows: inventoryRows.length > 0 ? inventoryRows : menuRows,
        bridgeNote: "This shared dashboard is served by /api/restaurant/shared-dashboard/inventory.",
        source: "prisma",
      };
    }

    if (dashboardId === "sales" || dashboardId === "cashflow" || dashboardId === "financial-reports") {
      return {
        id: dashboardId,
        title: dashboardId === "sales" ? "Restaurant sales analytics" : dashboardId === "cashflow" ? "Restaurant cashflow" : "Restaurant financial reports",
        description: "Restaurant financial signals use completed order revenue, active order counts, and payment queue context.",
        metrics: [
          { label: "Today revenue", value: formatMoney(summary.sales.todayRevenue), helper: "Completed orders today" },
          { label: "Completed orders", value: String(summary.sales.completedOrdersToday), helper: "Order status COMPLETED" },
          { label: "Avg order value", value: formatMoney(revenuePerOrder), helper: "Revenue divided by completed orders" },
        ],
        rows: orderRows.length > 0 ? orderRows : menuRows,
        bridgeNote: `This shared dashboard is served by /api/restaurant/shared-dashboard/${dashboardId}.`,
        source: "prisma",
      };
    }

    if (dashboardId === "invoice-generator") {
      return {
        id: dashboardId,
        title: "Restaurant receipts and payment documents",
        description: "Restaurant mode prioritizes POS receipts and payment state before generic invoice generation.",
        metrics: [
          { label: "Pending payment", value: String(summary.totals.pendingPayments), helper: "Orders waiting for payment" },
          { label: "Active orders", value: String(summary.totals.activeOrders), helper: "Orders still in operational flow" },
          { label: "Receipt mode", value: "Restaurant POS", helper: "Customer receipt first" },
        ],
        rows: orderRows,
        bridgeNote: "This shared dashboard is served by /api/restaurant/shared-dashboard/invoice-generator.",
        source: "prisma",
      };
    }

    if (dashboardId === "shift-reports" || dashboardId === "team-management") {
      return {
        id: dashboardId,
        title: "Restaurant operations staffing context",
        description: "Restaurant mode currently exposes operational queue pressure before full staff scheduling is wired.",
        metrics: [
          { label: "Kitchen queue", value: String(summary.totals.kitchenQueue), helper: "Cooking workload" },
          { label: "Serving queue", value: String(summary.totals.servingQueue), helper: "Ready-to-serve workload" },
          { label: "Occupied tables", value: String(summary.totals.occupiedTables), helper: "Floor load" },
        ],
        rows: [...kitchenRows, ...servingRows].slice(0, 6),
        bridgeNote: `This shared dashboard is served by /api/restaurant/shared-dashboard/${dashboardId}.`,
        source: "prisma",
      };
    }

    if (dashboardId === "employee-attendance" || dashboardId === "employee-contracts" || dashboardId === "payroll" || dashboardId === "employee-performance") {
      return {
        id: dashboardId,
        title: "Restaurant HR surface skipped",
        description: "Restaurant mode does not call heavy HR dashboards until staff payroll, attendance, and contracts become active requirements.",
        metrics: [
          { label: "Status", value: "Skipped", helper: "Not required for Restaurant Phase 4" },
          { label: "Replacement", value: "Queue pressure", helper: "Kitchen/serving/table load" },
          { label: "Source", value: "Prisma API", helper: "Served by Restaurant backend" },
        ],
        rows: getSkippedRows(dashboardId, "restaurant operations queue context"),
        bridgeNote: `This shared dashboard is intentionally skipped in Restaurant mode by /api/restaurant/shared-dashboard/${dashboardId}.`,
        source: "prisma",
      };
    }

    if (dashboardId === "customers") {
      return {
        id: dashboardId,
        title: "Restaurant guest context",
        description: "Restaurant mode currently summarizes table and order flow before customer CRM is wired.",
        metrics: [
          { label: "Tables", value: String(summary.totals.tables), helper: "Active dining tables" },
          { label: "Occupied", value: String(summary.totals.occupiedTables), helper: "Current floor load" },
          { label: "Active orders", value: String(summary.totals.activeOrders), helper: "Guest order flow" },
        ],
        rows: tableRows,
        bridgeNote: "This shared dashboard is served by /api/restaurant/shared-dashboard/customers.",
        source: "prisma",
      };
    }

    return {
      id: dashboardId,
      title: "Restaurant operations overview",
      description: "Restaurant shared dashboard bridge is using backend menu, table, order, kitchen, and serving signals.",
      metrics: getOverviewMetrics(summary),
      rows: orderRows.length > 0 ? orderRows : tableRows.length > 0 ? tableRows : menuRows,
      bridgeNote: `This shared dashboard is served by /api/restaurant/shared-dashboard/${dashboardId}.`,
      source: "prisma",
    };
  }
}

export const restaurantService = new RestaurantService();
