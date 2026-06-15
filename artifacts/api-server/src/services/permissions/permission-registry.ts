import type { Role } from "@prisma/client";

import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";

export const permissionKeys = {
  restaurant: {
    dashboard: {
      view: "restaurant.dashboard.view",
    },
    sharedDashboard: {
      view: "restaurant.shared-dashboard.view",
    },
    orders: {
      view: "restaurant.orders.view",
      create: "restaurant.orders.create",
      approve: "restaurant.orders.approve",
      cancel: "restaurant.orders.cancel",
      updateStatus: "restaurant.orders.update-status",
    },
    payments: {
      view: "restaurant.payments.view",
      create: "restaurant.payments.create",
      refund: "restaurant.payments.refund",
      void: "restaurant.payments.void",
    },
    kitchen: {
      view: "restaurant.kitchen.view",
      update: "restaurant.kitchen.update",
    },
    serving: {
      view: "restaurant.serving.view",
      update: "restaurant.serving.update",
    },
    workflow: {
      preview: "restaurant.workflow.preview",
      update: "restaurant.workflow.update",
    },
    tables: {
      view: "restaurant.tables.view",
      manage: "restaurant.tables.manage",
    },
    menu: {
      view: "restaurant.menu.view",
      manage: "restaurant.menu.manage",
    },
    audit: {
      view: "restaurant.audit.view",
    },
    policy: {
      view: "restaurant.policy.view",
    },
  },
  retail: {
    dashboard: {
      view: "retail.dashboard.view",
    },
    checkout: {
      create: "retail.checkout.create",
      refund: "retail.checkout.refund",
      void: "retail.checkout.void",
    },
    products: {
      view: "retail.products.view",
      manage: "retail.products.manage",
    },
    inventory: {
      view: "retail.inventory.view",
      adjust: "retail.inventory.adjust",
    },
    suppliers: {
      view: "retail.suppliers.view",
      manage: "retail.suppliers.manage",
    },
    reports: {
      view: "retail.reports.view",
      export: "retail.reports.export",
    },
    policy: {
      view: "retail.policy.view",
    },
  },
  rawMaterial: {
    dashboard: {
      view: "raw-material.dashboard.view",
    },
    suppliers: {
      view: "raw-material.suppliers.view",
      manage: "raw-material.suppliers.manage",
    },
    intakes: {
      view: "raw-material.intakes.view",
      create: "raw-material.intakes.create",
      update: "raw-material.intakes.update",
    },
    weighing: {
      view: "raw-material.weighing.view",
      create: "raw-material.weighing.create",
    },
    batches: {
      view: "raw-material.batches.view",
      update: "raw-material.batches.update",
    },
    processing: {
      view: "raw-material.processing.view",
      create: "raw-material.processing.create",
      update: "raw-material.processing.update",
    },
    stockMovements: {
      view: "raw-material.stock-movements.view",
      create: "raw-material.stock-movements.create",
    },
    pens: {
      view: "raw-material.pens.view",
      manage: "raw-material.pens.manage",
    },
    reports: {
      view: "raw-material.reports.view",
      export: "raw-material.reports.export",
    },
    policy: {
      view: "raw-material.policy.view",
    },
  },
  service: {
    dashboard: {
      view: "service.dashboard.view",
    },
    jobs: {
      view: "service.jobs.view",
      create: "service.jobs.create",
      assign: "service.jobs.assign",
      update: "service.jobs.update",
      complete: "service.jobs.complete",
      cancel: "service.jobs.cancel",
    },
    clients: {
      view: "service.clients.view",
      manage: "service.clients.manage",
    },
    workflow: {
      preview: "service.workflow.preview",
      update: "service.workflow.update",
    },
    invoices: {
      view: "service.invoices.view",
      create: "service.invoices.create",
      void: "service.invoices.void",
    },
    reports: {
      view: "service.reports.view",
      export: "service.reports.export",
    },
    policy: {
      view: "service.policy.view",
    },
  },
  shared: {
    analytics: {
      view: "shared.analytics.view",
      operationalView: "shared.analytics.operational-view",
      profitView: "shared.analytics.profit-view",
      export: "shared.analytics.export",
    },
    inventory: {
      view: "shared.inventory.view",
      adjust: "shared.inventory.adjust",
    },
    cashflow: {
      view: "shared.cashflow.view",
      create: "shared.cashflow.create",
      sync: "shared.cashflow.sync",
      void: "shared.cashflow.void",
      export: "shared.cashflow.export",
    },
    reports: {
      view: "shared.reports.view",
      export: "shared.reports.export",
    },
    financialReports: {
      view: "shared.financial-reports.view",
      export: "shared.financial-reports.export",
    },
    settings: {
      view: "shared.settings.view",
      update: "shared.settings.update",
    },
  },
} as const;

