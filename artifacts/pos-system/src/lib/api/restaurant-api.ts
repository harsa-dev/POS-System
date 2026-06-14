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

export type RestaurantPreviewWarningStatus = "info" | "review" | "blocked";

export type RestaurantPreviewWarningDto = {
  key: string;
  status: RestaurantPreviewWarningStatus;
  message: string;
};

export type RestaurantOrderPreviewItemInput = {
  menuItemId: string;
  quantity: number;
};

export type RestaurantOrderPreviewInput = {
  type: "DINE_IN" | "TAKEAWAY";
  tableId?: string | null;
  paymentMethod?: string | null;
  amountPaid?: number | null;
  items: RestaurantOrderPreviewItemInput[];
};

export type RestaurantOrderPreviewItemDto = RestaurantOrderItemDto & {
  isAvailable: boolean;
  stockStatus: "ok" | "low" | "out" | "no_recipe";
  recipeIngredients: RestaurantRecipeIngredientDto[];
};

export type RestaurantOrderPreviewDto = {
  kind: "order";
  generatedAt: string;
  table: RestaurantTableDto | null;
  paymentMethod: string;
  nextStatus: string;
  items: RestaurantOrderPreviewItemDto[];
  totals: {
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    serviceChargeRate: number;
    serviceAmount: number;
    total: number;
    amountPaid: number;
    changeAmount: number;
  };
  canSubmit: boolean;
  warnings: RestaurantPreviewWarningDto[];
  source: "preview";
};

export type RestaurantPaymentPreviewInput = {
  orderId: string;
  paymentMethod?: string | null;
  amountPaid?: number | null;
};

export type RestaurantPaymentPreviewDto = {
  kind: "payment";
  generatedAt: string;
  order: RestaurantOrderDto | null;
  paymentMethod: string | null;
  amountDue: number;
  amountPaid: number;
  changeAmount: number;
  currentStatus: string | null;
  nextStatus: string | null;
  canConfirm: boolean;
  warnings: RestaurantPreviewWarningDto[];
  source: "preview";
};

export type RestaurantStockMovementWriteDto = {
  inventoryItemId: string;
  inventoryItemName: string;
  quantity: number;
  beforeStock: number;
  afterStock: number;
  unit: string;
};

export type RestaurantOrderWriteResultDto = {
  kind: "order_create" | "payment_confirm";
  generatedAt: string;
  order: RestaurantOrderDto;
  stockMovements: RestaurantStockMovementWriteDto[];
  cashflowPosted: boolean;
  warnings: RestaurantPreviewWarningDto[];
  source: "write";
};

export type RestaurantStatusActionSurface = "kitchen" | "serving";

export type RestaurantStatusActionPreviewInput = {
  orderId: string;
  targetStatus?: string | null;
};

export type RestaurantStatusActionTransitionDto = {
  actionKey: string;
  label: string;
  roleScope: "cashier" | "kitchen" | "server" | "manager";
};

export type RestaurantStatusActionPreviewDto = {
  kind: RestaurantStatusActionSurface;
  generatedAt: string;
  order: RestaurantOrderDto | null;
  currentStatus: string | null;
  targetStatus: string | null;
  allowed: boolean;
  transition: RestaurantStatusActionTransitionDto | null;
  warnings: RestaurantPreviewWarningDto[];
  source: "preview";
};

export type RestaurantStatusActionWriteDto = {
  kind: RestaurantStatusActionSurface;
  generatedAt: string;
  order: RestaurantOrderDto;
  previousStatus: string;
  currentStatus: string;
  transition: RestaurantStatusActionTransitionDto;
  tableStatusUpdated: boolean;
  warnings: RestaurantPreviewWarningDto[];
  source: "write";
};

export type RestaurantWorkflowStageStatus = "empty" | "healthy" | "review" | "blocked";
export type RestaurantWorkflowStageId = "payment" | "kitchen" | "serving" | "completed" | "cancelled";

export type RestaurantWorkflowStageDto = {
  id: RestaurantWorkflowStageId;
  title: string;
  description: string;
  statuses: string[];
  count: number;
  totalValue: number;
  oldestOrderAgeMinutes: number;
  status: RestaurantWorkflowStageStatus;
  orders: RestaurantOrderDto[];
};

export type RestaurantWorkflowTransitionDto = {
  from: string;
  to: string;
  actionKey: string;
  label: string;
  roleScope: "cashier" | "kitchen" | "server" | "manager";
};

export type RestaurantWorkflowNextActionDto = {
  key: string;
  stageId: RestaurantWorkflowStageId;
  label: string;
  count: number;
  orderIds: string[];
  status: Exclude<RestaurantWorkflowStageStatus, "empty">;
};

export type RestaurantWorkflowSummaryDto = {
  generatedAt: string;
  totals: {
    activeOrders: number;
    paymentQueue: number;
    kitchenQueue: number;
    servingQueue: number;
    completedToday: number;
    cancelledToday: number;
    blockedStages: number;
    operationalValue: number;
  };
  stages: RestaurantWorkflowStageDto[];
  transitions: RestaurantWorkflowTransitionDto[];
  nextActions: RestaurantWorkflowNextActionDto[];
  stuckOrders: RestaurantOrderDto[];
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
    activeOrdersByStatus: Record<string, number>;
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

export type RestaurantWorkflowPreviewDto = {
  workflow: RestaurantWorkflowSummaryDto;
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
  previewOrder: (input: RestaurantOrderPreviewInput) =>
    apiClient.post<ApiEnvelope<RestaurantOrderPreviewDto>>("/restaurant/orders/preview", input),
  createOrder: (input: RestaurantOrderPreviewInput) =>
    apiClient.post<ApiEnvelope<RestaurantOrderWriteResultDto>>("/restaurant/orders", input),
  previewPayment: (input: RestaurantPaymentPreviewInput) =>
    apiClient.post<ApiEnvelope<RestaurantPaymentPreviewDto>>("/restaurant/payments/preview", input),
  confirmPayment: (input: RestaurantPaymentPreviewInput) =>
    apiClient.post<ApiEnvelope<RestaurantOrderWriteResultDto>>("/restaurant/payments/confirm", input),
  listKitchenQueue: () => apiClient.get<ApiEnvelope<RestaurantOrderDto[]>>("/restaurant/kitchen"),
  previewKitchenAction: (input: RestaurantStatusActionPreviewInput) =>
    apiClient.post<ApiEnvelope<RestaurantStatusActionPreviewDto>>("/restaurant/kitchen/preview", input),
  updateKitchenStatus: (input: RestaurantStatusActionPreviewInput) =>
    apiClient.post<ApiEnvelope<RestaurantStatusActionWriteDto>>("/restaurant/kitchen/status", input),
  listServingQueue: () => apiClient.get<ApiEnvelope<RestaurantOrderDto[]>>("/restaurant/serving"),
  previewServingAction: (input: RestaurantStatusActionPreviewInput) =>
    apiClient.post<ApiEnvelope<RestaurantStatusActionPreviewDto>>("/restaurant/serving/preview", input),
  updateServingStatus: (input: RestaurantStatusActionPreviewInput) =>
    apiClient.post<ApiEnvelope<RestaurantStatusActionWriteDto>>("/restaurant/serving/status", input),
  getWorkflow: () => apiClient.get<ApiEnvelope<RestaurantWorkflowSummaryDto>>("/restaurant/workflow"),
  getWorkflowPreview: () => apiClient.get<ApiEnvelope<RestaurantWorkflowPreviewDto>>("/restaurant/workflow-preview"),
};