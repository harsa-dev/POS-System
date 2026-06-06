import {
  V3_BUSINESS_MODES,
  type V3BusinessMode,
  type V3LegacyBusinessMode,
} from "./module-types";

export type V3RuntimeBusinessMode = V3BusinessMode | V3LegacyBusinessMode;

export function isV3BusinessMode(
  mode: string | null | undefined,
): mode is V3BusinessMode {
  return V3_BUSINESS_MODES.some((candidate) => candidate === mode);
}

export function normalizeBusinessMode(
  mode: string | null | undefined,
): V3BusinessMode | null {
  if (!mode) return null;
  if (mode === "fnb") return "restaurant";
  if (isV3BusinessMode(mode)) return mode;

  return null;
}
