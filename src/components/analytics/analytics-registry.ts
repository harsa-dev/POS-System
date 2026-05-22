import dynamic from "next/dynamic";

export const analyticsRegistry = [
  {
    id: "sales",

    title: "Revenue",

    description: "Weekly revenue overview",

    mainComponent: dynamic(
      () =>
        import("@/components/analytics/sales-chart").then(
          (mod) => mod.SalesChart,
        ),

      {
        ssr: false,
      },
    ),

    compactComponent: dynamic(
      () =>
        import("@/components/analytics/compact/sales-compact").then(
          (mod) => mod.SalesCompact,
        ),

      {
        ssr: false,
      },
    ),
  },

  {
    id: "top-selling",

    title: "Top Selling",

    description: "Best performing menu items",

    mainComponent: dynamic(
      () =>
        import("@/components/analytics/top-selling-menu").then(
          (mod) => mod.TopSellingMenu,
        ),

      {
        ssr: false,
      },
    ),

    compactComponent: dynamic(
      () =>
        import("@/components/analytics/compact/top-selling-compact").then(
          (mod) => mod.TopSellingCompact,
        ),

      {
        ssr: false,
      },
    ),
  },

  {
    id: "food-cost",

    title: "Food Cost",

    description: "Operational cost overview",

    mainComponent: dynamic(
      () =>
        import("@/components/analytics/food-cost-table").then(
          (mod) => mod.FoodCostTable,
        ),

      {
        ssr: false,
      },
    ),

    compactComponent: dynamic(
      () =>
        import("@/components/analytics/compact/food-cost-compact").then(
          (mod) => mod.FoodCostCompact,
        ),

      {
        ssr: false,
      },
    ),
  },

  {
    id: "low-stock",

    title: "Low Stock",

    description: "Inventory alerts",

    mainComponent: dynamic(
      () =>
        import("@/components/analytics/low-stock-list").then(
          (mod) => mod.LowStockList,
        ),

      {
        ssr: false,
      },
    ),

    compactComponent: dynamic(
      () =>
        import("@/components/analytics/compact/low-stock-compact").then(
          (mod) => mod.LowStockCompact,
        ),

      {
        ssr: false,
      },
    ),
  },

  {
    id: "order-status",

    title: "Orders",

    description: "Order status overview",

    mainComponent: dynamic(
      () =>
        import("@/components/analytics/order-status-chart").then(
          (mod) => mod.OrderStatusChart,
        ),

      {
        ssr: false,
      },
    ),

    compactComponent: dynamic(
      () =>
        import("@/components/analytics/compact/order-status-compact").then(
          (mod) => mod.OrderStatusCompact,
        ),

      {
        ssr: false,
      },
    ),
  },

  {
    id: "payment-method",

    title: "Payments",

    description: "Payment method usage",

    mainComponent: dynamic(
      () =>
        import("@/components/analytics/payment-method-chart").then(
          (mod) => mod.PaymentMethodChart,
        ),

      {
        ssr: false,
      },
    ),

    compactComponent: dynamic(
      () =>
        import("@/components/analytics/compact/payment-method-compact").then(
          (mod) => mod.PaymentMethodCompact,
        ),

      {
        ssr: false,
      },
    ),
  },

  {
    id: "peak-hours",

    title: "Peak Hours",

    description: "Customer traffic analysis",

    mainComponent: dynamic(
      () =>
        import("@/components/analytics/peak-hours-chart").then(
          (mod) => mod.PeakHoursChart,
        ),

      {
        ssr: false,
      },
    ),

    compactComponent: dynamic(
      () =>
        import("@/components/analytics/compact/peak-hours-compact").then(
          (mod) => mod.PeakHoursCompact,
        ),

      {
        ssr: false,
      },
    ),
  },

  {
    id: "kitchen-performance",

    title: "Kitchen",

    description: "Kitchen operational performance",

    mainComponent: dynamic(
      () =>
        import("@/components/analytics/kitchen-performance-card").then(
          (mod) => mod.KitchenPerformanceCard,
        ),

      {
        ssr: false,
      },
    ),

    compactComponent: dynamic(
      () =>
        import("@/components/analytics/compact/kitchen-performance-compact").then(
          (mod) => mod.KitchenPerformanceCompact,
        ),

      {
        ssr: false,
      },
    ),
  },

  {
    id: "variance",

    title: "Variance",

    description: "Inventory variance tracking",

    mainComponent: dynamic(
      () =>
        import("@/components/analytics/variance-table").then(
          (mod) => mod.VarianceTable,
        ),

      {
        ssr: false,
      },
    ),

    compactComponent: dynamic(
      () =>
        import("@/components/analytics/compact/variance-compact").then(
          (mod) => mod.VarianceCompact,
        ),

      {
        ssr: false,
      },
    ),
  },

  {
    id: "profit-margin",

    title: "Profit Margin",

    description: "Business profitability insights",

    mainComponent: dynamic(
      () =>
        import("@/components/analytics/profit-margin-table").then(
          (mod) => mod.ProfitMarginTable,
        ),

      {
        ssr: false,
      },
    ),

    compactComponent: dynamic(
      () =>
        import("@/components/analytics/compact/profit-margin-compact").then(
          (mod) => mod.ProfitMarginCompact,
        ),

      {
        ssr: false,
      },
    ),
  },

  {
    id: "category-sales",

    title: "Categories",

    description: "Category sales analytics",

    mainComponent: dynamic(
      () =>
        import("@/components/analytics/category-sales-chart").then(
          (mod) => mod.CategorySalesChart,
        ),

      {
        ssr: false,
      },
    ),

    compactComponent: dynamic(
      () =>
        import("@/components/analytics/compact/category-sales-compact").then(
          (mod) => mod.CategorySalesCompact,
        ),

      {
        ssr: false,
      },
    ),
  },
];
