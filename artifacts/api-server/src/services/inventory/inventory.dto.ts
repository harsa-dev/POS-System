import type {
  InventoryDashboardDto,
  InventoryItemDto,
  InventoryItemWithCounts,
  InventoryStockStatus,
  StockMovementWithItem,
} from "./inventory.types.js";

export function getInventoryStockStatus(item: {
  currentStock: number;
  minimumStock: number;
}): InventoryStockStatus {
  if (item.currentStock <= 0) return "OUT_OF_STOCK";
  if (item.currentStock <= item.minimumStock) return "LOW_STOCK";
  return "IN_STOCK";
}

export function toInventoryItemDto(item: InventoryItemWithCounts): InventoryItemDto {
  const stockStatus = getInventoryStockStatus(item);
  const isOutOfStock = stockStatus === "OUT_OF_STOCK";
  const isLowStock = stockStatus === "LOW_STOCK";

  return {
    ...item,
    recipeCount: item._count?.recipes ?? 0,
    movementCount: item._count?.movements ?? 0,
    stockStatus,
    isLowStock,
    isOutOfStock,
    stockValue: Math.round(item.currentStock * item.costPerUnit),
  };
}

export function toInventoryDashboardDto(params: {
  items: InventoryItemDto[];
  recentMovements: StockMovementWithItem[];
}): InventoryDashboardDto {
  const { items, recentMovements } = params;

  return {
    summary: {
      totalItems: items.length,
      lowStockItems: items.filter((item) => item.isLowStock).length,
      outOfStockItems: items.filter((item) => item.isOutOfStock).length,
      totalStockValue: items.reduce((total, item) => total + item.stockValue, 0),
      ingredientItems: items.filter((item) => item.type === "INGREDIENT").length,
      packagingItems: items.filter((item) => item.type === "PACKAGING").length,
      equipmentItems: items.filter((item) => item.type === "EQUIPMENT").length,
    },
    items,
    lowStockItems: items.filter((item) => item.isLowStock || item.isOutOfStock),
    recentMovements,
  };
}
