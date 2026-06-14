import type { OrderStatus, OrderType, PaymentStatus, Role, TableStatus } from "@prisma/client";

export type RestaurantBusinessScope = {
  businessId: string;
};

export type RestaurantActorContext = RestaurantBusinessScope & {
  userId: string;
  role: Role;
};

export type RestaurantCategoryDto = {
  id: string;
  name: string;
};

export type RestaurantRecipeIngredientDto = {
  inventoryItemId: string;
  inventoryItemName: string;
  unit: string;
  quantityNeeded: number;
  currentStock: number;
  minimumStock: number;
};

export type RestaurantMenuItemDto = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  category: RestaurantCategoryDto | null;
  recipeIngredients: RestaurantRecipeIngredientDto[];
  createdAt: string;
  updatedAt: string;
};

export type RestaurantTableDto = {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
  isActive: boolean;
  createdAt: string;
};

export type RestaurantPaymentDto = {
  id: string;
  provider: string;
  method: string;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
};

export type RestaurantOrderItemDto = {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
};

export type RestaurantOrderDto = {
  id: string;
  orderNumber: number;
  code: string;
  subtotal: number;
  taxAmount: number;
  serviceAmount: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  changeAmount: number;
  status: OrderStatus;
  inventoryDeducted: boolean;
  type: OrderType;
  table: RestaurantTableDto | null;
  payment: RestaurantPaymentDto | null;
  items: RestaurantOrderItemDto[];
  createdAt: string;
  updatedAt: string;
};

export type RestaurantDashboardHealthSignalDto = {
  key: string;
  status: "healthy" | "review" | "blocked";
  message: string;
};

export type RestaurantDashboardSummaryDto = {
  generatedAt: string;
  window: {
    start: string;
    end: string;
    timezone: string;
  };
  totals: {
    menuItems: number;
    activeMenuItems: number;
    tables: number;
    occupiedTables: number;
    activeOrders: number;
    pendingPayments: number;
    kitchenQueue: number;
    servingQueue: number;
    lowStockItems: number;
  };
  sales: {
    todayRevenue: number;
    completedOrdersToday: number;
    averageOrderValueToday: number;
    paidRevenueToday: number;
    activeOrderValue: number;
    pendingPaymentValue: number;
  };
  payments: {
    pendingPayments: number;
    paidPaymentsToday: number;
    byMethodToday: Record<string, number>;
  };
  operations: {
    tableOccupancyRate: number;
    activeOrdersByStatus: Partial<Record<OrderStatus, number>>;
    kitchenQueueAgeMinutes: number;
    servingQueueAgeMinutes: number;
  };
  inventory: {
    lowStockItems: number;
    outOfStockItems: number;
    recipeLinkedMenuItems: number;
    menuItemsWithoutRecipe: number;
  };
  health: {
    status: "healthy" | "review" | "blocked";
    signals: RestaurantDashboardHealthSignalDto[];
  };
};

export type RestaurantSharedDashboardId =
  | "overview"
  | "sales"
  | "customers"
  | "inventory"
  | "cashflow"
  | "financial-reports"
  | "invoice-generator"
  | "shift-reports"
  | "team-management"
  | "employee-performance"
  | "approvals"
  | "audit-controls"
  | "roster-overview"
  | "employee-attendance"
  | "employee-contracts"
  | "payroll";

export type RestaurantSharedDashboardMetricDto = {
  label: string;
  value: string;
  helper: string;
};

export type RestaurantSharedDashboardRowDto = {
  title: string;
  primary: string;
  secondary: string;
  status: "healthy" | "review" | "blocked" | "planned";
};

export type RestaurantSharedDashboardDto = {
  id: RestaurantSharedDashboardId;
  title: string;
  description: string;
  metrics: RestaurantSharedDashboardMetricDto[];
  rows: RestaurantSharedDashboardRowDto[];
  bridgeNote: string;
  source: "prisma";
};
