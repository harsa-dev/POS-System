import {
  businessModeRegistry,
  getBusinessModeConfig,
  isBusinessModeId,
  isBusinessModeSelectable,
} from "@/components/core/business-mode/business-mode-registry";
import type {
  BusinessModeConfig,
  BusinessModeId,
} from "@/components/core/business-mode/business-mode.types";
import { getCurrentBusinessMode } from "@/components/core/business-mode/business-mode-storage";

export type SharedDashboardSurfaceId =
  | "business-overview"
  | "sales"
  | "customers"
  | "inventory"
  | "cashflow"
  | "financial-reports"
  | "invoice"
  | "cashier-shift-reports"
  | "hpp"
  | "operation-reports"
  | "team-management"
  | "roster-overview"
  | "employee-performance"
  | "audit-log"
  | "approvals"
  | "contracts"
  | "attendance"
  | "payroll"
  | "platform-monitoring";

export type SharedDashboardSupportStatus =
  | "supported"
  | "read-only"
  | "preview"
  | "planned"
  | "unsupported";

export type SharedDashboardModeContext = {
  surfaceId: SharedDashboardSurfaceId;
  activeMode: BusinessModeId;
  activeModeLabel: string;
  activeModeShortLabel: string;
  activeModeRoute: string;
  supportStatus: SharedDashboardSupportStatus;
  supportStatusLabel: string;
  supportedModes: BusinessModeId[];
  supportedModeLabels: string[];
  isSupported: boolean;
  isSelectable: boolean;
  queryScopeKey: `${SharedDashboardSurfaceId}:${BusinessModeId}`;
  apiModeHeader: BusinessModeId;
  emptyStateMessage: string | null;
};

const allSelectableModes = businessModeRegistry
  .filter((mode) => mode.isSelectable)
  .map((mode) => mode.id);

const allBusinessModes = businessModeRegistry.map((mode) => mode.id);

const supportStatusLabels: Record<SharedDashboardSupportStatus, string> = {
  supported: "Supported",
  "read-only": "Read-only",
  preview: "Preview",
  planned: "Planned",
  unsupported: "Unsupported",
};

const sharedDashboardModeSupport: Record<
  SharedDashboardSurfaceId,
  Record<BusinessModeId, SharedDashboardSupportStatus>
> = {
  "business-overview": {
    restaurant: "read-only",
    retail: "read-only",
    "raw-material": "read-only",
    "custom-business": "planned",
  },
  sales: {
    restaurant: "read-only",
    retail: "read-only",
    "raw-material": "read-only",
    "custom-business": "planned",
  },
  customers: {
    restaurant: "read-only",
    retail: "read-only",
    "raw-material": "read-only",
    "custom-business": "planned",
  },
  inventory: {
    restaurant: "read-only",
    retail: "read-only",
    "raw-material": "read-only",
    "custom-business": "planned",
  },
  cashflow: {
    restaurant: "read-only",
    retail: "read-only",
    "raw-material": "unsupported",
    "custom-business": "planned",
  },
  "financial-reports": {
    restaurant: "read-only",
    retail: "read-only",
    "raw-material": "unsupported",
    "custom-business": "planned",
  },
  invoice: {
    restaurant: "read-only",
    retail: "read-only",
    "raw-material": "unsupported",
    "custom-business": "planned",
  },
  "cashier-shift-reports": {
    restaurant: "read-only",
    retail: "read-only",
    "raw-material": "read-only",
    "custom-business": "unsupported",
  },
  hpp: {
    restaurant: "preview",
    retail: "preview",
    "raw-material": "unsupported",
    "custom-business": "planned",
  },
  "operation-reports": {
    restaurant: "read-only",
    retail: "read-only",
    "raw-material": "read-only",
    "custom-business": "planned",
  },
  "team-management": {
    restaurant: "read-only",
    retail: "read-only",
    "raw-material": "read-only",
    "custom-business": "planned",
  },
  "roster-overview": {
    restaurant: "planned",
    retail: "preview",
    "raw-material": "unsupported",
    "custom-business": "unsupported",
  },
  "employee-performance": {
    restaurant: "planned",
    retail: "read-only",
    "raw-material": "read-only",
    "custom-business": "planned",
  },
  "audit-log": {
    restaurant: "read-only",
    retail: "read-only",
    "raw-material": "unsupported",
    "custom-business": "planned",
  },
  approvals: {
    restaurant: "read-only",
    retail: "read-only",
    "raw-material": "read-only",
    "custom-business": "planned",
  },
  contracts: {
    restaurant: "planned",
    retail: "preview",
    "raw-material": "unsupported",
    "custom-business": "unsupported",
  },
  attendance: {
    restaurant: "planned",
    retail: "preview",
    "raw-material": "unsupported",
    "custom-business": "unsupported",
  },
  payroll: {
    restaurant: "planned",
    retail: "preview",
    "raw-material": "unsupported",
    "custom-business": "unsupported",
  },
  "platform-monitoring": {
    restaurant: "read-only",
    retail: "unsupported",
    "raw-material": "unsupported",
    "custom-business": "unsupported",
  },
};