type LeafValues<T> = T extends string
  ? T
  : T extends Record<string, unknown>
    ? LeafValues<T[keyof T]>
    : never;

export type PermissionKey = LeafValues<typeof permissionKeys>;

const restaurantOwnerPermissions = [
  permissionKeys.restaurant.dashboard.view,
  permissionKeys.restaurant.sharedDashboard.view,
  permissionKeys.restaurant.orders.view,
  permissionKeys.restaurant.orders.create,
  permissionKeys.restaurant.orders.approve,
  permissionKeys.restaurant.orders.cancel,
  permissionKeys.restaurant.orders.updateStatus,
  permissionKeys.restaurant.payments.view,
  permissionKeys.restaurant.payments.create,
  permissionKeys.restaurant.payments.refund,
  permissionKeys.restaurant.payments.void,
  permissionKeys.restaurant.kitchen.view,
  permissionKeys.restaurant.kitchen.update,
  permissionKeys.restaurant.serving.view,
  permissionKeys.restaurant.serving.update,
  permissionKeys.restaurant.workflow.preview,
  permissionKeys.restaurant.workflow.update,
  permissionKeys.restaurant.tables.view,
  permissionKeys.restaurant.tables.manage,
  permissionKeys.restaurant.menu.view,
  permissionKeys.restaurant.menu.manage,
  permissionKeys.restaurant.audit.view,
  permissionKeys.restaurant.policy.view,
] as const satisfies readonly PermissionKey[];

const restaurantManagerPermissions = restaurantOwnerPermissions;

const restaurantOperatorPermissions = [
  permissionKeys.restaurant.dashboard.view,
  permissionKeys.restaurant.sharedDashboard.view,
  permissionKeys.restaurant.orders.view,
  permissionKeys.restaurant.orders.create,
  permissionKeys.restaurant.orders.approve,
  permissionKeys.restaurant.orders.updateStatus,
  permissionKeys.restaurant.payments.view,
  permissionKeys.restaurant.payments.create,
  permissionKeys.restaurant.kitchen.view,
  permissionKeys.restaurant.kitchen.update,
  permissionKeys.restaurant.serving.view,
  permissionKeys.restaurant.serving.update,
  permissionKeys.restaurant.workflow.preview,
  permissionKeys.restaurant.workflow.update,
  permissionKeys.restaurant.tables.view,
  permissionKeys.restaurant.tables.manage,
  permissionKeys.restaurant.menu.view,
] as const satisfies readonly PermissionKey[];

const restaurantStaffPermissions = [
  permissionKeys.restaurant.dashboard.view,
  permissionKeys.restaurant.orders.view,
  permissionKeys.restaurant.orders.create,
  permissionKeys.restaurant.orders.updateStatus,
  permissionKeys.restaurant.kitchen.view,
  permissionKeys.restaurant.kitchen.update,
  permissionKeys.restaurant.serving.view,
  permissionKeys.restaurant.serving.update,
  permissionKeys.restaurant.workflow.preview,
  permissionKeys.restaurant.workflow.update,
  permissionKeys.restaurant.tables.view,
  permissionKeys.restaurant.menu.view,
] as const satisfies readonly PermissionKey[];

