import { moduleRegistry } from "./module-registry";
import type {
  V3BusinessMode,
  V3ModuleMetadata,
  V3WorkspaceMetadata,
} from "./module-types";

type RoutedWorkspaceModule = V3ModuleMetadata & {
  routeBase: string;
};

function isRoutedWorkspaceModule(
  module: V3ModuleMetadata,
): module is RoutedWorkspaceModule {
  return module.status === "active" && module.routeBase !== null;
}

export const workspaceRegistry = moduleRegistry
  .filter(isRoutedWorkspaceModule)
  .map(
    (module): V3WorkspaceMetadata => ({
      id: module.id,
      moduleId: module.id,
      label: module.label,
      description: module.description,
      routePath: module.routeBase,
      layer: module.layer,
      supportedModes: module.supportedModes,
      requiredPermissions: module.requiredPermissions,
      featureFlags: module.featureFlags,
      dependencies: module.dependencies,
    }),
  );

export function getWorkspacesForMode(mode: V3BusinessMode) {
  return workspaceRegistry.filter((workspace) =>
    workspace.supportedModes.includes(mode),
  );
}
