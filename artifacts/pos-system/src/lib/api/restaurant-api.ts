import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

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
  status: string;
  isActive: boolean;
  createdAt: string;
};

export type RestaurantPaymentDto = {
  id: string;
  provider: string;
  method: string;
  status: string;
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
  status: string;
  inventoryDeducted: boolean;
  type: "DINE_IN" | "TAKEAWAY";
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

export type RestaurantWorkflowPreviewDto = {
  activeOrders: RestaurantOrderDto[];
  kitchenQueue: RestaurantOrderDto[];
  servingQueue: RestaurantOrderDto[];
};

export const restaurantApi = {
  getHealth: () => apiClient.get<ApiEnvelope<{ status: string; mode: "restaurant" }>>("/restaurant/health"),
  getDashboard: () => apiClient.get<ApiEnvelope<RestaurantDashboardSummaryDto>>("/restaurant/dashboard"),
  getSharedDashboard: (dashboardId: RestaurantSharedDashboardId) =>
    apiClient.get<ApiEnvelope<RestaurantSharedDashboardDto>>(`/restaurant/shared-dashboard/${dashboardId}`),
  listMenuItems: () => apiClient.get<ApiEnvelope<RestaurantMenuItemDto[]>>("/restaurant/menu-items"),
  listTables: () => apiClient.get<ApiEnvelope<RestaurantTableDto[]>>("/restaurant/tables"),
  listActiveOrders: () => apiClient.get<ApiEnvelope<RestaurantOrderDto[]>>("/restaurant/orders/active"),
  listKitchenQueue: () => apiClient.get<ApiEnvelope<RestaurantOrderDto[]>>("/restaurant/kitchen"),
  listServingQueue: () => apiClient.get<ApiEnvelope<RestaurantOrderDto[]>>("/restaurant/serving"),
  getWorkflowPreview: () => apiClient.get<ApiEnvelope<RestaurantWorkflowPreviewDto>>("/restaurant/workflow-preview"),
};
