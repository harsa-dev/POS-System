import { businessModules } from "@/app/registry/business-modules";
import type { V3BusinessMode } from "@/app/registry/module-types";
import { businessModeRoutePrefixes } from "@/config/business-modes";
import { ROUTES } from "@/constants/routes";

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

const SAFE_NEXT_ROUTE_PATTERN = /^\/(?!\/)(?!.*(?:^|[/?#])(?:https?:|data:|blob:))/i;

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

export type BusinessModeTransitionRequest = Readonly<{
  targetMode: BusinessModeId;
  source?: BusinessModeChangeSource;
  currentPath?: string | null;
}>;

export type BusinessModeTransitionReason =
  | "selected"
  | "already-active"
  | "not-selectable"
  | "storage-unavailable";

export type BusinessModeTransitionResult = Readonly<{
  success: boolean;
  fromMode: BusinessModeId | null;
  toMode: BusinessModeId;
  route: string;
  shouldRedirect: boolean;
  reason: BusinessModeTransitionReason;
  config: BusinessModeConfig;
  warning?: string;
}>;

export type BusinessModeRouteSupport = Readonly<{
  pathname: string;
  supportedModes: readonly BusinessModeId[];
  isModeScoped: boolean;
  isSharedBusinessRoute: boolean;
  reason: "mode-prefix" | "shared-module" | "unscoped";
}>;

export type BusinessModeRouteAccessCheck = Readonly<{
  canEnter: boolean;
  mode: BusinessModeId;
  config: BusinessModeConfig;
  route: string;
  pathname: string;
  supportedModes: readonly BusinessModeId[];
  isSharedBusinessRoute: boolean;
  reason:
    | "allowed"
    | "missing-active-mode"
    | "required-mode-mismatch"
    | "route-not-supported-by-mode"
    | "mode-not-selectable";
}>;

export type BusinessModeSelectionRedirectRequest = Readonly<{
  targetMode: BusinessModeId;
  nextRoute?: string | null;
  fallbackRoute?: string | null;
}>;

function toBusinessModeIds(modes: readonly V3BusinessMode[]): readonly BusinessModeId[] {
  return modes.filter((mode): mode is BusinessModeId =>
    businessModeRegistry.some((candidate) => candidate.id === mode),
  );
}

function normalizePathname(pathname: string) {
  const cleanPathname = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  if (cleanPathname.length > 1 && cleanPathname.endsWith("/")) {
    return cleanPathname.slice(0, -1);
  }

  return cleanPathname;
}

function matchesAnyPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some((prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix));
}

function isSafeNextRoute(value: string | null | undefined) {
  if (!value) return false;
  if (!SAFE_NEXT_ROUTE_PATTERN.test(value)) return false;

  const normalizedPathname = normalizePathname(value);
  return normalizedPathname !== ROUTES.SELECT_MODE && normalizedPathname !== ROUTES.LOGIN && normalizedPathname !== ROUTES.REGISTER;
}

function getSharedBusinessRouteModes(pathname: string): readonly BusinessModeId[] | null {
  for (const module of businessModules) {
    const routeCandidates = [
      module.routeBase,
      ...(module.sidebarEntries?.map((entry) => entry.routePath) ?? []),
      ...(module.workspaceEntries?.map((entry) => entry.routePath) ?? []),
    ].filter((route): route is string => Boolean(route));

    if (!routeCandidates.some((route) => normalizePathname(route) === pathname)) {
      continue;
    }

    return toBusinessModeIds(module.supportedModes);
  }

  return null;
}

export function getBusinessModeRouteSupport(pathname: string): BusinessModeRouteSupport {
  const normalizedPathname = normalizePathname(pathname);

  if (matchesAnyPrefix(normalizedPathname, businessModeRoutePrefixes.restaurant)) {
    return {
      pathname: normalizedPathname,
      supportedModes: ["restaurant"],
      isModeScoped: true,
      isSharedBusinessRoute: false,
      reason: "mode-prefix",
    };
  }

  if (matchesAnyPrefix(normalizedPathname, businessModeRoutePrefixes.retail)) {
    return {
      pathname: normalizedPathname,
      supportedModes: ["retail"],
      isModeScoped: true,
      isSharedBusinessRoute: false,
      reason: "mode-prefix",
    };
  }

  if (matchesAnyPrefix(normalizedPathname, businessModeRoutePrefixes["raw-material"])) {
    return {
      pathname: normalizedPathname,
      supportedModes: ["raw-material"],
      isModeScoped: true,
      isSharedBusinessRoute: false,
      reason: "mode-prefix",
    };
  }

  const sharedRouteModes = getSharedBusinessRouteModes(normalizedPathname);

  if (sharedRouteModes) {
    return {
      pathname: normalizedPathname,
      supportedModes: sharedRouteModes,
      isModeScoped: false,
      isSharedBusinessRoute: true,
      reason: "shared-module",
    };
  }

  return {
    pathname: normalizedPathname,
    supportedModes: getSelectableBusinessModes().map((mode) => mode.id),
    isModeScoped: false,
    isSharedBusinessRoute: false,
    reason: "unscoped",
  };
}

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

export function getBusinessModeNextRouteFromLocation(location: string) {
  const queryString = location.includes("?") ? location.slice(location.indexOf("?") + 1) : "";
  const nextRoute = new URLSearchParams(queryString).get("next");
  if (!isSafeNextRoute(nextRoute)) return null;

  return nextRoute;
}

export function getSelectModeRoute(nextRoute?: string | null) {
  if (!isSafeNextRoute(nextRoute)) return ROUTES.SELECT_MODE;

  return `${ROUTES.SELECT_MODE}?next=${encodeURIComponent(nextRoute)}`;
}

export function isRouteSupportedByBusinessMode(mode: BusinessModeId, route: string | null | undefined) {
  if (!isSafeNextRoute(route)) return false;
  if (!isBusinessModeSelectable(mode)) return false;

  const routeSupport = getBusinessModeRouteSupport(route);
  return routeSupport.supportedModes.includes(mode);
}

export function getBusinessModeSelectionRedirectRoute({
  targetMode,
  nextRoute = null,
  fallbackRoute = null,
}: BusinessModeSelectionRedirectRequest) {
  if (isRouteSupportedByBusinessMode(targetMode, nextRoute)) {
    return nextRoute;
  }

  return fallbackRoute ?? getBusinessModeEntryRoute(targetMode);
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

export function canEnterBusinessModeRoute({
  pathname,
  requiredMode,
}: {
  pathname: string;
  requiredMode?: BusinessModeId | null;
}): BusinessModeRouteAccessCheck {
  const storageState = readBusinessModeStorage();
  const routeSupport = getBusinessModeRouteSupport(pathname);
  const currentMode = storageState.mode;
  const currentConfig = getBusinessModeConfig(currentMode);
  const requiredModes = requiredMode ? [requiredMode] : routeSupport.supportedModes;
  const supportedModes = requiredMode ? [requiredMode] : routeSupport.supportedModes;

  if (!storageState.storedValue || storageState.wasFallback) {
    return {
      canEnter: false,
      mode: currentMode,
      config: currentConfig,
      route: currentConfig.route,
      pathname: routeSupport.pathname,
      supportedModes,
      isSharedBusinessRoute: routeSupport.isSharedBusinessRoute,
      reason: "missing-active-mode",
    };
  }

  if (!currentConfig.isSelectable) {
    return {
      canEnter: false,
      mode: currentMode,
      config: currentConfig,
      route: currentConfig.route,
      pathname: routeSupport.pathname,
      supportedModes,
      isSharedBusinessRoute: routeSupport.isSharedBusinessRoute,
      reason: "mode-not-selectable",
    };
  }

  if (requiredMode && currentMode !== requiredMode) {
    return {
      canEnter: false,
      mode: currentMode,
      config: currentConfig,
      route: getBusinessModeEntryRoute(requiredMode),
      pathname: routeSupport.pathname,
      supportedModes,
      isSharedBusinessRoute: routeSupport.isSharedBusinessRoute,
      reason: "required-mode-mismatch",
    };
  }

  if (!requiredModes.includes(currentMode)) {
    return {
      canEnter: false,
      mode: currentMode,
      config: currentConfig,
      route: currentConfig.route,
      pathname: routeSupport.pathname,
      supportedModes,
      isSharedBusinessRoute: routeSupport.isSharedBusinessRoute,
      reason: "route-not-supported-by-mode",
    };
  }

  return {
    canEnter: true,
    mode: currentMode,
    config: currentConfig,
    route: currentConfig.route,
    pathname: routeSupport.pathname,
    supportedModes,
    isSharedBusinessRoute: routeSupport.isSharedBusinessRoute,
    reason: "allowed",
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

export function prepareBusinessModeTransition({
  targetMode,
  currentPath = null,
}: BusinessModeTransitionRequest): BusinessModeTransitionResult {
  const config = getBusinessModeConfig(targetMode);
  const state = readBusinessModeStorage();
  const fromMode = state.storedValue && !state.wasFallback ? state.mode : null;
  const route = config.route;
  const normalizedCurrentPath = currentPath ? normalizePathname(currentPath) : null;
  const shouldRedirect = normalizedCurrentPath ? normalizedCurrentPath !== normalizePathname(route) : true;

  if (!config.isSelectable) {
    return {
      success: false,
      fromMode,
      toMode: targetMode,
      route,
      shouldRedirect: false,
      reason: "not-selectable",
      config,
      warning: config.unavailableReason ?? "Business mode is not selectable.",
    };
  }

  if (fromMode === targetMode) {
    return {
      success: true,
      fromMode,
      toMode: targetMode,
      route,
      shouldRedirect,
      reason: "already-active",
      config,
    };
  }

  return {
    success: true,
    fromMode,
    toMode: targetMode,
    route,
    shouldRedirect: true,
    reason: "selected",
    config,
    warning: "Switching business mode clears mode-scoped workspace data and reloads shared dashboards with the selected mode context.",
  };
}

export function commitBusinessModeTransition({
  targetMode,
  source = "system",
  currentPath = null,
}: BusinessModeTransitionRequest): BusinessModeTransitionResult {
  const prepared = prepareBusinessModeTransition({ targetMode, source, currentPath });

  if (!prepared.success) {
    return prepared;
  }

  if (prepared.reason === "already-active") {
    return prepared;
  }

  const didSelectMode = setCurrentBusinessMode(targetMode, source);

  if (!didSelectMode) {
    return {
      ...prepared,
      success: false,
      shouldRedirect: false,
      reason: "storage-unavailable",
      warning: "Business mode storage is not available in this runtime.",
    };
  }

  return prepared;
}

export function switchBusinessMode(
  request: BusinessModeTransitionRequest,
): BusinessModeTransitionResult {
  return commitBusinessModeTransition(request);
}

export function selectBusinessModeWorkspace(
  mode: BusinessModeId,
  source: BusinessModeChangeSource = "system",
): BusinessModeSelectResult {
  const transition = switchBusinessMode({ targetMode: mode, source });

  return {
    success: transition.success,
    mode,
    previousMode: transition.fromMode,
    route: transition.route,
    reason:
      transition.reason === "already-active"
        ? "selected"
        : transition.reason === "not-selectable"
          ? "not-selectable"
          : transition.reason === "storage-unavailable"
            ? "storage-unavailable"
            : "selected",
    config: transition.config,
  };
}

export const businessModeService = {
  getCurrentMode: getCurrentBusinessMode,
  getEntryRoute: getBusinessModeEntryRoute,
  getNextRoute: getBusinessModeNextRouteFromLocation,
  getSelectModeRoute,
  getSelectionRedirectRoute: getBusinessModeSelectionRedirectRoute,
  isRouteSupportedByMode: isRouteSupportedByBusinessMode,
  getRouteSupport: getBusinessModeRouteSupport,
  getWorkspaceState: getBusinessModeWorkspaceState,
  ensureWorkspace: ensureBusinessModeWorkspace,
  prepareTransition: prepareBusinessModeTransition,
  commitTransition: commitBusinessModeTransition,
  switchMode: switchBusinessMode,
  selectWorkspace: selectBusinessModeWorkspace,
  canEnterWorkspace: canEnterBusinessModeWorkspace,
  canEnterRoute: canEnterBusinessModeRoute,
  getSelectableModes: getSelectableBusinessModes,
  getPlannedModes: getPlannedBusinessModes,
  getLockedModes: getLockedBusinessModes,
  clearCurrentMode: clearCurrentBusinessMode,
  subscribe: subscribeToBusinessModeChanges,
} satisfies Readonly<{
  getCurrentMode: typeof getCurrentBusinessMode;
  getEntryRoute: typeof getBusinessModeEntryRoute;
  getNextRoute: typeof getBusinessModeNextRouteFromLocation;
  getSelectModeRoute: typeof getSelectModeRoute;
  getSelectionRedirectRoute: typeof getBusinessModeSelectionRedirectRoute;
  isRouteSupportedByMode: typeof isRouteSupportedByBusinessMode;
  getRouteSupport: typeof getBusinessModeRouteSupport;
  getWorkspaceState: typeof getBusinessModeWorkspaceState;
  ensureWorkspace: typeof ensureBusinessModeWorkspace;
  prepareTransition: typeof prepareBusinessModeTransition;
  commitTransition: typeof commitBusinessModeTransition;
  switchMode: typeof switchBusinessMode;
  selectWorkspace: typeof selectBusinessModeWorkspace;
  canEnterWorkspace: typeof canEnterBusinessModeWorkspace;
  canEnterRoute: typeof canEnterBusinessModeRoute;
  getSelectableModes: typeof getSelectableBusinessModes;
  getPlannedModes: typeof getPlannedBusinessModes;
  getLockedModes: typeof getLockedBusinessModes;
  clearCurrentMode: typeof clearCurrentBusinessMode;
  subscribe: (listener: BusinessModeChangeListener) => () => void;
}>;
