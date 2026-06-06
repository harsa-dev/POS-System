import type { V3ModuleMetadata } from "./module-types";

const customBusinessMode = ["custom-business"] as const;

export const customBusinessModules: readonly V3ModuleMetadata[] = [
  {
    id: "registry",
    label: "Module Registry",
    description: "Planned custom-business module registry workspace for approved module composition.",
    layer: "custom-business",
    status: "planned",
    supportedModes: customBusinessMode,
    routeBase: "/v3/custom-business/registry",
    sidebarGroup: "Custom Business",
    sidebarVisible: true,
    requiredPermissions: ["custom-business.registry.manage"],
    featureFlags: ["custom-business-mode"],
    dependencies: ["auth", "permissions"],
  },
  {
    id: "feature-flags",
    label: "Feature Flags",
    description: "Planned feature flag workspace for enabling compatible custom-business modules.",
    layer: "custom-business",
    status: "planned",
    supportedModes: customBusinessMode,
    routeBase: "/v3/custom-business/feature-flags",
    sidebarGroup: "Custom Business",
    sidebarVisible: true,
    requiredPermissions: ["custom-business.feature-flags.manage"],
    featureFlags: ["custom-business-mode"],
    dependencies: ["registry"],
  },
  {
    id: "config",
    label: "Configuration",
    description: "Planned custom-business configuration workspace for selected modules and settings.",
    layer: "custom-business",
    status: "planned",
    supportedModes: customBusinessMode,
    routeBase: "/v3/custom-business/config",
    sidebarGroup: "Custom Business",
    sidebarVisible: true,
    requiredPermissions: ["custom-business.config.manage"],
    featureFlags: ["custom-business-mode"],
    dependencies: ["registry", "feature-flags"],
  },
] satisfies readonly V3ModuleMetadata[];
