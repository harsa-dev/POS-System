import type { Role } from "./auth.js";

export const OWNER_ONLY: Role[] = ["OWNER"];
export const MANAGEMENT_ROLES: Role[] = ["OWNER", "MANAGER", "ADMIN"];
export const OPERATIONS_ROLES: Role[] = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF"];
export const POS_ROLES: Role[] = OPERATIONS_ROLES;
export const KITCHEN_ROLES: Role[] = OPERATIONS_ROLES;
export const OPS_ROLES: Role[] = OPERATIONS_ROLES;
export const MANAGEMENT_AND_SERVER_ROLES: Role[] = OPERATIONS_ROLES;
export const MANAGEMENT_AND_KITCHEN_ROLES: Role[] = OPERATIONS_ROLES;
export const READONLY_ROLES: Role[] = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF", "VIEWER"];
export const ALL_ROLES: Role[] = READONLY_ROLES;
export const EMPLOYEE_ROLES: Role[] = ["MANAGER", "ADMIN", "OPERATOR", "STAFF", "VIEWER"];

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

export const PAYMENT_METHODS = {
  CASH: "CASH",
  QRIS: "QRIS",
  CARD: "CARD",
  TRANSFER: "TRANSFER",
} as const;

export const DEFAULT_LOW_STOCK_THRESHOLD = 10;
export const DEFAULT_PAGE_SIZE = 50;
export const DEFAULT_AUDIT_LOG_LIMIT = 100;
export const DEFAULT_LIVE_ORDERS_LIMIT = 10;
export const DEFAULT_LOW_STOCK_LIMIT = 8;

export const ERR = {
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  BUSINESS_NOT_FOUND: "Business not found",
  ORDER_NOT_FOUND: "Order not found",
  SHIFT_NOT_FOUND: "Shift not found",
  TABLE_NOT_FOUND: "Table not found",
  EMPLOYEE_NOT_FOUND: "Employee not found",
  ITEM_NOT_FOUND: "Item not found",
  RECIPE_NOT_FOUND: "Recipe not found",
  INVALID_TRANSITION: "Invalid status transition",
  NO_OPEN_SHIFT: "Please open shift before creating order",
} as const;
