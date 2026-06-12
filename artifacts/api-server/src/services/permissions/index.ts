export {
  can,
  canAccessKitchen,
  canManageInventory,
  canManageMenu,
  canTransitionOrderStatus,
  canViewFinancialReports,
  isOwnerRole,
  type PermissionKey as LegacyPermissionKey,
} from "./permissions.js";

export {
  hasPermission,
  permissionKeys,
  requirePermission,
  rolePermissionMap,
  type PermissionKey,
} from "./permission-registry.js";
