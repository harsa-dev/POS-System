import type { V3BusinessMode } from "@/app/registry/module-types";

export const BUSINESS_MODE_STORAGE_KEY = "currentBusinessMode" as const;

export const BUSINESS_MODE_CHANGED_EVENT = "business-mode:changed" as const;

export const businessModeIds = [
  "restaurant",
  "retail",
  "raw-material",
  "custom-business",
] as const satisfies readonly V3BusinessMode[];

export type BusinessModeId = (typeof businessModeIds)[number];

export const businessModeStatuses = [
  "available",
  "planned",
  "disabled",
] as const;

export type BusinessModeStatus = (typeof businessModeStatuses)[number];

export type BusinessModeCategory =
  | "food-and-beverage"
  | "retail"
  | "raw-material"
  | "service";

export type BusinessModeChangeSource =
  | "select-mode"
  | "switcher"
  | "route-guard"
  | "storage"
  | "system";

export type BusinessModeChangeEventDetail = Readonly<{
  mode: BusinessModeId;
  previousMode: BusinessModeId | null;
  source: BusinessModeChangeSource;
}>;

export type BusinessModeConfig = Readonly<{
  id: BusinessModeId;
  label: string;
  shortLabel: string;
  description: string;
  status: BusinessModeStatus;
  category: BusinessModeCategory;
  route: string;
  storageKey: typeof BUSINESS_MODE_STORAGE_KEY;
  isDefault: boolean;
  isSelectable: boolean;
  badgeLabel: string;
  primaryModules: readonly string[];
  plannedModules: readonly string[];
  unavailableReason?: string;
}>;
