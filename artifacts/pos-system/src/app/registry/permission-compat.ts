import type { V3PermissionKey, V3RuntimeRole } from "./module-types";

export const permissionRoleCompatibility = {
  "auth.access": ["OWNER", "MANAGER", "CASHIER", "SERVER", "KITCHEN"],
  "permissions.manage": ["OWNER", "MANAGER"],
  "settings.manage": ["OWNER", "MANAGER"],
  "inventory.view": ["OWNER", "MANAGER"],
  "inventory.manage": ["OWNER", "MANAGER"],
  "payments.manage": ["OWNER", "MANAGER"],
  "analytics.view": ["OWNER", "MANAGER", "CASHIER"],
  "analytics.operational-view": ["OWNER", "MANAGER", "CASHIER"],
  "analytics.profit-view": ["OWNER", "MANAGER"],
  "audit.view": ["OWNER", "MANAGER"],
  "employees.manage": ["OWNER", "MANAGER"],
  "attendance.manage": ["OWNER", "MANAGER"],
  "shifts.manage": ["OWNER", "MANAGER"],
  "reports.view": ["OWNER", "MANAGER"],
  "customers.manage": ["OWNER", "MANAGER"],
  "cashflow.view": ["OWNER", "MANAGER"],
  "invoice.manage": ["OWNER", "MANAGER"],
  "restaurant.pos.access": ["OWNER", "MANAGER", "CASHIER"],
  "restaurant.kitchen.access": ["OWNER", "MANAGER", "KITCHEN"],
  "restaurant.serving.access": ["OWNER", "MANAGER", "SERVER", "CASHIER"],
  "restaurant.tables.manage": ["OWNER", "MANAGER", "SERVER", "CASHIER"],
  "restaurant.menu.manage": ["OWNER", "MANAGER"],
  "restaurant.recipes.manage": ["OWNER", "MANAGER"],
  "restaurant.orders.manage": ["OWNER", "MANAGER", "CASHIER"],
  "retail.cashier.access": ["OWNER", "MANAGER", "CASHIER"],
  "retail.catalog.manage": ["OWNER", "MANAGER"],
  "retail.barcode.manage": ["OWNER", "MANAGER"],
  "retail.receiving.manage": ["OWNER", "MANAGER"],
  "retail.stock-opname.manage": ["OWNER", "MANAGER"],
  "retail.shelf-management.manage": ["OWNER", "MANAGER"],
  "retail.promotions.manage": ["OWNER", "MANAGER"],
  "raw-material.intake.manage": ["OWNER", "MANAGER"],
  "raw-material.weighing.manage": ["OWNER", "MANAGER"],
  "raw-material.batches.manage": ["OWNER", "MANAGER"],
  "raw-material.storage.manage": ["OWNER", "MANAGER"],
  "raw-material.processing.manage": ["OWNER", "MANAGER"],
  "raw-material.kandang.manage": ["OWNER", "MANAGER"],
  "raw-material.suppliers.manage": ["OWNER", "MANAGER"],
  "custom-business.registry.manage": ["OWNER", "MANAGER"],
  "custom-business.feature-flags.manage": ["OWNER", "MANAGER"],
  "custom-business.config.manage": ["OWNER", "MANAGER"],
} satisfies Record<V3PermissionKey, readonly V3RuntimeRole[]>;

export function getRolesForPermission(permission: V3PermissionKey) {
  return permissionRoleCompatibility[permission];
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
