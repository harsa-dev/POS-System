import {
  BUSINESS_MODE_STORAGE_KEY,
  businessModeIds,
  type BusinessModeConfig,
  type BusinessModeId,
  type BusinessModeStatus,
} from "./business-mode.types";

export const defaultBusinessModeId = "restaurant" satisfies BusinessModeId;

export const businessModeRegistry = [
  {
    id: "restaurant",
    label: "Restaurant / F&B",
    shortLabel: "Restaurant",
    description: "Active workspace for menu, cashier, kitchen, serving, tables, inventory, payments, and reports.",
    status: "available",
    category: "food-and-beverage",
    route: "/workspace/restaurant/pos",
    storageKey: BUSINESS_MODE_STORAGE_KEY,
    isDefault: true,
    isSelectable: true,
    badgeLabel: "Available",
    primaryModules: ["Dashboard", "Cashier", "Kitchen", "Serving", "Tables", "Menu", "Inventory", "Payments", "Reports", "Settings"],
    plannedModules: [],
  },
  {
    id: "retail",
    label: "Retail / Supermarket",
    shortLabel: "Retail",
    description: "Active mock workspace for barcode checkout, product catalog, supplier receiving, stock count, shelf management, promotions, and retail reports.",
    status: "available",
    category: "retail",
    route: "/v3/retail/cashier",
    storageKey: BUSINESS_MODE_STORAGE_KEY,
    isDefault: false,
    isSelectable: true,
    badgeLabel: "Mock Ready",
    primaryModules: ["Cashier", "Product Catalog", "Barcode / SKU", "Receiving", "Stock Opname", "Shelf Management", "Promotions"],
    plannedModules: ["API integration", "Database schema", "Real inventory update"],
  },
  {
    id: "raw-material",
    label: "Raw Material / Livestock",
    shortLabel: "Raw Material",
    description: "Preview workspace for intake, weighing, batches, storage, processing, kandang operations, suppliers, inventory policy, and reports.",
    status: "available",
    category: "raw-material",
    route: "/v3/raw-material/kandang",
    storageKey: BUSINESS_MODE_STORAGE_KEY,
    isDefault: false,
    isSelectable: true,
    badgeLabel: "Preview",
    primaryModules: ["Dashboard", "Inventory", "Intake", "Weighing", "Batches", "Storage", "Processing", "Kandang", "Suppliers", "Reports"],
    plannedModules: [],
  },
  {
    id: "custom-business",
    label: "Service / Custom Business",
    shortLabel: "Service",
    description: "Planned workspace for requests, jobs, assignments, clients, invoices, payments, and custom operational reports.",
    status: "planned",
    category: "service",
    route: "/select-mode",
    storageKey: BUSINESS_MODE_STORAGE_KEY,
    isDefault: false,
    isSelectable: false,
    badgeLabel: "Planned",
    primaryModules: ["Dashboard", "Clients", "Invoices", "Payments", "Reports"],
    plannedModules: ["Requests", "Jobs", "Assignments", "Service Workflow"],
    unavailableReason: "Service / Custom Business mode is planned. It needs its own workflow before it can become selectable.",
  },
] as const satisfies readonly BusinessModeConfig[];

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
