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

export type RestaurantDashboardSummaryDto = {
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
