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

export type SharedDashboardModeContext = {
  surfaceId: SharedDashboardSurfaceId;
  activeMode: BusinessModeId;
  activeModeLabel: string;
  activeModeShortLabel: string;
  activeModeRoute: string;
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
const selectableModesWithoutRawMaterial = allSelectableModes.filter(
  (mode) => mode !== "raw-material",
);

const sharedDashboardSupportedModes: Record<SharedDashboardSurfaceId, BusinessModeId[]> = {
  "business-overview": allSelectableModes,
  sales: ["restaurant", "retail"],
  customers: allSelectableModes,
  inventory: allSelectableModes,
  cashflow: selectableModesWithoutRawMaterial,
  "financial-reports": selectableModesWithoutRawMaterial,
  invoice: ["restaurant", "retail", "custom-business"],
  "cashier-shift-reports": ["restaurant", "retail", "raw-material"],
  hpp: ["restaurant"],
  "operation-reports": allSelectableModes,
  "team-management": allSelectableModes,
  "roster-overview": selectableModesWithoutRawMaterial,
  "employee-performance": allSelectableModes,
  "audit-log": selectableModesWithoutRawMaterial,
  approvals: allSelectableModes,
  contracts: selectableModesWithoutRawMaterial,
  attendance: selectableModesWithoutRawMaterial,
  payroll: selectableModesWithoutRawMaterial,
  "platform-monitoring": ["restaurant"],
};

function getModeLabel(mode: BusinessModeId) {
  const config = getBusinessModeConfig(mode);
  return config.label;
}

function getModeShortLabel(config: BusinessModeConfig) {
  return config.shortLabel ?? config.label;
}

export function getSharedDashboardSupportedModes(surfaceId: SharedDashboardSurfaceId) {
  return sharedDashboardSupportedModes[surfaceId] ?? allSelectableModes;
}

export function getSharedDashboardModeContext(surfaceId: SharedDashboardSurfaceId): SharedDashboardModeContext {
  const rawMode = getCurrentBusinessMode();
  const activeMode = isBusinessModeId(rawMode) ? rawMode : "restaurant";
  const activeModeConfig = getBusinessModeConfig(activeMode);
  const supportedModes = getSharedDashboardSupportedModes(surfaceId);
  const isSupported = supportedModes.includes(activeMode);
  const isSelectable = isBusinessModeSelectable(activeMode);
  const supportedModeLabels = supportedModes.map(getModeLabel);

  return {
    surfaceId,
    activeMode,
    activeModeLabel: activeModeConfig.label,
    activeModeShortLabel: getModeShortLabel(activeModeConfig),
    activeModeRoute: activeModeConfig.route,
    supportedModes,
    supportedModeLabels,
    isSupported,
    isSelectable,
    queryScopeKey: `${surfaceId}:${activeMode}`,
    apiModeHeader: activeMode,
    emptyStateMessage:
      isSupported && isSelectable
        ? null
        : `${activeModeConfig.label} is not available for this shared dashboard. Supported modes: ${supportedModeLabels.join(", ")}.`,
  };
}
