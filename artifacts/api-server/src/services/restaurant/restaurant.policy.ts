import type { Role } from "../../lib/auth.js";

const ALL_RESTAURANT_ROLES = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF", "VIEWER"] as const satisfies readonly Role[];
const WRITE_RESTAURANT_ROLES = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF"] as const satisfies readonly Role[];
const ADMIN_RESTAURANT_ROLES = ["OWNER", "MANAGER", "ADMIN"] as const satisfies readonly Role[];

export type RestaurantPermissionCapability =
  | "restaurant:read"
  | "restaurant:dashboard:read"
  | "restaurant:shared-dashboard:read"
  | "restaurant:menu:read"
  | "restaurant:menu:manage"
  | "restaurant:table:read"
  | "restaurant:table:manage"
  | "restaurant:order:read"
  | "restaurant:order:create"
  | "restaurant:order:cancel"
  | "restaurant:workflow:preview"
  | "restaurant:workflow:update"
  | "restaurant:kitchen:update"
  | "restaurant:serving:update"
  | "restaurant:payment:preview"
  | "restaurant:payment:confirm"
  | "restaurant:payment:refund"
  | "restaurant:payment:void"
  | "restaurant:audit:read"
  | "restaurant:policy:read";

export const RESTAURANT_PERMISSION_MATRIX = {
  "restaurant:read": ALL_RESTAURANT_ROLES,
  "restaurant:dashboard:read": ALL_RESTAURANT_ROLES,
  "restaurant:shared-dashboard:read": ALL_RESTAURANT_ROLES,
  "restaurant:menu:read": ALL_RESTAURANT_ROLES,
  "restaurant:menu:manage": ADMIN_RESTAURANT_ROLES,
  "restaurant:table:read": ALL_RESTAURANT_ROLES,
  "restaurant:table:manage": ADMIN_RESTAURANT_ROLES,
  "restaurant:order:read": ALL_RESTAURANT_ROLES,
  "restaurant:order:create": WRITE_RESTAURANT_ROLES,
  "restaurant:order:cancel": ADMIN_RESTAURANT_ROLES,
  "restaurant:workflow:preview": ALL_RESTAURANT_ROLES,
  "restaurant:workflow:update": WRITE_RESTAURANT_ROLES,
  "restaurant:kitchen:update": WRITE_RESTAURANT_ROLES,
  "restaurant:serving:update": WRITE_RESTAURANT_ROLES,
  "restaurant:payment:preview": WRITE_RESTAURANT_ROLES,
  "restaurant:payment:confirm": WRITE_RESTAURANT_ROLES,
  "restaurant:payment:refund": ADMIN_RESTAURANT_ROLES,
  "restaurant:payment:void": ADMIN_RESTAURANT_ROLES,
  "restaurant:audit:read": ADMIN_RESTAURANT_ROLES,
  "restaurant:policy:read": ADMIN_RESTAURANT_ROLES,
} as const satisfies Record<RestaurantPermissionCapability, readonly Role[]>;

export function getRestaurantRolesForCapability(capability: RestaurantPermissionCapability) {
  return [...RESTAURANT_PERMISSION_MATRIX[capability]] satisfies Role[];
}

export function canRestaurantRole(role: Role, capability: RestaurantPermissionCapability) {
  return RESTAURANT_PERMISSION_MATRIX[capability].includes(role);
}

export const RESTAURANT_READ_ROLES = getRestaurantRolesForCapability("restaurant:read");
export const RESTAURANT_POS_ROLES = getRestaurantRolesForCapability("restaurant:order:create");
export const RESTAURANT_MENU_MANAGEMENT_ROLES = getRestaurantRolesForCapability("restaurant:menu:manage");
export const RESTAURANT_TABLE_MANAGEMENT_ROLES = getRestaurantRolesForCapability("restaurant:table:manage");
export const RESTAURANT_KITCHEN_ROLES = getRestaurantRolesForCapability("restaurant:kitchen:update");
export const RESTAURANT_SERVING_ROLES = getRestaurantRolesForCapability("restaurant:serving:update");
export const RESTAURANT_PAYMENT_ROLES = getRestaurantRolesForCapability("restaurant:payment:confirm");
export const RESTAURANT_REFUND_ROLES = getRestaurantRolesForCapability("restaurant:payment:refund");
export const RESTAURANT_CANCELLATION_ROLES = getRestaurantRolesForCapability("restaurant:order:cancel");
export const RESTAURANT_AUDIT_ROLES = getRestaurantRolesForCapability("restaurant:audit:read");
export const RESTAURANT_POLICY_ROLES = getRestaurantRolesForCapability("restaurant:policy:read");
