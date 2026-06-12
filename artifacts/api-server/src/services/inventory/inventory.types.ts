import type {
  InventoryItem,
  Role,
  StockMovement,
} from "@prisma/client";

export type InventoryActor = {
  id: string;
  role: Role;
};

export type InventoryStockStatus = "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK";

export type InventoryItemWithCounts = InventoryItem & {
  _count?: {
    recipes?: number;
    movements?: number;
  };
};

export type InventoryItemDto = InventoryItem & {
  recipeCount: number;
  movementCount: number;
  stockStatus: InventoryStockStatus;
  isLowStock: boolean;
  isOutOfStock: boolean;
  stockValue: number;
};

export type StockMovementWithItem = StockMovement & {
  inventoryItem: InventoryItem;
};

export type InventoryDashboardSummaryDto = {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalStockValue: number;
  ingredientItems: number;
  packagingItems: number;
  equipmentItems: number;
};

export type InventoryDashboardDto = {
  summary: InventoryDashboardSummaryDto;
  items: InventoryItemDto[];
  lowStockItems: InventoryItemDto[];
  recentMovements: StockMovementWithItem[];
};

export type CreateInventoryItemInput = {
  name: string;
  sku: string | null;
  type: InventoryItem["type"];
  unit: InventoryItem["unit"];
  openingStock: number;
  minimumStock: number;
  costPerUnit: number;
};

export type UpdateInventoryItemInput = Partial<
  Pick<InventoryItem, "name" | "sku" | "type" | "unit" | "minimumStock" | "costPerUnit">
> & {
  targetStock?: number;
};

export type CreateStockMovementInput = {
  inventoryItemId: string;
  type: StockMovement["type"];
  quantity: number;
  reason?: StockMovement["reason"];
  note: string | null;
};