function getModeLabel(mode: BusinessModeId) {
  const config = getBusinessModeConfig(mode);
  return config.label;
}

function getModeShortLabel(config: BusinessModeConfig) {
  return config.shortLabel ?? config.label;
}

export function getSharedDashboardSupportStatus(
  surfaceId: SharedDashboardSurfaceId,
  mode: BusinessModeId,
): SharedDashboardSupportStatus {
  return sharedDashboardModeSupport[surfaceId]?.[mode] ?? "unsupported";
}

function isDashboardStatusAvailable(status: SharedDashboardSupportStatus) {
  return status !== "unsupported";
}

function getModeLabelWithSupport(surfaceId: SharedDashboardSurfaceId, mode: BusinessModeId) {
  const status = getSharedDashboardSupportStatus(surfaceId, mode);
  return `${getModeLabel(mode)} (${supportStatusLabels[status]})`;
}

export function getSharedDashboardSupportedModes(surfaceId: SharedDashboardSurfaceId) {
  return allBusinessModes.filter((mode) =>
    isDashboardStatusAvailable(getSharedDashboardSupportStatus(surfaceId, mode)),
  );
}

export function getSharedDashboardModeContext(surfaceId: SharedDashboardSurfaceId): SharedDashboardModeContext {
  const rawMode = getCurrentBusinessMode();
  const activeMode = isBusinessModeId(rawMode) ? rawMode : "restaurant";
  const activeModeConfig = getBusinessModeConfig(activeMode);
  const supportStatus = getSharedDashboardSupportStatus(surfaceId, activeMode);
  const supportedModes = getSharedDashboardSupportedModes(surfaceId);
  const isSupported = isDashboardStatusAvailable(supportStatus);
  const isSelectable = isBusinessModeSelectable(activeMode);
  const supportedModeLabels = supportedModes.map((mode) =>
    getModeLabelWithSupport(surfaceId, mode),
  );
  const emptyStateMessage =
    isSupported && isSelectable
      ? null
      : isSupported
        ? `${activeModeConfig.label} is planned or guarded for this shared dashboard. Supported modes: ${supportedModeLabels.join(", ")}.`
        : `${activeModeConfig.label} is not available for this shared dashboard. Supported modes: ${supportedModeLabels.join(", ")}.`;

  return {
    surfaceId,
    activeMode,
    activeModeLabel: activeModeConfig.label,
    activeModeShortLabel: getModeShortLabel(activeModeConfig),
    activeModeRoute: activeModeConfig.route,
    supportStatus,
    supportStatusLabel: supportStatusLabels[supportStatus],
    supportedModes,
    supportedModeLabels,
    isSupported,
    isSelectable,
    queryScopeKey: `${surfaceId}:${activeMode}`,
    apiModeHeader: activeMode,
    emptyStateMessage,
  };
}
