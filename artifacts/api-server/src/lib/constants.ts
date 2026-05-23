import type { Role } from "./auth.js";

// ---------------------------------------------------------------------------
// Role groups — use these in requireRole() calls instead of inline arrays
// ---------------------------------------------------------------------------
export const OWNER_ONLY: Role[] = ["OWNER"];
export const MANAGEMENT_ROLES: Role[] = ["OWNER", "MANAGER"];
export const POS_ROLES: Role[] = ["OWNER", "MANAGER", "CASHIER"];
export const KITCHEN_ROLES: Role[] = ["OWNER", "MANAGER", "KITCHEN"];
export const OPS_ROLES: Role[] = ["OWNER", "MANAGER", "CASHIER", "SERVER"];
export const MANAGEMENT_AND_SERVER_ROLES: Role[] = ["OWNER", "MANAGER", "SERVER"];
export const MANAGEMENT_AND_KITCHEN_ROLES: Role[] = ["OWNER", "MANAGER", "KITCHEN", "CASHIER"];
export const ALL_ROLES: Role[] = ["OWNER", "MANAGER", "CASHIER", "KITCHEN", "SERVER"];
/** Non-owner staff roles — used for employee management filtering */
export const EMPLOYEE_ROLES: Role[] = ["MANAGER", "CASHIER", "KITCHEN", "SERVER"];

// ---------------------------------------------------------------------------
// Order statuses
// ---------------------------------------------------------------------------
export const ALL_ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "PREPARING",
  "READY",
  "SERVED",
  "COMPLETED",
  "CANCELLED",
] as const;

export const ACTIVE_KITCHEN_STATUSES = ["PAID", "PREPARING", "READY"] as const;

// ---------------------------------------------------------------------------
// Payment methods
// ---------------------------------------------------------------------------
export const PAYMENT_METHODS = {
  CASH: "CASH",
  QRIS: "QRIS",
  CARD: "CARD",
  TRANSFER: "TRANSFER",
} as const;

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------
/** Fallback low-stock threshold when an item has no minimumStock set */
export const DEFAULT_LOW_STOCK_THRESHOLD = 10;

// ---------------------------------------------------------------------------
// Pagination defaults
// ---------------------------------------------------------------------------
export const DEFAULT_PAGE_SIZE = 50;
export const DEFAULT_AUDIT_LOG_LIMIT = 100;
export const DEFAULT_LIVE_ORDERS_LIMIT = 10;
export const DEFAULT_LOW_STOCK_LIMIT = 8;

// ---------------------------------------------------------------------------
// Standardised API error messages
// ---------------------------------------------------------------------------
export const ERR = {
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  RESTAURANT_NOT_FOUND: "Restaurant not found",
  ORDER_NOT_FOUND: "Order not found",
  SHIFT_NOT_FOUND: "Shift not found",
  TABLE_NOT_FOUND: "Table not found",
  EMPLOYEE_NOT_FOUND: "Employee not found",
  ITEM_NOT_FOUND: "Item not found",
  RECIPE_NOT_FOUND: "Recipe not found",
  INVALID_TRANSITION: "Invalid status transition",
  NO_OPEN_SHIFT: "Please open shift before creating order",
} as const;
