import { moduleRegistry } from "./module-registry";
import type {
  V3BusinessMode,
  V3ModuleMetadata,
  V3SidebarItem,
} from "./module-types";

type RoutedSidebarModule = V3ModuleMetadata & {
  routeBase: string;
  sidebarVisible: true;
};

function isRoutedSidebarModule(
  module: V3ModuleMetadata,
): module is RoutedSidebarModule {
  return (
    module.status === "active" &&
    module.sidebarVisible &&
    module.routeBase !== null
  );
}

export const sidebarRegistry = moduleRegistry
  .filter(isRoutedSidebarModule)
  .map(
    (module): V3SidebarItem => ({
      moduleId: module.id,
      label: module.label,
      description: module.description,
      routePath: module.routeBase,
      group: module.sidebarGroup,
      supportedModes: module.supportedModes,
      requiredPermissions: module.requiredPermissions,
      featureFlags: module.featureFlags,
    }),
  );

export function getSidebarItemsForMode(mode: V3BusinessMode) {
  return sidebarRegistry.filter((item) => item.supportedModes.includes(mode));
}
