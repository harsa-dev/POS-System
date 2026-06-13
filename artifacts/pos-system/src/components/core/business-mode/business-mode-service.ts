import {
  businessModeRegistry,
  getBusinessModeConfig,
  getBusinessModesByStatus,
  isBusinessModeSelectable,
} from "./business-mode-registry";
import {
  clearCurrentBusinessMode,
  getCurrentBusinessMode,
  readBusinessModeStorage,
  repairBusinessModeStorage,
  setCurrentBusinessMode,
  subscribeToBusinessModeChanges,
  type BusinessModeStorageState,
} from "./business-mode-storage";
import type {
  BusinessModeChangeListener,
  BusinessModeChangeSource,
  BusinessModeConfig,
  BusinessModeId,
} from "./business-mode.types";

export type BusinessModeWorkspaceState = Readonly<{
  currentMode: BusinessModeId;
  currentModeConfig: BusinessModeConfig;
  entryRoute: string;
  rawStoredValue: string | null;
  previousMode: BusinessModeId | null;
  wasFallback: boolean;
  wasLegacy: boolean;
  isSelectable: boolean;
  modes: readonly BusinessModeConfig[];
  selectableModes: readonly BusinessModeConfig[];
  plannedModes: readonly BusinessModeConfig[];
  lockedModes: readonly BusinessModeConfig[];
  storageState: BusinessModeStorageState;
}>;

export type BusinessModeAccessCheck = Readonly<{
  mode: BusinessModeId;
  config: BusinessModeConfig;
  canEnter: boolean;
  route: string;
  reason: string | null;
}>;

export type BusinessModeSelectResult = Readonly<{
  success: boolean;
  mode: BusinessModeId;
  previousMode: BusinessModeId | null;
  route: string;
  reason: "selected" | "not-selectable" | "storage-unavailable";
  config: BusinessModeConfig;
}>;

export function getSelectableBusinessModes(): readonly BusinessModeConfig[] {
  return businessModeRegistry.filter((mode) => mode.isSelectable);
}

export function getPlannedBusinessModes(): readonly BusinessModeConfig[] {
  return getBusinessModesByStatus("planned");
}

export function getLockedBusinessModes(): readonly BusinessModeConfig[] {
  return businessModeRegistry.filter((mode) => !mode.isSelectable);
}

export function getBusinessModeEntryRoute(mode?: BusinessModeId | null): string {
  const resolvedMode = mode ?? getCurrentBusinessMode();

  return getBusinessModeConfig(resolvedMode).route;
}

export function canEnterBusinessModeWorkspace(
  mode: BusinessModeId,
): BusinessModeAccessCheck {
  const config = getBusinessModeConfig(mode);
  const canEnter = isBusinessModeSelectable(mode);

  return {
    mode,
    config,
    canEnter,
    route: config.route,
    reason: canEnter ? null : config.unavailableReason ?? "Business mode is not selectable.",
  };
}

export function getBusinessModeWorkspaceState(): BusinessModeWorkspaceState {
  const storageState = readBusinessModeStorage();
  const currentModeConfig = getBusinessModeConfig(storageState.mode);

  return {
    currentMode: storageState.mode,
    currentModeConfig,
    entryRoute: currentModeConfig.route,
    rawStoredValue: storageState.storedValue,
    previousMode: storageState.previousMode,
    wasFallback: storageState.wasFallback,
    wasLegacy: storageState.wasLegacy,
    isSelectable: storageState.isSelectable,
    modes: businessModeRegistry,
    selectableModes: getSelectableBusinessModes(),
    plannedModes: getPlannedBusinessModes(),
    lockedModes: getLockedBusinessModes(),
    storageState,
  };
}

export function ensureBusinessModeWorkspace(
  source: BusinessModeChangeSource = "system",
): BusinessModeWorkspaceState {
  repairBusinessModeStorage(source);

  return getBusinessModeWorkspaceState();
}

export function selectBusinessModeWorkspace(
  mode: BusinessModeId,
  source: BusinessModeChangeSource = "system",
): BusinessModeSelectResult {
  const config = getBusinessModeConfig(mode);
  const previousMode = readBusinessModeStorage().mode;

  if (!config.isSelectable) {
    return {
      success: false,
      mode,
      previousMode,
      route: config.route,
      reason: "not-selectable",
      config,
    };
  }

  const didSelectMode = setCurrentBusinessMode(mode, source);

  return {
    success: didSelectMode,
    mode,
    previousMode,
    route: config.route,
    reason: didSelectMode ? "selected" : "storage-unavailable",
    config,
  };
}

export const businessModeService = {
  getCurrentMode: getCurrentBusinessMode,
  getEntryRoute: getBusinessModeEntryRoute,
  getWorkspaceState: getBusinessModeWorkspaceState,
  ensureWorkspace: ensureBusinessModeWorkspace,
  selectWorkspace: selectBusinessModeWorkspace,
  canEnterWorkspace: canEnterBusinessModeWorkspace,
  getSelectableModes: getSelectableBusinessModes,
  getPlannedModes: getPlannedBusinessModes,
  getLockedModes: getLockedBusinessModes,
  clearCurrentMode: clearCurrentBusinessMode,
  subscribe: subscribeToBusinessModeChanges,
} satisfies Readonly<{
  getCurrentMode: typeof getCurrentBusinessMode;
  getEntryRoute: typeof getBusinessModeEntryRoute;
  getWorkspaceState: typeof getBusinessModeWorkspaceState;
  ensureWorkspace: typeof ensureBusinessModeWorkspace;
  selectWorkspace: typeof selectBusinessModeWorkspace;
  canEnterWorkspace: typeof canEnterBusinessModeWorkspace;
  getSelectableModes: typeof getSelectableBusinessModes;
  getPlannedModes: typeof getPlannedBusinessModes;
  getLockedModes: typeof getLockedBusinessModes;
  clearCurrentMode: typeof clearCurrentBusinessMode;
  subscribe: (listener: BusinessModeChangeListener) => () => void;
}>;
