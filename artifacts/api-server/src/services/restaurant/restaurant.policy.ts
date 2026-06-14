import type { Role } from "../../lib/auth.js";

export const RESTAURANT_READ_ROLES: Role[] = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF", "VIEWER"];
export const RESTAURANT_POS_ROLES: Role[] = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF"];
export const RESTAURANT_MENU_MANAGEMENT_ROLES: Role[] = ["OWNER", "MANAGER", "ADMIN"];
export const RESTAURANT_TABLE_MANAGEMENT_ROLES: Role[] = ["OWNER", "MANAGER", "ADMIN"];
export const RESTAURANT_KITCHEN_ROLES: Role[] = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF"];
export const RESTAURANT_SERVING_ROLES: Role[] = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF"];
export const RESTAURANT_PAYMENT_ROLES: Role[] = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF"];
export const RESTAURANT_REFUND_ROLES: Role[] = ["OWNER", "MANAGER", "ADMIN"];
export const RESTAURANT_CANCELLATION_ROLES: Role[] = ["OWNER", "MANAGER", "ADMIN"];
