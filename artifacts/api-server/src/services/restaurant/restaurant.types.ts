import type { OrderStatus, OrderType, PaymentStatus, Role, TableStatus } from "@prisma/client";
import type { RestaurantWorkflowStageId } from "./restaurant.workflow.js";

export type RestaurantBusinessScope = {
  businessId: string;
};

export type RestaurantActorContext = RestaurantBusinessScope & {
  userId: string;
  role: Role;
};

export type RestaurantPreviewSettingsDto = {
  taxRate: number;
  serviceChargeRate: number;
  currency: string;
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
  type: OrderType;
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
  nextStatus: OrderStatus;
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
  currentStatus: OrderStatus | null;
  nextStatus: OrderStatus | null;
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

export type RestaurantCancellationPreviewInput = {
  orderId: string;
  reason?: string | null;
};

export type RestaurantCashflowReversalDto = {
  posted: boolean;
  amount: number;
  account: string | null;
  sourceType: string | null;
  entryId: string | null;
};

export type RestaurantCancellationPreviewDto = {
  kind: "cancellation";
  generatedAt: string;
  order: RestaurantOrderDto | null;
  currentStatus: OrderStatus | null;
  targetStatus: "CANCELLED";
  allowed: boolean;
  reason: string | null;
  stockWillBeRestored: boolean;
  cashflowWillBeReversed: boolean;
  tableWillBeReleased: boolean;
  warnings: RestaurantPreviewWarningDto[];
  source: "preview";
};

export type RestaurantCancellationWriteDto = {
  kind: "cancellation";
  generatedAt: string;
  order: RestaurantOrderDto;
  previousStatus: OrderStatus;
  currentStatus: "CANCELLED";
  reason: string | null;
  stockMovements: RestaurantStockMovementWriteDto[];
  cashflowReversal: RestaurantCashflowReversalDto;
  tableStatusUpdated: boolean;
  warnings: RestaurantPreviewWarningDto[];
  source: "write";
};

export type RestaurantStatusActionSurface = "kitchen" | "serving";

export type RestaurantStatusActionPreviewInput = {
  orderId: string;
  targetStatus?: OrderStatus | null;
};

export type RestaurantStatusActionPreviewDto = {
  kind: RestaurantStatusActionSurface;
  generatedAt: string;
  order: RestaurantOrderDto | null;
  currentStatus: OrderStatus | null;
  targetStatus: OrderStatus | null;
  allowed: boolean;
  transition: {
    actionKey: string;
    label: string;
    roleScope: "cashier" | "kitchen" | "server" | "manager";
  } | null;
  warnings: RestaurantPreviewWarningDto[];
  source: "preview";
};

export type RestaurantStatusActionWriteDto = {
  kind: RestaurantStatusActionSurface;
  generatedAt: string;
  order: RestaurantOrderDto;
  previousStatus: OrderStatus;
  currentStatus: OrderStatus;
  transition: NonNullable<RestaurantStatusActionPreviewDto["transition"]>;
  tableStatusUpdated: boolean;
  warnings: RestaurantPreviewWarningDto[];
  source: "write";
};

export type RestaurantWorkflowStageStatus = "empty" | "healthy" | "review" | "blocked";

export type RestaurantWorkflowStageDto = {
  id: RestaurantWorkflowStageId;
  title: string;
  description: string;
  statuses: OrderStatus[];
  count: number;
  totalValue: number;
  oldestOrderAgeMinutes: number;
  status: RestaurantWorkflowStageStatus;
  orders: RestaurantOrderDto[];
};

export type RestaurantWorkflowTransitionDto = {
  from: OrderStatus;
  to: OrderStatus;
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
