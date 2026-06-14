import {
  V3_BUSINESS_MODES,
  type V3BusinessMode,
} from "./module-types";

export type V3RuntimeBusinessMode = V3BusinessMode;

export function isV3BusinessMode(
  mode: string | null | undefined,
): mode is V3BusinessMode {
  return V3_BUSINESS_MODES.some((candidate) => candidate === mode);
}

export function normalizeBusinessMode(
  mode: string | null | undefined,
): V3BusinessMode | null {
  if (!mode) return null;
  if (isV3BusinessMode(mode)) return mode;

  return null;
}
