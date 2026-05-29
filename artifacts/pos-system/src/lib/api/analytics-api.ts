import { apiJson, type ApiEnvelope } from "@/lib/api/api-client";

type AnalyticsResponse<T = any> = ApiEnvelope<T>;

function getAnalytics<T = any>(endpoint: string) {
  return apiJson<AnalyticsResponse<T>>(endpoint, { credentials: "include" });
}

export const analyticsApi = {
  overview() {
    return getAnalytics("/api/analytics/overview");
  },

  sales() {
    return getAnalytics("/api/analytics/sales");
  },

  orderStatus() {
    return getAnalytics("/api/analytics/order-status");
  },

  topMenu() {
    return getAnalytics("/api/analytics/top-menu");
  },

  variance() {
    return getAnalytics("/api/analytics/variance");
  },

  profitMargin() {
    return getAnalytics("/api/analytics/profit-margin");
  },

  peakHours() {
    return getAnalytics("/api/analytics/peak-hours");
  },

  paymentMethod() {
    return getAnalytics("/api/analytics/payment-method");
  },

  lowStock() {
    return getAnalytics("/api/analytics/low-stock");
  },

  liveOrders() {
    return getAnalytics("/api/analytics/live-orders");
  },

  kitchenPerformance() {
    return getAnalytics("/api/analytics/kitchen-performance");
  },

  foodCost() {
    return getAnalytics("/api/analytics/food-cost");
  },

  categorySales() {
    return getAnalytics("/api/analytics/category-sales");
  },
};
