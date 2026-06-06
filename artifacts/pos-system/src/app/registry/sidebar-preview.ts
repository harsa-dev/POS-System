import { currentSidebarSnapshot } from "./sidebar-current-snapshot";
import {
  getSidebarItemsForRuntimeMode,
  sidebarRegistry,
} from "./sidebar-registry";
import type { V3RuntimeRole, V3SidebarItem } from "./module-types";

export type SidebarPreviewItem = Readonly<{
  key: string;
  label: string;
  routePath: string;
  group: string;
  roles: readonly V3RuntimeRole[];
  order: number;
}>;

export function getCurrentSidebarPreview() {
  return currentSidebarSnapshot.map(
    (item): SidebarPreviewItem => ({
      key: item.routePath,
      label: item.label,
      routePath: item.routePath,
      group: item.group,
      roles: item.roles,
      order: item.order,
    }),
  );
}

function toPreviewItem(item: V3SidebarItem): SidebarPreviewItem {
  return {
    key: item.routePath,
    label: item.label,
    routePath: item.routePath,
    group: item.group,
    roles: item.requiredRoles,
    order: item.order,
  };
}

export function getGeneratedSidebarPreviewForRuntimeMode(
  mode: string | null | undefined,
) {
  return getSidebarItemsForRuntimeMode(mode).map(toPreviewItem);
}

export function getGeneratedSidebarPreview() {
  return sidebarRegistry.map(toPreviewItem);
}
