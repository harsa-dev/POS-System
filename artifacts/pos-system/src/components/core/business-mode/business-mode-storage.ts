import {
  BUSINESS_MODE_CHANGED_EVENT,
  BUSINESS_MODE_STORAGE_KEY,
  legacyStoredBusinessModeMap,
  type BusinessModeChangeEventDetail,
  type BusinessModeChangeSource,
  type BusinessModeId,
} from "@/config/business-modes";
import {
  defaultBusinessModeId,
  getBusinessModeConfig,
  isBusinessModeSelectable,
  normalizeBusinessModeId,
} from "./business-mode-registry";

type LegacyBusinessModeId = keyof typeof legacyStoredBusinessModeMap;

type NormalizedBusinessMode = Readonly<{
  mode: BusinessModeId | null;
  wasLegacy: boolean;
}>;

export type BusinessModeStorageState = Readonly<{
  mode: BusinessModeId;
  storedValue: string | null;
  previousMode: BusinessModeId | null;
  wasFallback: boolean;
  wasLegacy: boolean;
  isSelectable: boolean;
}>;

export type BusinessModeChangeListener = (
  detail: BusinessModeChangeEventDetail,
) => void;

function getBrowserWindow(): Window | null {
  if (typeof window === "undefined") return null;
  return window;
}

function isLegacyBusinessModeId(value: string): value is LegacyBusinessModeId {
  return Object.prototype.hasOwnProperty.call(legacyStoredBusinessModeMap, value);
}

function normalizeStoredBusinessMode(value: string | null): NormalizedBusinessMode {
  const normalizedMode = normalizeBusinessModeId(value);

  if (normalizedMode) {
    return {
      mode: normalizedMode,
      wasLegacy: false,
    };
  }

  if (value && isLegacyBusinessModeId(value)) {
    return {
      mode: legacyStoredBusinessModeMap[value],
      wasLegacy: true,
    };
  }

  return {
    mode: null,
    wasLegacy: false,
  };
}

function getSelectableModeOrDefault(mode: BusinessModeId | null): BusinessModeId {
  if (mode && isBusinessModeSelectable(mode)) return mode;
  return defaultBusinessModeId;
}

export function getRawStoredBusinessMode(): string | null {
  const browserWindow = getBrowserWindow();
  if (!browserWindow) return null;

  return browserWindow.localStorage.getItem(BUSINESS_MODE_STORAGE_KEY);
}

export function getCurrentBusinessMode(): BusinessModeId {
  const { mode } = readBusinessModeStorage();
  return mode;
}

export function readBusinessModeStorage(): BusinessModeStorageState {
  const storedValue = getRawStoredBusinessMode();
  const normalized = normalizeStoredBusinessMode(storedValue);
  const mode = getSelectableModeOrDefault(normalized.mode);
  const isSelectable = normalized.mode
    ? isBusinessModeSelectable(normalized.mode)
    : false;

  return {
    mode,
    storedValue,
    previousMode: normalized.mode,
    wasFallback: normalized.mode !== mode,
    wasLegacy: normalized.wasLegacy,
    isSelectable,
  };
}

export function repairBusinessModeStorage(
  source: BusinessModeChangeSource = "storage",
): BusinessModeId {
  const browserWindow = getBrowserWindow();
  const state = readBusinessModeStorage();

  if (!browserWindow) return state.mode;

  const shouldRepair =
    state.storedValue !== state.mode || state.wasFallback || state.wasLegacy;

  if (shouldRepair) {
    browserWindow.localStorage.setItem(BUSINESS_MODE_STORAGE_KEY, state.mode);
    dispatchBusinessModeChanged({
      mode: state.mode,
      previousMode: state.previousMode,
      source,
    });
  }

  return state.mode;
}

export function setCurrentBusinessMode(
  mode: BusinessModeId,
  source: BusinessModeChangeSource = "storage",
): boolean {
  const browserWindow = getBrowserWindow();
  if (!browserWindow) return false;

  if (!isBusinessModeSelectable(mode)) {
    return false;
  }

  const previousMode = readBusinessModeStorage().mode;

  browserWindow.localStorage.setItem(BUSINESS_MODE_STORAGE_KEY, mode);

  if (previousMode !== mode) {
    dispatchBusinessModeChanged({
      mode,
      previousMode,
      source,
    });
  }

  return true;
}

export function clearCurrentBusinessMode(
  source: BusinessModeChangeSource = "storage",
): void {
  const browserWindow = getBrowserWindow();
  if (!browserWindow) return;

  const previousMode = readBusinessModeStorage().mode;
  browserWindow.localStorage.removeItem(BUSINESS_MODE_STORAGE_KEY);

  dispatchBusinessModeChanged({
    mode: defaultBusinessModeId,
    previousMode,
    source,
  });
}

export function canActivateBusinessMode(mode: BusinessModeId): boolean {
  return getBusinessModeConfig(mode).isSelectable;
}

export function dispatchBusinessModeChanged(
  detail: BusinessModeChangeEventDetail,
): void {
  const browserWindow = getBrowserWindow();
  if (!browserWindow) return;

  browserWindow.dispatchEvent(
    new CustomEvent<BusinessModeChangeEventDetail>(
      BUSINESS_MODE_CHANGED_EVENT,
      {
        detail,
      },
    ),
  );
}

export function subscribeToBusinessModeChanges(
  listener: BusinessModeChangeListener,
): () => void {
  const browserWindow = getBrowserWindow();

  if (!browserWindow) {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<BusinessModeChangeEventDetail>;
    listener(customEvent.detail);
  };

  browserWindow.addEventListener(BUSINESS_MODE_CHANGED_EVENT, handler);

  return () => {
    browserWindow.removeEventListener(BUSINESS_MODE_CHANGED_EVENT, handler);
  };
}
