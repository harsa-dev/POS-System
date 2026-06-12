import type {
  InventoryType,
  InventoryUnit,
  StockMovementReason,
} from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/business-context.types.js";
import {
  INVENTORY_TYPES,
  INVENTORY_UNITS,
  STOCK_MOVEMENT_REASONS,
} from "./inventory.constants.js";

export type SharedInventoryBusinessMode =
  | "restaurant"
  | "retail"
  | "service"
  | "livestock";

export type InventoryModePolicy = {
  mode: SharedInventoryBusinessMode;
  label: string;
  description: string;
  allowedTypes: readonly InventoryType[];
  allowedUnits: readonly InventoryUnit[];
  allowedMovementReasons: readonly StockMovementReason[];
  dashboardBuckets: readonly string[];
  recipeBacked: boolean;
  supportsConsumableUsage: boolean;
  supportsSkuStock: boolean;
};

const baseAllowedTypes = INVENTORY_TYPES;
const baseAllowedUnits = INVENTORY_UNITS;
const baseMovementReasons = STOCK_MOVEMENT_REASONS;

export const inventoryModePolicies: Record<SharedInventoryBusinessMode, InventoryModePolicy> = {
  restaurant: {
    mode: "restaurant",
    label: "Restaurant / F&B",
    description: "Ingredient, packaging, and equipment inventory for recipe-backed menu operations.",
    allowedTypes: baseAllowedTypes,
    allowedUnits: baseAllowedUnits,
    allowedMovementReasons: baseMovementReasons,
    dashboardBuckets: ["ingredients", "packaging", "equipment", "low-stock", "recent-movements"],
    recipeBacked: true,
    supportsConsumableUsage: true,
    supportsSkuStock: false,
  },
  retail: {
    mode: "retail",
    label: "Retail",
    description: "Shared stock foundation for SKU-oriented products. Product/SKU schema extensions are still future work.",
    allowedTypes: baseAllowedTypes,
    allowedUnits: baseAllowedUnits,
    allowedMovementReasons: baseMovementReasons,
    dashboardBuckets: ["sellable-stock", "packaging", "equipment", "low-stock", "recent-movements"],
    recipeBacked: false,
    supportsConsumableUsage: false,
    supportsSkuStock: true,
  },
  service: {
    mode: "service",
    label: "Service Business",
    description: "Shared stock foundation for supplies, tools, and consumables used by service jobs.",
    allowedTypes: baseAllowedTypes,
    allowedUnits: baseAllowedUnits,
    allowedMovementReasons: baseMovementReasons,
    dashboardBuckets: ["supplies", "tools", "consumables", "low-stock", "recent-movements"],
    recipeBacked: false,
    supportsConsumableUsage: true,
    supportsSkuStock: false,
  },
  livestock: {
    mode: "livestock",
    label: "Livestock",
    description: "Shared stock foundation for feed, medicine, tools, and barn supplies.",
    allowedTypes: baseAllowedTypes,
    allowedUnits: baseAllowedUnits,
    allowedMovementReasons: baseMovementReasons,
    dashboardBuckets: ["feed", "medicine", "tools", "low-stock", "recent-movements"],
    recipeBacked: false,
    supportsConsumableUsage: true,
    supportsSkuStock: false,
  },
};

export function normalizeInventoryBusinessMode(mode: string): SharedInventoryBusinessMode {
  if (mode === "retail") return "retail";
  if (mode === "service") return "service";
  if (mode === "livestock") return "livestock";
  return "restaurant";
}

export function getInventoryModePolicy(businessContext: BusinessContext) {
  return inventoryModePolicies[normalizeInventoryBusinessMode(businessContext.businessMode)];
}
