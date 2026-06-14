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
} from "../business-mode/business-mode-storage";
import { businessModeService } from "../business-mode/business-mode-service";

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

export function canEnterStoredBusinessModeRoute({
  pathname,
  requiredMode,
}: {
  pathname: string;
  requiredMode?: BusinessMode | null;
}) {
  return businessModeService.canEnterRoute({ pathname, requiredMode });
}

export function setStoredBusinessMode(mode: BusinessMode): boolean {
  return businessModeService.switchMode({
    targetMode: mode,
    source: "route-guard",
  }).success;
}

export function clearStoredBusinessMode() {
  clearCurrentBusinessMode("route-guard");
}

export function getRawBusinessModeStorageValue(): string | null {
  return getRawStoredBusinessMode();
}
