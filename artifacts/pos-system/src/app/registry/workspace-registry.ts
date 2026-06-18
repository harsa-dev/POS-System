import { moduleRegistry } from "./module-registry";
import type {
  V3BusinessMode,
  V3ModuleId,
  V3ModuleMetadata,
  V3WorkspaceRegistration,
  V3WorkspaceMetadata,
} from "./module-types";

type RoutedWorkspaceModule = V3ModuleMetadata & {
  workspaceRoute: string;
};

function isRoutedWorkspaceModule(
  module: V3ModuleMetadata,
): module is RoutedWorkspaceModule {
  return module.status === "active" && typeof module.workspaceRoute === "string";
}

function createRegisteredWorkspace(
  workspace: V3WorkspaceRegistration,
): V3WorkspaceMetadata {
  const workspaceRoute = workspace.workspaceRoute ?? workspace.routePath;

  return {
    ...workspace,
    routePath: workspaceRoute,
    currentRoute: workspace.currentRoute ?? null,
    workspaceRoute,
    order: workspace.order ?? Number.MAX_SAFE_INTEGER,
  };
}

export const workspaceRegistry = moduleRegistry
  .flatMap((module): V3WorkspaceMetadata[] => {
    const registeredWorkspaces =
      module.workspaceEntries?.map(createRegisteredWorkspace) ?? [];

    if (!isRoutedWorkspaceModule(module)) {
      return registeredWorkspaces;
    }

    return [
      ...registeredWorkspaces,
      {
        id: module.id,
        moduleId: module.id,
        label: module.workspaceLabel ?? module.label,
        description: module.description,
        routePath: module.workspaceRoute,
        currentRoute: module.routeBase,
        workspaceRoute: module.workspaceRoute,
        layer: module.layer,
        supportedModes: module.supportedModes,
        requiredPermissions: module.requiredPermissions,
        featureFlags: module.featureFlags,
        dependencies: module.dependencies,
        order: module.workspaceOrder ?? Number.MAX_SAFE_INTEGER,
      },
    ];
  })
  .sort((left, right) => left.order - right.order);

export function getWorkspacesForMode(mode: V3BusinessMode) {
  return workspaceRegistry.filter((workspace) =>
    workspace.supportedModes.includes(mode),
  );
}

export function getWorkspaceRouteForModule(moduleId: V3ModuleId) {
  return (
    workspaceRegistry.find((workspace) => workspace.moduleId === moduleId)
      ?.workspaceRoute ?? null
  );
}

export function getWorkspaceRoutesForMode(mode: V3BusinessMode) {
  return getWorkspacesForMode(mode).map((workspace) => ({
    moduleId: workspace.moduleId,
    routePath: workspace.workspaceRoute,
    currentRoute: workspace.currentRoute,
  }));
}
