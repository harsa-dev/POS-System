import type { BusinessModeId } from "@/config/business-modes";

export { businessModeIds as V3_BUSINESS_MODES } from "@/config/business-modes";

export type V3BusinessMode = BusinessModeId;

export type V3RuntimeRole =
  | "OWNER"
  | "MANAGER"
  | "ADMIN"
  | "OPERATOR"
  | "STAFF"
  | "VIEWER"
  | "KITCHEN"
  | "CASHIER"
  | "SERVER";

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
  | "customers-loyalty"
  | "returns-exchanges"
  | "staff-shifts"
  | "forecasting"
  | "multi-location"
  | "omnichannel"
  | "audit-controls"
  | "approvals"
  | "transfers"
  | "audit-log"
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
  | "platform-admin.internal-monitoring.read"
  | "platform-admin.admin-role-console.read"
  | "platform-admin.billing-operations-console.read"
  | "inventory.view"
  | "inventory.manage"
  | "payments.manage"
  | "analytics.view"
  | "analytics.operational-view"
  | "analytics.profit-view"
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
  | "retail.customers.manage"
  | "retail.returns.manage"
  | "retail.staff.manage"
  | "retail.forecasting.view"
  | "retail.locations.manage"
  | "retail.omnichannel.manage"
  | "retail.audit.view"
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
  | "Retail Growth"
  | "Retail Enterprise"
  | "Raw Material Operations"
  | "Custom Business Operations"
  | "Custom Business";

export type V3SidebarEntry = {
  moduleId: V3ModuleId;
  label: string;
  description?: string;
  routePath: string;
  group: V3SidebarGroup;
  supportedModes: readonly V3BusinessMode[];
  requiredPermissions: readonly V3PermissionKey[];
  requiredRoles?: readonly V3RuntimeRole[];
  featureFlags?: readonly V3FeatureFlag[];
  order?: number;
};

export type V3SidebarItem = V3SidebarEntry & {
  requiredRoles: readonly V3RuntimeRole[];
  order: number;
};

export type V3SidebarRegistration = V3SidebarEntry;

export type V3WorkspaceRegistration = {
  id: V3ModuleId;
  moduleId: V3ModuleId;
  label: string;
  description?: string;
  routePath: string;
  workspaceRoute?: string;
  currentRoute?: string | null;
  layer: V3ModuleLayer;
  supportedModes: readonly V3BusinessMode[];
  requiredPermissions: readonly V3PermissionKey[];
  featureFlags?: readonly V3FeatureFlag[];
  dependencies: readonly V3ModuleId[];
  order?: number;
};

export type V3WorkspaceMetadata = {
  id: V3ModuleId;
  moduleId: V3ModuleId;
  label: string;
  description?: string;
  routePath: string;
  workspaceRoute: string;
  currentRoute: string | null;
  layer: V3ModuleLayer;
  supportedModes: readonly V3BusinessMode[];
  requiredPermissions: readonly V3PermissionKey[];
  featureFlags?: readonly V3FeatureFlag[];
  dependencies: readonly V3ModuleId[];
  order: number;
};

export type V3ModuleMetadata = {
  id: V3ModuleId;
  label: string;
  description: string;
  layer: V3ModuleLayer;
  status: V3ModuleStatus;
  supportedModes: readonly V3BusinessMode[];
  routeBase: string | null;
  sidebarGroup: V3SidebarGroup;
  sidebarVisible: boolean;
  sidebarOrder?: number;
  sidebarLabel?: string;
  workspaceOrder?: number;
  workspaceRoute?: string;
  workspaceLabel?: string;
  workspaceEntries?: readonly V3WorkspaceRegistration[];
  sidebarEntries?: readonly V3SidebarEntry[];
  requiredPermissions: readonly V3PermissionKey[];
  featureFlags?: readonly V3FeatureFlag[];
  dependencies: readonly V3ModuleId[];
};
