import type {
  InventoryType,
  InventoryUnit,
  StockMovementReason,
  StockMovementType,
} from "@prisma/client";

export const INVENTORY_TYPES: readonly InventoryType[] = [
  "INGREDIENT",
  "PACKAGING",
  "EQUIPMENT",
];

export const INVENTORY_UNITS: readonly InventoryUnit[] = [
  "PCS",
  "GRAM",
  "KILOGRAM",
  "LITER",
  "ML",
  "PACK",
  "BOTTLE",
];

export const STOCK_MOVEMENT_TYPES: readonly StockMovementType[] = [
  "IN",
  "OUT",
  "ADJUSTMENT",
];

export const STOCK_MOVEMENT_REASONS: readonly StockMovementReason[] = [
  "PURCHASE",
  "RECIPE_USAGE",
  "WASTE",
  "EXPIRED",
  "MANUAL_ADJUSTMENT",
  "DAMAGED",
  "RETURN",
];

export const DEFAULT_STOCK_MOVEMENT_LIST_LIMIT = 50;
export const MAX_STOCK_MOVEMENT_LIST_LIMIT = 100;
export const INVENTORY_DASHBOARD_RECENT_MOVEMENT_LIMIT = 10;
