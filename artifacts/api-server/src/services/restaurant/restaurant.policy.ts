import type { Role } from "../../lib/auth.js";
import { permissionKeys, type PermissionKey } from "../permissions/index.js";

const ALL_RESTAURANT_ROLES = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF", "VIEWER"] as const satisfies readonly Role[];
const WRITE_RESTAURANT_ROLES = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF"] as const satisfies readonly Role[];
const ADMIN_RESTAURANT_ROLES = ["OWNER", "MANAGER", "ADMIN"] as const satisfies readonly Role[];

export type RestaurantPermissionCapability =
  | typeof permissionKeys.restaurant.dashboard.view
  | typeof permissionKeys.restaurant.sharedDashboard.view
  | typeof permissionKeys.restaurant.menu.view
  | typeof permissionKeys.restaurant.menu.manage
  | typeof permissionKeys.restaurant.tables.view
  | typeof permissionKeys.restaurant.tables.manage
  | typeof permissionKeys.restaurant.orders.view
  | typeof permissionKeys.restaurant.orders.create
  | typeof permissionKeys.restaurant.orders.cancel
  | typeof permissionKeys.restaurant.workflow.preview
  | typeof permissionKeys.restaurant.workflow.update
  | typeof permissionKeys.restaurant.kitchen.update
  | typeof permissionKeys.restaurant.serving.update
  | typeof permissionKeys.restaurant.payments.view
  | typeof permissionKeys.restaurant.payments.create
  | typeof permissionKeys.restaurant.payments.refund
  | typeof permissionKeys.restaurant.payments.void
  | typeof permissionKeys.restaurant.audit.view
  | typeof permissionKeys.restaurant.policy.view;

export const RESTAURANT_PERMISSION_MATRIX = {
  [permissionKeys.restaurant.dashboard.view]: ALL_RESTAURANT_ROLES,
  [permissionKeys.restaurant.sharedDashboard.view]: ALL_RESTAURANT_ROLES,
  [permissionKeys.restaurant.menu.view]: ALL_RESTAURANT_ROLES,
  [permissionKeys.restaurant.menu.manage]: ADMIN_RESTAURANT_ROLES,
  [permissionKeys.restaurant.tables.view]: ALL_RESTAURANT_ROLES,
  [permissionKeys.restaurant.tables.manage]: ADMIN_RESTAURANT_ROLES,
  [permissionKeys.restaurant.orders.view]: ALL_RESTAURANT_ROLES,
  [permissionKeys.restaurant.orders.create]: WRITE_RESTAURANT_ROLES,
  [permissionKeys.restaurant.orders.cancel]: ADMIN_RESTAURANT_ROLES,
  [permissionKeys.restaurant.workflow.preview]: ALL_RESTAURANT_ROLES,
  [permissionKeys.restaurant.workflow.update]: WRITE_RESTAURANT_ROLES,
  [permissionKeys.restaurant.kitchen.update]: WRITE_RESTAURANT_ROLES,
  [permissionKeys.restaurant.serving.update]: WRITE_RESTAURANT_ROLES,
  [permissionKeys.restaurant.payments.view]: WRITE_RESTAURANT_ROLES,
  [permissionKeys.restaurant.payments.create]: WRITE_RESTAURANT_ROLES,
  [permissionKeys.restaurant.payments.refund]: ADMIN_RESTAURANT_ROLES,
  [permissionKeys.restaurant.payments.void]: ADMIN_RESTAURANT_ROLES,
  [permissionKeys.restaurant.audit.view]: ADMIN_RESTAURANT_ROLES,
  [permissionKeys.restaurant.policy.view]: ADMIN_RESTAURANT_ROLES,
} as const satisfies Record<RestaurantPermissionCapability, readonly Role[]>;

export function getRestaurantRolesForCapability(capability: RestaurantPermissionCapability) {
  return [...RESTAURANT_PERMISSION_MATRIX[capability]] satisfies Role[];
}

export function canRestaurantRole(role: Role, capability: RestaurantPermissionCapability) {
  return RESTAURANT_PERMISSION_MATRIX[capability].some((candidate) => candidate === role);
}

export const RESTAURANT_READ_ROLES = getRestaurantRolesForCapability(permissionKeys.restaurant.dashboard.view);
export const RESTAURANT_POS_ROLES = getRestaurantRolesForCapability(permissionKeys.restaurant.orders.create);
export const RESTAURANT_MENU_MANAGEMENT_ROLES = getRestaurantRolesForCapability(permissionKeys.restaurant.menu.manage);
export const RESTAURANT_TABLE_MANAGEMENT_ROLES = getRestaurantRolesForCapability(permissionKeys.restaurant.tables.manage);
export const RESTAURANT_KITCHEN_ROLES = getRestaurantRolesForCapability(permissionKeys.restaurant.kitchen.update);
export const RESTAURANT_SERVING_ROLES = getRestaurantRolesForCapability(permissionKeys.restaurant.serving.update);
export const RESTAURANT_PAYMENT_ROLES = getRestaurantRolesForCapability(permissionKeys.restaurant.payments.create);
export const RESTAURANT_REFUND_ROLES = getRestaurantRolesForCapability(permissionKeys.restaurant.payments.refund);
export const RESTAURANT_CANCELLATION_ROLES = getRestaurantRolesForCapability(permissionKeys.restaurant.orders.cancel);
export const RESTAURANT_AUDIT_ROLES = getRestaurantRolesForCapability(permissionKeys.restaurant.audit.view);
export const RESTAURANT_POLICY_ROLES = getRestaurantRolesForCapability(permissionKeys.restaurant.policy.view);

export type RestaurantPermissionKey = Extract<PermissionKey, RestaurantPermissionCapability>;
