import {
  businessModeConfigs,
  businessModeIds,
  type BusinessModeConfig,
  type BusinessModeId,
  type BusinessModeStatus,
} from "@/config/business-modes";

export const defaultBusinessModeId = "restaurant" satisfies BusinessModeId;

export const businessModeRegistry = businessModeConfigs;

export const selectableBusinessModeIds = businessModeRegistry.filter((mode) => mode.isSelectable).map((mode) => mode.id);

export const plannedBusinessModeIds = businessModeRegistry.filter((mode) => mode.status === "planned").map((mode) => mode.id);

export function isBusinessModeId(value: unknown): value is BusinessModeId {
  return typeof value === "string" && businessModeIds.some((businessModeId) => businessModeId === value);
}

export function getBusinessModeConfig(mode: BusinessModeId): BusinessModeConfig {
  return businessModeRegistry.find((candidate) => candidate.id === mode) ?? getDefaultBusinessModeConfig();
}

export function getDefaultBusinessModeConfig(): BusinessModeConfig {
  const defaultMode = businessModeRegistry.find((mode) => mode.isDefault);

  return defaultMode ?? businessModeRegistry[0];
}

export function getBusinessModesByStatus(status: BusinessModeStatus): readonly BusinessModeConfig[] {
  return businessModeRegistry.filter((mode) => mode.status === status);
}

export function isBusinessModeSelectable(mode: BusinessModeId): boolean {
  return getBusinessModeConfig(mode).isSelectable;
}

export function normalizeBusinessModeId(value: unknown): BusinessModeId | null {
  if (isBusinessModeId(value)) return value;

  return null;
}