const restaurantViewerPermissions = [
  permissionKeys.restaurant.dashboard.view,
  permissionKeys.restaurant.sharedDashboard.view,
  permissionKeys.restaurant.orders.view,
  permissionKeys.restaurant.kitchen.view,
  permissionKeys.restaurant.serving.view,
  permissionKeys.restaurant.workflow.preview,
  permissionKeys.restaurant.tables.view,
  permissionKeys.restaurant.menu.view,
] as const satisfies readonly PermissionKey[];

const retailOwnerPermissions = [
  permissionKeys.retail.dashboard.view,
  permissionKeys.retail.checkout.create,
  permissionKeys.retail.checkout.refund,
  permissionKeys.retail.checkout.void,
  permissionKeys.retail.products.view,
  permissionKeys.retail.products.manage,
  permissionKeys.retail.inventory.view,
  permissionKeys.retail.inventory.adjust,
  permissionKeys.retail.suppliers.view,
  permissionKeys.retail.suppliers.manage,
  permissionKeys.retail.reports.view,
  permissionKeys.retail.reports.export,
  permissionKeys.retail.policy.view,
] as const satisfies readonly PermissionKey[];

const retailManagerPermissions = retailOwnerPermissions;

const retailOperatorPermissions = [
  permissionKeys.retail.dashboard.view,
  permissionKeys.retail.checkout.create,
  permissionKeys.retail.products.view,
  permissionKeys.retail.inventory.view,
  permissionKeys.retail.inventory.adjust,
  permissionKeys.retail.suppliers.view,
  permissionKeys.retail.reports.view,
] as const satisfies readonly PermissionKey[];

const retailStaffPermissions = [
  permissionKeys.retail.dashboard.view,
  permissionKeys.retail.checkout.create,
  permissionKeys.retail.products.view,
  permissionKeys.retail.inventory.view,
] as const satisfies readonly PermissionKey[];

const retailViewerPermissions = [
  permissionKeys.retail.dashboard.view,
  permissionKeys.retail.products.view,
  permissionKeys.retail.inventory.view,
  permissionKeys.retail.suppliers.view,
  permissionKeys.retail.reports.view,
] as const satisfies readonly PermissionKey[];

const rawMaterialOwnerPermissions = [
  permissionKeys.rawMaterial.dashboard.view,
  permissionKeys.rawMaterial.suppliers.view,
  permissionKeys.rawMaterial.suppliers.manage,
  permissionKeys.rawMaterial.intakes.view,
  permissionKeys.rawMaterial.intakes.create,
  permissionKeys.rawMaterial.intakes.update,
  permissionKeys.rawMaterial.weighing.view,
  permissionKeys.rawMaterial.weighing.create,
  permissionKeys.rawMaterial.batches.view,
  permissionKeys.rawMaterial.batches.update,
  permissionKeys.rawMaterial.processing.view,
  permissionKeys.rawMaterial.processing.create,
  permissionKeys.rawMaterial.processing.update,
  permissionKeys.rawMaterial.stockMovements.view,
  permissionKeys.rawMaterial.stockMovements.create,
  permissionKeys.rawMaterial.pens.view,
  permissionKeys.rawMaterial.pens.manage,
  permissionKeys.rawMaterial.reports.view,
  permissionKeys.rawMaterial.reports.export,
  permissionKeys.rawMaterial.policy.view,
] as const satisfies readonly PermissionKey[];

const rawMaterialManagerPermissions = rawMaterialOwnerPermissions;

