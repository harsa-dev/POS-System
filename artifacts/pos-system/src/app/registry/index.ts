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
  V3SidebarGroup,
  V3SidebarItem,
  V3WorkspaceMetadata,
} from "./module-types";
export { V3_BUSINESS_MODES } from "./module-types";
export { rawMaterialModules } from "./raw-material-modules";
export { restaurantModules } from "./restaurant-modules";
export { retailModules } from "./retail-modules";
export {
  getSidebarItemsForMode,
  sidebarRegistry,
} from "./sidebar-registry";
export {
  getWorkspacesForMode,
  workspaceRegistry,
} from "./workspace-registry";
