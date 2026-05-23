import { lazy } from "react";

const lz = <T extends Record<string, React.ComponentType<any>>>(
  fn: () => Promise<T>,
  key: keyof T,
) => lazy(() => fn().then((m) => ({ default: m[key] as React.ComponentType<any> })));

export const analyticsRegistry = [
  {
    id: "sales",
    title: "Revenue",
    description: "Weekly revenue overview",
    mainComponent: lz(() => import("@/components/analytics/sales-chart"), "SalesChart"),
    compactComponent: lz(() => import("@/components/analytics/compact/sales-compact"), "SalesCompact"),
  },
  {
    id: "top-selling",
    title: "Top Selling",
    description: "Best performing menu items",
    mainComponent: lz(() => import("@/components/analytics/top-selling-menu"), "TopSellingMenu"),
    compactComponent: lz(() => import("@/components/analytics/compact/top-selling-compact"), "TopSellingCompact"),
  },
  {
    id: "food-cost",
    title: "Food Cost",
    description: "Operational cost overview",
    mainComponent: lz(() => import("@/components/analytics/food-cost-table"), "FoodCostTable"),
    compactComponent: lz(() => import("@/components/analytics/compact/food-cost-compact"), "FoodCostCompact"),
  },
  {
    id: "low-stock",
    title: "Low Stock",
    description: "Inventory alerts",
    mainComponent: lz(() => import("@/components/analytics/low-stock-list"), "LowStockList"),
    compactComponent: lz(() => import("@/components/analytics/compact/low-stock-compact"), "LowStockCompact"),
  },
  {
    id: "order-status",
    title: "Orders",
    description: "Order status overview",
    mainComponent: lz(() => import("@/components/analytics/order-status-chart"), "OrderStatusChart"),
    compactComponent: lz(() => import("@/components/analytics/compact/order-status-compact"), "OrderStatusCompact"),
  },
  {
    id: "payment-method",
    title: "Payments",
    description: "Payment method usage",
    mainComponent: lz(() => import("@/components/analytics/payment-method-chart"), "PaymentMethodChart"),
    compactComponent: lz(() => import("@/components/analytics/compact/payment-method-compact"), "PaymentMethodCompact"),
  },
  {
    id: "peak-hours",
    title: "Peak Hours",
    description: "Customer traffic analysis",
    mainComponent: lz(() => import("@/components/analytics/peak-hours-chart"), "PeakHoursChart"),
    compactComponent: lz(() => import("@/components/analytics/compact/peak-hours-compact"), "PeakHoursCompact"),
  },
  {
    id: "kitchen-performance",
    title: "Kitchen",
    description: "Kitchen operational performance",
    mainComponent: lz(() => import("@/components/analytics/kitchen-performance-card"), "KitchenPerformanceCard"),
    compactComponent: lz(() => import("@/components/analytics/compact/kitchen-performance-compact"), "KitchenPerformanceCompact"),
  },
  {
    id: "variance",
    title: "Variance",
    description: "Inventory variance tracking",
    mainComponent: lz(() => import("@/components/analytics/variance-table"), "VarianceTable"),
    compactComponent: lz(() => import("@/components/analytics/compact/variance-compact"), "VarianceCompact"),
  },
  {
    id: "profit-margin",
    title: "Profit Margin",
    description: "Business profitability insights",
    mainComponent: lz(() => import("@/components/analytics/profit-margin-table"), "ProfitMarginTable"),
    compactComponent: lz(() => import("@/components/analytics/compact/profit-margin-compact"), "ProfitMarginCompact"),
  },
  {
    id: "category-sales",
    title: "Categories",
    description: "Category sales analytics",
    mainComponent: lz(() => import("@/components/analytics/category-sales-chart"), "CategorySalesChart"),
    compactComponent: lz(() => import("@/components/analytics/compact/category-sales-compact"), "CategorySalesCompact"),
  },
];
