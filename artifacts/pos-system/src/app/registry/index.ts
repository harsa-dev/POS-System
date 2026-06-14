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
  currentSidebarSnapshot,
  type CurrentSidebarSnapshotItem,
} from "./sidebar-current-snapshot";
export {
  createSidebarParityReport,
  type SidebarParityReport,
} from "./sidebar-parity-report";
export {
  getCurrentSidebarPreview,
  getGeneratedSidebarPreview,
  getGeneratedSidebarPreviewForRuntimeMode,
  type SidebarPreviewItem,
} from "./sidebar-preview";
export {
  getSidebarItemsForRuntimeMode,
  getSidebarItemsForMode,
  sidebarRegistry,
} from "./sidebar-registry";
export {
  createWorkspaceRouteParityReport,
  restaurantWorkspacePlaceholderRoutes,
  restaurantWorkspaceRouteExpectations,
  type WorkspaceRouteParityReport,
} from "./workspace-route-parity-report";
export {
  getWorkspaceRouteForModule,
  getWorkspaceRoutesForMode,
  getWorkspacesForMode,
  workspaceRegistry,
} from "./workspace-registry";
