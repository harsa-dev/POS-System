export {
  createInventoryItem,
  createStockMovement,
  deleteInventoryItem,
  getInventoryDashboard,
  listInventoryItems,
  listStockMovements,
  updateInventoryItem,
} from "./inventory.service.js";

export {
  INVENTORY_DASHBOARD_RECENT_MOVEMENT_LIMIT,
  INVENTORY_TYPES,
  INVENTORY_UNITS,
  STOCK_MOVEMENT_REASONS,
  STOCK_MOVEMENT_TYPES,
} from "./inventory.constants.js";

export {
  getInventoryStockStatus,
  toInventoryDashboardDto,
  toInventoryItemDto,
} from "./inventory.dto.js";

export {
  getInventoryModePolicy,
  inventoryModePolicies,
  normalizeInventoryBusinessMode,
} from "./inventory.mode-policy.js";

export {
  requireInventoryAdjust,
  requireInventoryView,
} from "./inventory.permissions.js";

export type {
  CreateInventoryItemInput,
  CreateStockMovementInput,
  InventoryActor,
  InventoryDashboardDto,
  InventoryDashboardSummaryDto,
  InventoryItemDto,
  InventoryItemWithCounts,
  InventoryStockStatus,
  StockMovementWithItem,
  UpdateInventoryItemInput,
} from "./inventory.types.js";

export type {
  InventoryModePolicy,
  SharedInventoryBusinessMode,
} from "./inventory.mode-policy.js";