const rawMaterialOperatorPermissions = [
  permissionKeys.rawMaterial.dashboard.view,
  permissionKeys.rawMaterial.suppliers.view,
  permissionKeys.rawMaterial.intakes.view,
  permissionKeys.rawMaterial.intakes.create,
  permissionKeys.rawMaterial.intakes.update,
  permissionKeys.rawMaterial.weighing.view,
  permissionKeys.rawMaterial.weighing.create,
  permissionKeys.rawMaterial.batches.view,
  permissionKeys.rawMaterial.batches.update,
  permissionKeys.rawMaterial.processing.view,
  permissionKeys.rawMaterial.processing.create,
  permissionKeys.rawMaterial.processing.update,
  permissionKeys.rawMaterial.stockMovements.view,
  permissionKeys.rawMaterial.stockMovements.create,
  permissionKeys.rawMaterial.pens.view,
  permissionKeys.rawMaterial.reports.view,
] as const satisfies readonly PermissionKey[];

const rawMaterialStaffPermissions = [
  permissionKeys.rawMaterial.dashboard.view,
  permissionKeys.rawMaterial.intakes.view,
  permissionKeys.rawMaterial.weighing.view,
  permissionKeys.rawMaterial.weighing.create,
  permissionKeys.rawMaterial.batches.view,
  permissionKeys.rawMaterial.processing.view,
  permissionKeys.rawMaterial.stockMovements.view,
  permissionKeys.rawMaterial.pens.view,
] as const satisfies readonly PermissionKey[];

const rawMaterialViewerPermissions = [
  permissionKeys.rawMaterial.dashboard.view,
  permissionKeys.rawMaterial.suppliers.view,
  permissionKeys.rawMaterial.intakes.view,
  permissionKeys.rawMaterial.weighing.view,
  permissionKeys.rawMaterial.batches.view,
  permissionKeys.rawMaterial.processing.view,
  permissionKeys.rawMaterial.stockMovements.view,
  permissionKeys.rawMaterial.pens.view,
  permissionKeys.rawMaterial.reports.view,
] as const satisfies readonly PermissionKey[];

const serviceOwnerPermissions = [
  permissionKeys.service.dashboard.view,
  permissionKeys.service.jobs.view,
  permissionKeys.service.jobs.create,
  permissionKeys.service.jobs.assign,
  permissionKeys.service.jobs.update,
  permissionKeys.service.jobs.complete,
  permissionKeys.service.jobs.cancel,
  permissionKeys.service.clients.view,
  permissionKeys.service.clients.manage,
  permissionKeys.service.workflow.preview,
  permissionKeys.service.workflow.update,
  permissionKeys.service.invoices.view,
  permissionKeys.service.invoices.create,
  permissionKeys.service.invoices.void,
  permissionKeys.service.reports.view,
  permissionKeys.service.reports.export,
  permissionKeys.service.policy.view,
] as const satisfies readonly PermissionKey[];

const serviceManagerPermissions = serviceOwnerPermissions;

const serviceOperatorPermissions = [
  permissionKeys.service.dashboard.view,
  permissionKeys.service.jobs.view,
  permissionKeys.service.jobs.create,
  permissionKeys.service.jobs.assign,
  permissionKeys.service.jobs.update,
  permissionKeys.service.jobs.complete,
  permissionKeys.service.clients.view,
  permissionKeys.service.workflow.preview,
  permissionKeys.service.workflow.update,
  permissionKeys.service.invoices.view,
  permissionKeys.service.invoices.create,
  permissionKeys.service.reports.view,
] as const satisfies readonly PermissionKey[];

const serviceStaffPermissions = [
  permissionKeys.service.dashboard.view,
  permissionKeys.service.jobs.view,
  permissionKeys.service.jobs.create,
  permissionKeys.service.jobs.update,
  permissionKeys.service.jobs.complete,
  permissionKeys.service.clients.view,
  permissionKeys.service.workflow.preview,
  permissionKeys.service.invoices.view,
] as const satisfies readonly PermissionKey[];

const serviceViewerPermissions = [
  permissionKeys.service.dashboard.view,
  permissionKeys.service.jobs.view,
  permissionKeys.service.clients.view,
  permissionKeys.service.workflow.preview,
  permissionKeys.service.invoices.view,
  permissionKeys.service.reports.view,
] as const satisfies readonly PermissionKey[];

