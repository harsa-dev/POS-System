import type { InventoryType, InventoryUnit, StockMovementReason } from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/business-context.types.js";
import {
  LIVESTOCK_INVENTORY_TYPES,
  LIVESTOCK_INVENTORY_UNITS,
  LIVESTOCK_STOCK_MOVEMENT_REASONS,
  RESTAURANT_INVENTORY_TYPES,
  RESTAURANT_INVENTORY_UNITS,
  RESTAURANT_STOCK_MOVEMENT_REASONS,
  RETAIL_INVENTORY_TYPES,
  RETAIL_INVENTORY_UNITS,
  RETAIL_STOCK_MOVEMENT_REASONS,
  SERVICE_INVENTORY_TYPES,
  SERVICE_INVENTORY_UNITS,
  SERVICE_STOCK_MOVEMENT_REASONS,
} from "./inventory.constants.js";

export type SharedInventoryBusinessMode = "restaurant" | "retail" | "custom-business" | "raw-material";

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

export const inventoryModePolicies: Record<SharedInventoryBusinessMode, InventoryModePolicy> = {
  restaurant: {
    mode: "restaurant",
    label: "Restaurant",
    description: "Inventory policy for restaurant operations.",
    allowedTypes: RESTAURANT_INVENTORY_TYPES,
    allowedUnits: RESTAURANT_INVENTORY_UNITS,
    allowedMovementReasons: RESTAURANT_STOCK_MOVEMENT_REASONS,
    dashboardBuckets: ["ingredients", "packaging", "equipment", "low-stock", "recent-movements"],
    recipeBacked: true,
    supportsConsumableUsage: true,
    supportsSkuStock: false,
  },
  retail: {
    mode: "retail",
    label: "Retail",
    description: "Inventory policy for retail stock.",
    allowedTypes: RETAIL_INVENTORY_TYPES,
    allowedUnits: RETAIL_INVENTORY_UNITS,
    allowedMovementReasons: RETAIL_STOCK_MOVEMENT_REASONS,
    dashboardBuckets: ["sellable-stock", "raw-materials", "finished-goods", "packaging", "low-stock", "recent-movements"],
    recipeBacked: false,
    supportsConsumableUsage: false,
    supportsSkuStock: true,
  },
  "custom-business": {
    mode: "custom-business",
    label: "Custom Business",
    description: "Inventory policy for planned custom business stock.",
    allowedTypes: SERVICE_INVENTORY_TYPES,
    allowedUnits: SERVICE_INVENTORY_UNITS,
    allowedMovementReasons: SERVICE_STOCK_MOVEMENT_REASONS,
    dashboardBuckets: ["supplies", "tools", "spare-parts", "low-stock", "recent-movements"],
    recipeBacked: false,
    supportsConsumableUsage: true,
    supportsSkuStock: false,
  },
  "raw-material": {
    mode: "raw-material",
    label: "Raw Material",
    description: "Inventory policy for raw material and livestock stock.",
    allowedTypes: LIVESTOCK_INVENTORY_TYPES,
    allowedUnits: LIVESTOCK_INVENTORY_UNITS,
    allowedMovementReasons: LIVESTOCK_STOCK_MOVEMENT_REASONS,
    dashboardBuckets: ["feed", "medicine", "tools", "equipment", "low-stock", "recent-movements"],
    recipeBacked: false,
    supportsConsumableUsage: true,
    supportsSkuStock: false,
  },
};

export function normalizeInventoryBusinessMode(mode: string): SharedInventoryBusinessMode {
  const normalized = mode.toLowerCase();

  if (normalized === "retail") return "retail";
  if (normalized === "custom-business") return "custom-business";
  if (normalized === "raw-material") return "raw-material";

  return "restaurant";
}

export function getInventoryModePolicy(businessContext: BusinessContext) {
  return inventoryModePolicies[normalizeInventoryBusinessMode(businessContext.businessMode)];
}
