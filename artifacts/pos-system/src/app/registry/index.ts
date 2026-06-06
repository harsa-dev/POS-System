export {
  isV3BusinessMode,
  normalizeBusinessMode,
  type V3RuntimeBusinessMode,
} from "./business-mode-compat";
export { businessModules } from "./business-modules";
export { coreModules } from "./core-modules";
export { customBusinessModules } from "./custom-business-modules";
export {
  getActiveModules,
  getModulesByMode,
  isModuleEnabled,
  moduleRegistry,
} from "./module-registry";
export type {
  V3BusinessMode,
  V3FeatureFlag,
  V3LegacyBusinessMode,
  V3ModuleId,
  V3ModuleLayer,
  V3ModuleMetadata,
  V3ModuleStatus,
  V3PermissionKey,
  V3RuntimeRole,
  V3SidebarGroup,
  V3SidebarItem,
  V3SidebarRegistration,
  V3WorkspaceRegistration,
  V3WorkspaceMetadata,
} from "./module-types";
export { V3_BUSINESS_MODES } from "./module-types";
export {
  getPermissionsForRole,
  getRolesForPermission,
  getRolesForPermissions,
  permissionRoleCompatibility,
} from "./permission-compat";
export { rawMaterialModules } from "./raw-material-modules";
export { restaurantModules } from "./restaurant-modules";
export { retailModules } from "./retail-modules";
export {
  getSidebarItemsForRuntimeMode,
  getSidebarItemsForMode,
  sidebarRegistry,
} from "./sidebar-registry";
export {
  getWorkspacesForMode,
  workspaceRegistry,
} from "./workspace-registry";
