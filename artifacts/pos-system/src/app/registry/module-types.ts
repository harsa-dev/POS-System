export const V3_BUSINESS_MODES = [
  "restaurant",
  "retail",
  "raw-material",
  "custom-business",
] as const;

export type V3BusinessMode = (typeof V3_BUSINESS_MODES)[number];

export type V3LegacyBusinessMode = "fnb" | "service" | "warehouse";

export type V3RuntimeRole =
  | "OWNER"
  | "MANAGER"
  | "CASHIER"
  | "SERVER"
  | "KITCHEN";

export type V3ModuleLayer =
  | "core"
  | "business"
  | "restaurant"
  | "retail"
  | "raw-material"
  | "custom-business";

export type V3ModuleStatus = "active" | "planned" | "deprecated";

export type V3ModuleId =
  | "auth"
  | "permissions"
  | "settings"
  | "inventory"
  | "payments"
  | "analytics"
  | "audit"
  | "employees"
  | "attendance"
  | "shifts"
  | "reports"
  | "customers"
  | "cashflow"
  | "invoice"
  | "pos"
  | "kitchen"
  | "serving"
  | "tables"
  | "menu"
  | "recipes"
  | "orders"
  | "cashier"
  | "catalog"
  | "barcode"
  | "receiving"
  | "stock-opname"
  | "shelf-management"
  | "promotions"
  | "intake"
  | "weighing"
  | "batches"
  | "storage"
  | "processing"
  | "kandang"
  | "suppliers"
  | "registry"
  | "feature-flags"
  | "config";

export type V3PermissionKey =
  | "auth.access"
  | "permissions.manage"
  | "settings.manage"
  | "inventory.view"
  | "inventory.manage"
  | "payments.manage"
  | "analytics.view"
  | "audit.view"
  | "employees.manage"
  | "attendance.manage"
  | "shifts.manage"
  | "reports.view"
  | "customers.manage"
  | "cashflow.view"
  | "invoice.manage"
  | "restaurant.pos.access"
  | "restaurant.kitchen.access"
  | "restaurant.serving.access"
  | "restaurant.tables.manage"
  | "restaurant.menu.manage"
  | "restaurant.recipes.manage"
  | "restaurant.orders.manage"
  | "retail.cashier.access"
  | "retail.catalog.manage"
  | "retail.barcode.manage"
  | "retail.receiving.manage"
  | "retail.stock-opname.manage"
  | "retail.shelf-management.manage"
  | "retail.promotions.manage"
  | "raw-material.intake.manage"
  | "raw-material.weighing.manage"
  | "raw-material.batches.manage"
  | "raw-material.storage.manage"
  | "raw-material.processing.manage"
  | "raw-material.kandang.manage"
  | "raw-material.suppliers.manage"
  | "custom-business.registry.manage"
  | "custom-business.feature-flags.manage"
  | "custom-business.config.manage";

export type V3FeatureFlag =
  | "audit-trail"
  | "workforce-management"
  | "restaurant-mode"
  | "retail-mode"
  | "raw-material-mode"
  | "custom-business-mode";

export type V3SidebarGroup =
  | "Core Systems"
  | "Shared Business"
  | "Restaurant Operations"
  | "Retail Operations"
  | "Raw Material Operations"
  | "Custom Business";

export type V3SidebarRegistration = Readonly<{
  moduleId: V3ModuleId;
  label: string;
  description: string;
  routePath: string;
  group: V3SidebarGroup;
  supportedModes: readonly V3BusinessMode[];
  requiredPermissions: readonly V3PermissionKey[];
  featureFlags: readonly V3FeatureFlag[];
  requiredRoles?: readonly V3RuntimeRole[];
  order: number;
}>;

export type V3WorkspaceRegistration = Readonly<{
  id: V3ModuleId;
  moduleId: V3ModuleId;
  label: string;
  description: string;
  routePath: string;
  currentRoute?: string | null;
  workspaceRoute?: string;
  layer: V3ModuleLayer;
  supportedModes: readonly V3BusinessMode[];
  requiredPermissions: readonly V3PermissionKey[];
  featureFlags: readonly V3FeatureFlag[];
  dependencies: readonly V3ModuleId[];
  order: number;
}>;

export type V3ModuleMetadata = Readonly<{
  id: V3ModuleId;
  label: string;
  description: string;
  layer: V3ModuleLayer;
  status: V3ModuleStatus;
  supportedModes: readonly V3BusinessMode[];
  routeBase: string | null;
  workspaceRoute?: string | null;
  sidebarGroup: V3SidebarGroup;
  sidebarVisible: boolean;
  sidebarLabel?: string;
  sidebarOrder?: number;
  workspaceLabel?: string;
  workspaceOrder?: number;
  sidebarEntries?: readonly V3SidebarRegistration[];
  workspaceEntries?: readonly V3WorkspaceRegistration[];
  requiredPermissions: readonly V3PermissionKey[];
  featureFlags: readonly V3FeatureFlag[];
  dependencies: readonly V3ModuleId[];
}>;

export type V3SidebarItem = Readonly<{
  moduleId: V3ModuleId;
  label: string;
  description: string;
  routePath: string;
  group: V3SidebarGroup;
  supportedModes: readonly V3BusinessMode[];
  requiredPermissions: readonly V3PermissionKey[];
  featureFlags: readonly V3FeatureFlag[];
  requiredRoles: readonly V3RuntimeRole[];
  order: number;
}>;

export type V3WorkspaceMetadata = Readonly<{
  id: V3ModuleId;
  moduleId: V3ModuleId;
  label: string;
  description: string;
  routePath: string;
  currentRoute: string | null;
  workspaceRoute: string;
  layer: V3ModuleLayer;
  supportedModes: readonly V3BusinessMode[];
  requiredPermissions: readonly V3PermissionKey[];
  featureFlags: readonly V3FeatureFlag[];
  dependencies: readonly V3ModuleId[];
  order: number;
}>;
