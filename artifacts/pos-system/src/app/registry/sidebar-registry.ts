import { normalizeBusinessMode } from "./business-mode-compat";
import { moduleRegistry } from "./module-registry";
import type {
  V3BusinessMode,
  V3ModuleMetadata,
  V3SidebarItem,
} from "./module-types";
import { getRolesForPermissions } from "./permission-compat";

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
  .flatMap((module): V3SidebarItem[] => {
    const registeredItems =
      module.sidebarEntries?.map((item): V3SidebarItem => ({
        moduleId: item.moduleId,
        label: item.label,
        description: item.description,
        routePath: item.routePath,
        group: item.group,
        supportedModes: item.supportedModes,
        requiredPermissions: item.requiredPermissions,
        featureFlags: item.featureFlags,
        requiredRoles:
          item.requiredRoles ?? getRolesForPermissions(item.requiredPermissions),
        order: item.order ?? Number.MAX_SAFE_INTEGER,
      })) ?? [];

    if (!isRoutedSidebarModule(module)) {
      return registeredItems;
    }

    return [
      ...registeredItems,
      {
        moduleId: module.id,
        label: module.sidebarLabel ?? module.label,
        description: module.description,
        routePath: module.routeBase,
        group: module.sidebarGroup,
        supportedModes: module.supportedModes,
        requiredPermissions: module.requiredPermissions,
        featureFlags: module.featureFlags,
        requiredRoles: getRolesForPermissions(module.requiredPermissions),
        order: module.sidebarOrder ?? Number.MAX_SAFE_INTEGER,
      },
    ];
  })
  .sort((left, right) => left.order - right.order);

export function getSidebarItemsForMode(mode: V3BusinessMode) {
  return sidebarRegistry.filter((item) => item.supportedModes.includes(mode));
}

export function getSidebarItemsForRuntimeMode(
  mode: string | null | undefined,
) {
  const normalizedMode = normalizeBusinessMode(mode);

  return normalizedMode ? getSidebarItemsForMode(normalizedMode) : [];
}