const sharedOwnerPermissions = [
  permissionKeys.shared.analytics.view,
  permissionKeys.shared.analytics.operationalView,
  permissionKeys.shared.analytics.profitView,
  permissionKeys.shared.analytics.export,
  permissionKeys.shared.inventory.view,
  permissionKeys.shared.inventory.adjust,
  permissionKeys.shared.cashflow.view,
  permissionKeys.shared.cashflow.create,
  permissionKeys.shared.cashflow.sync,
  permissionKeys.shared.cashflow.void,
  permissionKeys.shared.cashflow.export,
  permissionKeys.shared.reports.view,
  permissionKeys.shared.reports.export,
  permissionKeys.shared.financialReports.view,
  permissionKeys.shared.financialReports.export,
  permissionKeys.shared.settings.view,
  permissionKeys.shared.settings.update,
] as const satisfies readonly PermissionKey[];

const sharedManagerPermissions = [
  ...sharedOwnerPermissions.filter((permission) => permission !== permissionKeys.shared.settings.update),
] as const satisfies readonly PermissionKey[];

const sharedOperatorPermissions = [
  permissionKeys.shared.analytics.view,
  permissionKeys.shared.analytics.operationalView,
  permissionKeys.shared.inventory.view,
  permissionKeys.shared.cashflow.view,
  permissionKeys.shared.cashflow.sync,
] as const satisfies readonly PermissionKey[];

const sharedStaffPermissions = [
  permissionKeys.shared.inventory.view,
] as const satisfies readonly PermissionKey[];

const sharedViewerPermissions = [
  permissionKeys.shared.analytics.view,
  permissionKeys.shared.inventory.view,
  permissionKeys.shared.cashflow.view,
  permissionKeys.shared.reports.view,
  permissionKeys.shared.financialReports.view,
  permissionKeys.shared.settings.view,
] as const satisfies readonly PermissionKey[];

export const rolePermissionMap: Record<Role, readonly PermissionKey[]> = {
  OWNER: [
    ...restaurantOwnerPermissions,
    ...retailOwnerPermissions,
    ...rawMaterialOwnerPermissions,
    ...serviceOwnerPermissions,
    ...sharedOwnerPermissions,
  ],
  MANAGER: [
    ...restaurantManagerPermissions,
    ...retailManagerPermissions,
    ...rawMaterialManagerPermissions,
    ...serviceManagerPermissions,
    ...sharedManagerPermissions,
  ],
  ADMIN: [
    ...restaurantManagerPermissions,
    ...retailManagerPermissions,
    ...rawMaterialManagerPermissions,
    ...serviceManagerPermissions,
    ...sharedManagerPermissions,
  ],
  OPERATOR: [
    ...restaurantOperatorPermissions,
    ...retailOperatorPermissions,
    ...rawMaterialOperatorPermissions,
    ...serviceOperatorPermissions,
    ...sharedOperatorPermissions,
  ],
  STAFF: [
    ...restaurantStaffPermissions,
    ...retailStaffPermissions,
    ...rawMaterialStaffPermissions,
    ...serviceStaffPermissions,
    ...sharedStaffPermissions,
  ],
  VIEWER: [
    ...restaurantViewerPermissions,
    ...retailViewerPermissions,
    ...rawMaterialViewerPermissions,
    ...serviceViewerPermissions,
    ...sharedViewerPermissions,
  ],
};

export function hasPermission(role: Role, permission: PermissionKey) {
  return rolePermissionMap[role].includes(permission);
}

export function requirePermission(role: Role, permission: PermissionKey) {
  if (hasPermission(role, permission)) return;

  throw new AppError({
    statusCode: 403,
    code: errorCodes.forbidden,
    message: "Forbidden.",
    details: { permission },
  });
}
