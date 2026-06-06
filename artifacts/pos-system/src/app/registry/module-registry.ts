import { businessModules } from "./business-modules";
import { coreModules } from "./core-modules";
import { customBusinessModules } from "./custom-business-modules";
import type {
  V3BusinessMode,
  V3ModuleId,
  V3ModuleMetadata,
} from "./module-types";
import { rawMaterialModules } from "./raw-material-modules";
import { restaurantModules } from "./restaurant-modules";
import { retailModules } from "./retail-modules";

export const moduleRegistry: readonly V3ModuleMetadata[] = [
  ...coreModules,
  ...businessModules,
  ...restaurantModules,
  ...retailModules,
  ...rawMaterialModules,
  ...customBusinessModules,
];

export function getModulesByMode(mode: V3BusinessMode) {
  return moduleRegistry.filter(
    (module) =>
      module.status !== "deprecated" && module.supportedModes.includes(mode),
  );
}

export function getActiveModules() {
  return moduleRegistry.filter((module) => module.status === "active");
}

export function isModuleEnabled(
  moduleId: V3ModuleId,
  enabledModules: readonly V3ModuleId[],
) {
  return enabledModules.includes(moduleId);
}
