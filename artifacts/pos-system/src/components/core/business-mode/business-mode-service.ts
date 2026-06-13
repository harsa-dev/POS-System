import {
  businessModeRegistry,
  defaultBusinessModeId,
  getBusinessModeConfig,
  getBusinessModesByStatus,
  getDefaultBusinessModeConfig,
  isBusinessModeId,
  isBusinessModeSelectable,
  normalizeBusinessModeId,
  plannedBusinessModeIds,
  selectableBusinessModeIds,
} from "./business-mode-registry";
import {
  canActivateBusinessMode,
  clearCurrentBusinessMode,
  getCurrentBusinessMode,
  getRawStoredBusinessMode,
  readBusinessModeStorage,
  repairBusinessModeStorage,
  setCurrentBusinessMode,
  subscribeToBusinessModeChanges,
  type BusinessModeChangeListener,
  type BusinessModeStorageState,
} from "./business-mode-storage";
import type {
  BusinessModeChangeSource,
  BusinessModeConfig,
  BusinessModeId,
  BusinessModeStatus,
} from "./business-mode.types";

export type BusinessModeWorkspaceState = Readonly<{
  activeMode: BusinessModeConfig;
  storage: BusinessModeStorageState;
  shouldSelectMode: boolean;
}>;

export type BusinessModeActivationResult = Readonly<{
  success: boolean;
  mode: BusinessModeId;
  previousMode: BusinessModeId | null;
  route: string;
  reason?: string;
}>;

function getBusinessModeWorkspaceState(): BusinessModeWorkspaceState {
  const storage = readBusinessModeStorage();
  const activeMode = getBusinessModeConfig(storage.mode);

  return {
    activeMode,
    storage,
    shouldSelectMode: !storage.storedValue || storage.wasFallback,
  };
}

function getBusinessModeRoute(mode: BusinessModeId): string {
  return getBusinessModeConfig(mode).route;
}

function activateBusinessMode(
  mode: BusinessModeId,
  source: BusinessModeChangeSource = "system",
): BusinessModeActivationResult {
  const previousMode = readBusinessModeStorage().mode;
  const config = getBusinessModeConfig(mode);

  if (!config.isSelectable) {
    return {
      success: false,
      mode,
      previousMode,
      route: config.route,
      reason: config.unavailableReason ?? `${config.label} is not selectable.`,
    };
  }

  const success = setCurrentBusinessMode(mode, source);

  return {
    success,
    mode,
    previousMode,
    route: config.route,
  };
}

function repairBusinessModeWorkspace(
  source: BusinessModeChangeSource = "system",
): BusinessModeWorkspaceState {
  repairBusinessModeStorage(source);
  return getBusinessModeWorkspaceState();
}

export const businessModeService = {
  registry: businessModeRegistry,
  defaultModeId: defaultBusinessModeId,
  selectableModeIds: selectableBusinessModeIds,
  plannedModeIds: plannedBusinessModeIds,

  getRegistry: () => businessModeRegistry,
  getSelectableModes: () => getBusinessModesByStatus("available"),
  getPlannedModes: () => getBusinessModesByStatus("planned"),
  getModesByStatus: (status: BusinessModeStatus) => getBusinessModesByStatus(status),

  isModeId: isBusinessModeId,
  normalizeModeId: normalizeBusinessModeId,
  canActivate: canActivateBusinessMode,
  isSelectable: isBusinessModeSelectable,

  getConfig: getBusinessModeConfig,
  getDefaultConfig: getDefaultBusinessModeConfig,
  getRoute: getBusinessModeRoute,

  getRawStoredMode: getRawStoredBusinessMode,
  getCurrentMode: getCurrentBusinessMode,
  getStorageState: readBusinessModeStorage,
  getWorkspaceState: getBusinessModeWorkspaceState,

  repairWorkspace: repairBusinessModeWorkspace,
  setCurrentMode: setCurrentBusinessMode,
  activateMode: activateBusinessMode,
  clearCurrentMode: clearCurrentBusinessMode,
  subscribe: subscribeToBusinessModeChanges,
} as const;

export type { BusinessModeChangeListener, BusinessModeStorageState };
