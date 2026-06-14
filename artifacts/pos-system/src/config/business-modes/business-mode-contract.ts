export const BUSINESS_MODE_STORAGE_KEY = "currentBusinessMode" as const;

export const BUSINESS_MODE_CHANGED_EVENT = "business-mode:changed" as const;

export const businessModeIds = [
  "restaurant",
  "retail",
  "raw-material",
  "custom-business",
] as const;

export type BusinessModeId = (typeof businessModeIds)[number];

export const activeBusinessModeIds = [
  "restaurant",
  "retail",
  "raw-material",
] as const satisfies readonly BusinessModeId[];

export const plannedBusinessModeIds = [
  "custom-business",
] as const satisfies readonly BusinessModeId[];

export const businessModeStatuses = [
  "available",
  "planned",
  "disabled",
] as const;

export type BusinessModeStatus = (typeof businessModeStatuses)[number];

export type BusinessModeCategory =
  | "restaurant"
  | "retail"
  | "raw-material"
  | "custom-business";

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

export const businessModeConfigs = [
  {
    id: "restaurant",
    label: "Restaurant",
    shortLabel: "Restaurant",
    description: "Active workspace for menu, cashier, kitchen, serving, tables, inventory, payments, and reports.",
    status: "available",
    category: "restaurant",
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
    label: "Retail",
    shortLabel: "Retail",
    description: "Active workspace for barcode checkout, product catalog, supplier receiving, stock count, shelf management, promotions, and retail reports.",
    status: "available",
    category: "retail",
    route: "/v3/retail/cashier",
    storageKey: BUSINESS_MODE_STORAGE_KEY,
    isDefault: false,
    isSelectable: true,
    badgeLabel: "Available",
    primaryModules: ["Cashier", "Product Catalog", "Barcode / SKU", "Receiving", "Stock Opname", "Shelf Management", "Promotions"],
    plannedModules: ["API integration", "Database schema", "Real inventory update"],
  },
  {
    id: "raw-material",
    label: "Raw Material",
    shortLabel: "Raw Material",
    description: "Active workspace for intake, weighing, batches, storage, processing, kandang operations, suppliers, inventory policy, and reports.",
    status: "available",
    category: "raw-material",
    route: "/v3/raw-material/kandang",
    storageKey: BUSINESS_MODE_STORAGE_KEY,
    isDefault: false,
    isSelectable: true,
    badgeLabel: "Available",
    primaryModules: ["Dashboard", "Inventory", "Intake", "Weighing", "Batches", "Storage", "Processing", "Kandang", "Suppliers", "Reports"],
    plannedModules: [],
  },
  {
    id: "custom-business",
    label: "Custom Business",
    shortLabel: "Custom",
    description: "Planned guarded workspace for custom operations such as requests, jobs, assignments, clients, invoices, payments, and reports.",
    status: "planned",
    category: "custom-business",
    route: "/select-mode",
    storageKey: BUSINESS_MODE_STORAGE_KEY,
    isDefault: false,
    isSelectable: false,
    badgeLabel: "Planned",
    primaryModules: ["Dashboard", "Clients", "Invoices", "Payments", "Reports"],
    plannedModules: ["Requests", "Jobs", "Assignments", "Custom Workflow"],
    unavailableReason: "Custom Business mode is planned and is guarded until its workflow is complete.",
  },
] as const satisfies readonly BusinessModeConfig[];

export const businessModeRoutePrefixes = {
  restaurant: ["/workspace/restaurant/", "/dashboard/restaurant/"],
  retail: ["/v3/retail/"],
  "raw-material": ["/v3/raw-material/"],
  "custom-business": [],
} as const satisfies Record<BusinessModeId, readonly string[]>;

// Temporary storage migration boundary only. Runtime routes, APIs, and configs must use canonical IDs.
export const legacyStoredBusinessModeMap = {
  fnb: "restaurant",
  service: "custom-business",
  warehouse: "raw-material",
} as const satisfies Record<string, BusinessModeId>;
