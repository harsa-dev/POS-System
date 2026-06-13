// ---------------------------------------------------------------------------
// Route paths — single source of truth for all client-side route strings
// ---------------------------------------------------------------------------
export const ROUTES = {
  ROOT: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  SELECT_MODE: "/select-mode",

  DASHBOARD: "/dashboard",

  CHECKOUT: "/dashboard/fnb/server/checkout",
  ORDERS: "/dashboard/fnb/server/orders",
  ORDER_DETAIL: (id: string) => `/dashboard/fnb/server/orders/${id}`,
  MENU: "/dashboard/fnb/menu",
  RECIPES: "/dashboard/fnb/menu/recipes",
  TABLES: "/dashboard/fnb/server/tables",
  KDS: "/dashboard/fnb/kitchen",
  SERVING: "/dashboard/fnb/server/serving",
  PAYMENTS: "/dashboard/fnb/server/payments",

  BUSINESS_OVERVIEW: "/dashboard/overview",
  ANALYTICS: "/dashboard/analytics",
  CUSTOMERS: "/dashboard/customers",
  CASHFLOW: "/dashboard/cashflow",
  FINANCIAL_REPORTS: "/dashboard/financial-reports",
  INVOICE_GENERATOR: "/dashboard/invoice-generator",
  CASHIER_SHIFT_REPORTS: "/dashboard/cashier-shift-reports",
  HPP_CALCULATOR: "/dashboard/hpp-calculator",
  OPERATION_REPORTS: "/dashboard/shift-reports",
  TEAM_MANAGEMENT: "/dashboard/team-management",
  ROSTER_OVERVIEW: "/dashboard/roster-overview",
  EMPLOYEE_PERFORMANCE: "/dashboard/employee-performance",
  AUDIT_LOG: "/dashboard/audit-log",
  APPROVALS: "/dashboard/approvals",
  EMPLOYEE_CONTRACTS: "/dashboard/employee-contracts",
  EMPLOYEE_ATTENDANCE: "/dashboard/employee-attendance",
  PAYROLL: "/dashboard/payroll",
  PAYMENTS_SUCCESS: "/dashboard/payments/success",
  PAYMENTS_ERROR: "/dashboard/payments/error",
  INVENTORY: "/dashboard/inventory",

  WORKSPACE_RESTAURANT_POS: "/workspace/restaurant/pos",
  WORKSPACE_RESTAURANT_KITCHEN: "/workspace/restaurant/kitchen",
  WORKSPACE_RESTAURANT_SERVING: "/workspace/restaurant/serving",
  WORKSPACE_RESTAURANT_TABLES: "/workspace/restaurant/tables",
  WORKSPACE_RESTAURANT_MENU: "/workspace/restaurant/menu",
  WORKSPACE_RESTAURANT_RECIPES: "/workspace/restaurant/menu/recipes",
  WORKSPACE_RESTAURANT_ORDERS: "/workspace/restaurant/orders",

  V3_RAW_MATERIAL_INTAKE: "/v3/raw-material/intake",
  V3_RAW_MATERIAL_WEIGHING: "/v3/raw-material/weighing",
  V3_RAW_MATERIAL_BATCHES: "/v3/raw-material/batches",
  V3_RAW_MATERIAL_STORAGE: "/v3/raw-material/storage",
  V3_RAW_MATERIAL_PROCESSING: "/v3/raw-material/processing",
  V3_RAW_MATERIAL_KANDANG: "/v3/raw-material/kandang",
  V3_RAW_MATERIAL_SUPPLIERS: "/v3/raw-material/suppliers",
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

  SHIFTS: "/api/shifts",
  SHIFT_CLOSE: (id: string) => `/api/shifts/${id}/close`,

  INVENTORY: "/api/inventory",
  INVENTORY_DETAIL: (id: string) => `/api/inventory/${id}`,

  SETTINGS: "/api/settings",
  PAYMENTS: "/api/payments",
  RECIPES: "/api/recipes",
} as const;
