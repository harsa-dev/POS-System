import type { V3PermissionKey, V3RuntimeRole } from "./module-types";

const ALL_AUTHENTICATED_ROLES: readonly V3RuntimeRole[] = [
  "OWNER",
  "MANAGER",
  "ADMIN",
  "OPERATOR",
  "STAFF",
  "VIEWER",
];

const MANAGEMENT_ROLES: readonly V3RuntimeRole[] = ["OWNER", "MANAGER", "ADMIN"];
const PLATFORM_ADMIN_ROLES: readonly V3RuntimeRole[] = ["OWNER", "ADMIN"];
const OPERATION_ROLES: readonly V3RuntimeRole[] = [
  "OWNER",
  "MANAGER",
  "ADMIN",
  "OPERATOR",
];
const STAFF_OPERATION_ROLES: readonly V3RuntimeRole[] = [
  "OWNER",
  "MANAGER",
  "ADMIN",
  "OPERATOR",
  "STAFF",
];
const READ_ONLY_BUSINESS_ROLES: readonly V3RuntimeRole[] = [
  "OWNER",
  "MANAGER",
  "ADMIN",
  "OPERATOR",
  "STAFF",
  "VIEWER",
];

export const permissionRoleCompatibility = {
  "auth.access": ALL_AUTHENTICATED_ROLES,
  "permissions.manage": MANAGEMENT_ROLES,
  "settings.manage": MANAGEMENT_ROLES,
  "platform-admin.internal-monitoring.read": PLATFORM_ADMIN_ROLES,
  "inventory.view": READ_ONLY_BUSINESS_ROLES,
  "inventory.manage": MANAGEMENT_ROLES,
  "payments.manage": MANAGEMENT_ROLES,
  "analytics.view": READ_ONLY_BUSINESS_ROLES,
  "analytics.operational-view": STAFF_OPERATION_ROLES,
  "analytics.profit-view": MANAGEMENT_ROLES,
  "audit.view": MANAGEMENT_ROLES,
  "employees.manage": MANAGEMENT_ROLES,
  "attendance.manage": MANAGEMENT_ROLES,
  "shifts.manage": MANAGEMENT_ROLES,
  "reports.view": READ_ONLY_BUSINESS_ROLES,
  "customers.manage": MANAGEMENT_ROLES,
  "cashflow.view": MANAGEMENT_ROLES,
  "invoice.manage": MANAGEMENT_ROLES,
  "restaurant.pos.access": OPERATION_ROLES,
  "restaurant.kitchen.access": STAFF_OPERATION_ROLES,
  "restaurant.serving.access": STAFF_OPERATION_ROLES,
  "restaurant.tables.manage": STAFF_OPERATION_ROLES,
  "restaurant.menu.manage": MANAGEMENT_ROLES,
  "restaurant.recipes.manage": MANAGEMENT_ROLES,
  "restaurant.orders.manage": OPERATION_ROLES,
  "retail.cashier.access": OPERATION_ROLES,
  "retail.catalog.manage": MANAGEMENT_ROLES,
  "retail.barcode.manage": MANAGEMENT_ROLES,
  "retail.receiving.manage": MANAGEMENT_ROLES,
  "retail.stock-opname.manage": MANAGEMENT_ROLES,
  "retail.shelf-management.manage": MANAGEMENT_ROLES,
  "retail.promotions.manage": MANAGEMENT_ROLES,
  "raw-material.intake.manage": STAFF_OPERATION_ROLES,
  "raw-material.weighing.manage": STAFF_OPERATION_ROLES,
  "raw-material.batches.manage": MANAGEMENT_ROLES,
  "raw-material.storage.manage": MANAGEMENT_ROLES,
  "raw-material.processing.manage": MANAGEMENT_ROLES,
  "raw-material.kandang.manage": MANAGEMENT_ROLES,
  "raw-material.suppliers.manage": MANAGEMENT_ROLES,
  "custom-business.registry.manage": MANAGEMENT_ROLES,
  "custom-business.feature-flags.manage": MANAGEMENT_ROLES,
  "custom-business.config.manage": MANAGEMENT_ROLES,
} satisfies Record<V3PermissionKey, readonly V3RuntimeRole[]>;

export function getRolesForPermission(permission: V3PermissionKey) {
  return permissionRoleCompatibility[permission] ?? [];
}

export function getRolesForPermissions(
  permissions: readonly V3PermissionKey[],
) {
  const roles = new Set<V3RuntimeRole>();

  for (const permission of permissions) {
    for (const role of getRolesForPermission(permission)) {
      roles.add(role);
    }
  }

  return [...roles];
}

export function getPermissionsForRole(role: V3RuntimeRole) {
  return Object.entries(permissionRoleCompatibility)
    .filter(([, roles]) => {
      const compatibleRoles: readonly V3RuntimeRole[] = roles;

      return compatibleRoles.includes(role);
    })
    .map(([permission]) => permission as V3PermissionKey);
}
