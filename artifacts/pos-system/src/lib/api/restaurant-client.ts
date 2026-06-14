import { restaurantApi } from "@/lib/api/restaurant-api";
import { restaurantPaymentReversalApi } from "@/lib/api/restaurant-payment-reversal-api";

export const RESTAURANT_API_CONTRACT_VERSION = "restaurant.v1" as const;

export const RESTAURANT_API_ENDPOINTS = {
  health: "/restaurant/health",
  dashboard: "/restaurant/dashboard",
  sharedDashboard: "/restaurant/shared-dashboard/:dashboardId",
  menuItems: "/restaurant/menu-items",
  tables: "/restaurant/tables",
  activeOrders: "/restaurant/orders/active",
  orderPreview: "/restaurant/orders/preview",
  orderCreate: "/restaurant/orders",
  orderStatusPreview: "/restaurant/orders/:orderId/status/preview",
  orderStatusUpdate: "/restaurant/orders/:orderId/status",
  cancellationPreview: "/restaurant/orders/:orderId/cancellation/preview",
  cancellationWrite: "/restaurant/orders/:orderId/cancel",
  paymentPreview: "/restaurant/payments/preview",
  paymentConfirm: "/restaurant/payments/confirm",
  paymentReversalPreview: "/restaurant/orders/:orderId/payment-reversal/preview",
  paymentReversalWrite: "/restaurant/orders/:orderId/payment-reversal",
  kitchenQueue: "/restaurant/kitchen",
  kitchenPreview: "/restaurant/kitchen/preview",
  kitchenStatus: "/restaurant/kitchen/status",
  servingQueue: "/restaurant/serving",
  servingPreview: "/restaurant/serving/preview",
  servingStatus: "/restaurant/serving/status",
  workflow: "/restaurant/workflow",
  workflowPreview: "/restaurant/workflow-preview",
} as const;

export type RestaurantApiContractVersion = typeof RESTAURANT_API_CONTRACT_VERSION;
export type RestaurantApiEndpointKey = keyof typeof RESTAURANT_API_ENDPOINTS;
export type RestaurantApiEndpointPath = (typeof RESTAURANT_API_ENDPOINTS)[RestaurantApiEndpointKey];

export const restaurantClient = {
  contractVersion: RESTAURANT_API_CONTRACT_VERSION,
  endpoints: RESTAURANT_API_ENDPOINTS,

  getHealth: restaurantApi.getHealth,
  getDashboard: restaurantApi.getDashboard,
  getSharedDashboard: restaurantApi.getSharedDashboard,
  listMenuItems: restaurantApi.listMenuItems,
  listTables: restaurantApi.listTables,
  listActiveOrders: restaurantApi.listActiveOrders,

  previewOrder: restaurantApi.previewOrder,
  createOrder: restaurantApi.createOrder,
  previewOrderStatus: restaurantApi.previewOrderStatus,
  updateOrderStatus: restaurantApi.updateOrderStatus,
  previewCancellation: restaurantApi.previewCancellation,
  cancelOrder: restaurantApi.cancelOrder,

  previewPayment: restaurantApi.previewPayment,
  confirmPayment: restaurantApi.confirmPayment,
  previewPaymentReversal: restaurantPaymentReversalApi.previewPaymentReversal,
  reversePayment: restaurantPaymentReversalApi.reversePayment,

  listKitchenQueue: restaurantApi.listKitchenQueue,
  previewKitchenAction: restaurantApi.previewKitchenAction,
  updateKitchenStatus: restaurantApi.updateKitchenStatus,

  listServingQueue: restaurantApi.listServingQueue,
  previewServingAction: restaurantApi.previewServingAction,
  updateServingStatus: restaurantApi.updateServingStatus,

  getWorkflow: restaurantApi.getWorkflow,
  getWorkflowPreview: restaurantApi.getWorkflowPreview,
} as const;

export type RestaurantClient = typeof restaurantClient;

export { restaurantApi } from "@/lib/api/restaurant-api";
export { restaurantPaymentReversalApi } from "@/lib/api/restaurant-payment-reversal-api";
export * from "@/lib/api/restaurant-api";
export * from "@/lib/api/restaurant-payment-reversal-api";
