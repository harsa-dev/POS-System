import {
  BUSINESS_MODE_STORAGE_KEY,
  type BusinessModeId,
} from "../business-mode/business-mode.types";
import {
  businessModeRegistry,
  getBusinessModeConfig,
  isBusinessModeId,
} from "../business-mode/business-mode-registry";
import {
  clearCurrentBusinessMode,
  getRawStoredBusinessMode,
  readBusinessModeStorage,
  repairBusinessModeStorage,
  setCurrentBusinessMode,
} from "../business-mode/business-mode-storage";

export { BUSINESS_MODE_STORAGE_KEY };

export type BusinessMode = BusinessModeId;

export type BusinessModeOption = {
  id: BusinessMode;
  label: string;
  description: string;
};

export const businessModeOptions: BusinessModeOption[] = businessModeRegistry.map(
  (mode) => ({
    id: mode.id,
    label: mode.label,
    description: mode.description,
  }),
);

export function isBusinessMode(value: string | null): value is BusinessMode {
  return isBusinessModeId(value);
}

export function getStoredBusinessMode(): BusinessMode | null {
  if (typeof window === "undefined") return null;

  const state = readBusinessModeStorage();

  if (state.wasLegacy) {
    repairBusinessModeStorage("route-guard");
    return state.mode;
  }

  if (!state.storedValue || state.wasFallback) {
    return null;
  }

  return state.mode;
}

export function getStoredBusinessModeEntryRoute(): string | null {
  const mode = getStoredBusinessMode();
  if (!mode) return null;

  return getBusinessModeConfig(mode).route;
}

export function setStoredBusinessMode(mode: BusinessMode): boolean {
  return setCurrentBusinessMode(mode, "route-guard");
}

export function clearStoredBusinessMode() {
  clearCurrentBusinessMode("route-guard");
}

export function getRawBusinessModeStorageValue(): string | null {
  return getRawStoredBusinessMode();
}
