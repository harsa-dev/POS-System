// ---------------------------------------------------------------------------
// Route paths — single source of truth for all client-side route strings
// ---------------------------------------------------------------------------
export const ROUTES = {
  ROOT: "/",
  LOGIN: "/login",
  REGISTER: "/register",

  DASHBOARD: "/dashboard",
  CHECKOUT: "/dashboard/checkout",
  ORDERS: "/dashboard/orders",
  ORDER_DETAIL: (id: string) => `/dashboard/orders/${id}`,
  MENU: "/dashboard/menu",
  RECIPES: "/dashboard/recipes",
  TABLES: "/dashboard/tables",
  KDS: "/dashboard/kds",
  ANALYTICS: "/dashboard/analytics",
  CUSTOMERS: "/dashboard/customers",
  CASHFLOW: "/dashboard/cashflow",
  FINANCIAL_REPORTS: "/dashboard/financial-reports",
  PAYMENTS: "/dashboard/payments",
  PAYMENTS_SUCCESS: "/dashboard/payments/success",
  PAYMENTS_ERROR: "/dashboard/payments/error",
  INVENTORY: "/dashboard/inventory",
  EMPLOYEES: "/dashboard/employees",
  ATTENDANCE: "/dashboard/attendance",
  SHIFTS: "/dashboard/shifts",
  SETTINGS: "/dashboard/settings",
  SERVING: "/dashboard/serving",
  AUDIT_LOGS: "/dashboard/audit-logs",
} as const;

// ---------------------------------------------------------------------------
// API endpoint paths — base strings for fetch() calls
// ---------------------------------------------------------------------------
export const API = {
  AUTH_ME: "/api/auth/me",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_LOGIN: "/api/auth/login",
  AUTH_REGISTER: "/api/auth/register",

  ORDERS: "/api/orders",
  ORDER_STATUS: (id: string) => `/api/orders/${id}/status`,
  ORDER_DETAIL: (id: string) => `/api/orders/${id}`,

  MENU_ITEMS: "/api/menu-items",
  CATEGORIES: "/api/categories",

  TABLES: "/api/tables",
  TABLE_DETAIL: (id: string) => `/api/tables/${id}`,

  EMPLOYEES: "/api/employees",
  EMPLOYEE_DETAIL: (id: string) => `/api/employees/${id}`,
  EMPLOYEE_RESET_PASSWORD: (id: string) => `/api/employees/${id}/reset-password`,

  SHIFTS: "/api/shifts",
  SHIFT_CLOSE: (id: string) => `/api/shifts/${id}/close`,

  INVENTORY: "/api/inventory",
  INVENTORY_DETAIL: (id: string) => `/api/inventory/${id}`,

  SETTINGS: "/api/settings",
  PAYMENTS: "/api/payments",
  ATTENDANCE: "/api/attendance",
  AUDIT_LOGS: "/api/audit-logs",
  RECIPES: "/api/recipes",

  ANALYTICS_OVERVIEW: "/api/analytics/overview",
  ANALYTICS_SALES: "/api/analytics/sales",
  ANALYTICS_ORDER_STATUS: "/api/analytics/order-status",
  ANALYTICS_TOP_ITEMS: "/api/analytics/top-items",
  ANALYTICS_PEAK_HOURS: "/api/analytics/peak-hours",
  ANALYTICS_KITCHEN_PERFORMANCE: "/api/analytics/kitchen-performance",
  ANALYTICS_LIVE_ORDERS: "/api/analytics/live-orders",
  ANALYTICS_LOW_STOCK: "/api/analytics/low-stock",
  ANALYTICS_FOOD_COST: "/api/analytics/food-cost",
  ANALYTICS_STAFF_PERFORMANCE: "/api/analytics/staff-performance",
  ANALYTICS_REVENUE_BREAKDOWN: "/api/analytics/revenue-breakdown",
} as const;
