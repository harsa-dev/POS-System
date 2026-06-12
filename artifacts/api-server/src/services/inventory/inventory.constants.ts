import type {
  InventoryType,
  InventoryUnit,
  StockMovementReason,
  StockMovementSource,
  StockMovementType,
} from "@prisma/client";

export const RESTAURANT_INVENTORY_TYPES: readonly InventoryType[] = [
  "INGREDIENT",
  "PACKAGING",
  "EQUIPMENT",
];

export const RETAIL_INVENTORY_TYPES: readonly InventoryType[] = [
  "PRODUCT",
  "PACKAGING",
  "EQUIPMENT",
  "RAW_MATERIAL",
  "FINISHED_GOOD",
];

export const SERVICE_INVENTORY_TYPES: readonly InventoryType[] = [
  "SUPPLY",
  "TOOL",
  "SPARE_PART",
  "EQUIPMENT",
];

export const LIVESTOCK_INVENTORY_TYPES: readonly InventoryType[] = [
  "FEED",
  "MEDICINE",
  "TOOL",
  "SUPPLY",
  "EQUIPMENT",
];

export const INVENTORY_TYPES: readonly InventoryType[] = [
  "INGREDIENT",
  "PACKAGING",
  "EQUIPMENT",
  "PRODUCT",
  "RAW_MATERIAL",
  "FINISHED_GOOD",
  "SUPPLY",
  "TOOL",
  "SPARE_PART",
  "FEED",
  "MEDICINE",
];

export const RESTAURANT_INVENTORY_UNITS: readonly InventoryUnit[] = [
  "PCS",
  "GRAM",
  "KILOGRAM",
  "LITER",
  "ML",
  "PACK",
  "BOTTLE",
  "BOX",
  "SACK",
  "CAN",
];

export const RETAIL_INVENTORY_UNITS: readonly InventoryUnit[] = [
  "PCS",
  "PACK",
  "BOTTLE",
  "BOX",
  "CARTON",
  "ROLL",
  "SET",
  "PAIR",
  "CAN",
];

export const SERVICE_INVENTORY_UNITS: readonly InventoryUnit[] = [
  "PCS",
  "PACK",
  "BOX",
  "SET",
  "PAIR",
  "ROLL",
  "LITER",
  "ML",
  "CAN",
];

export const LIVESTOCK_INVENTORY_UNITS: readonly InventoryUnit[] = [
  "PCS",
  "GRAM",
  "KILOGRAM",
  "LITER",
  "ML",
  "PACK",
  "BOTTLE",
  "SACK",
  "DOSE",
  "TABLET",
  "CAPSULE",
  "VIAL",
];

export const INVENTORY_UNITS: readonly InventoryUnit[] = [
  "PCS",
  "GRAM",
  "KILOGRAM",
  "LITER",
  "ML",
  "PACK",
  "BOTTLE",
  "BOX",
  "CARTON",
  "SACK",
  "ROLL",
  "SET",
  "PAIR",
  "DOSE",
  "TABLET",
  "CAPSULE",
  "VIAL",
  "CAN",
];

export const STOCK_MOVEMENT_TYPES: readonly StockMovementType[] = [
  "IN",
  "OUT",
  "ADJUSTMENT",
];

export const RESTAURANT_STOCK_MOVEMENT_REASONS: readonly StockMovementReason[] = [
  "OPENING_STOCK",
  "PURCHASE",
  "RECIPE_USAGE",
  "WASTE",
  "EXPIRED",
  "MANUAL_ADJUSTMENT",
  "DAMAGED",
  "RETURN",
  "STOCK_COUNT",
  "CORRECTION",
];

export const RETAIL_STOCK_MOVEMENT_REASONS: readonly StockMovementReason[] = [
  "OPENING_STOCK",
  "PURCHASE",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "WASTE",
  "EXPIRED",
  "MANUAL_ADJUSTMENT",
  "DAMAGED",
  "RETURN",
  "STOCK_COUNT",
  "CORRECTION",
  "IMPORT",
];

export const SERVICE_STOCK_MOVEMENT_REASONS: readonly StockMovementReason[] = [
  "OPENING_STOCK",
  "PURCHASE",
  "SERVICE_USAGE",
  "MANUAL_ADJUSTMENT",
  "DAMAGED",
  "RETURN",
  "STOCK_COUNT",
  "CORRECTION",
];

export const LIVESTOCK_STOCK_MOVEMENT_REASONS: readonly StockMovementReason[] = [
  "OPENING_STOCK",
  "PURCHASE",
  "LIVESTOCK_USAGE",
  "WASTE",
  "EXPIRED",
  "MANUAL_ADJUSTMENT",
  "DAMAGED",
  "RETURN",
  "STOCK_COUNT",
  "CORRECTION",
];

export const STOCK_MOVEMENT_REASONS: readonly StockMovementReason[] = [
  "PURCHASE",
  "RECIPE_USAGE",
  "WASTE",
  "EXPIRED",
  "MANUAL_ADJUSTMENT",
  "DAMAGED",
  "RETURN",
  "OPENING_STOCK",
  "STOCK_COUNT",
  "CORRECTION",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "PRODUCTION_USAGE",
  "SERVICE_USAGE",
  "LIVESTOCK_USAGE",
  "IMPORT",
];

export const STOCK_MOVEMENT_SOURCES: readonly StockMovementSource[] = [
  "MANUAL",
  "ORDER",
  "RECIPE",
  "PURCHASE",
  "WASTE",
  "RETURN",
  "TRANSFER",
  "STOCK_COUNT",
  "IMPORT",
  "SYSTEM",
];

export const DEFAULT_STOCK_MOVEMENT_LIST_LIMIT = 50;
export const MAX_STOCK_MOVEMENT_LIST_LIMIT = 100;
export const INVENTORY_DASHBOARD_RECENT_MOVEMENT_LIMIT = 10;
