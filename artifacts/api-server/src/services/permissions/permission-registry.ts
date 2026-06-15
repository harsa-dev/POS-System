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

const ownerPermissions = [
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

const managerPermissions = [
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
] as const satisfies readonly PermissionKey[];

const operatorPermissions = [
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
  permissionKeys.shared.analytics.view,
  permissionKeys.shared.analytics.operationalView,
  permissionKeys.shared.inventory.view,
  permissionKeys.shared.cashflow.view,
  permissionKeys.shared.cashflow.sync,
] as const satisfies readonly PermissionKey[];

const staffPermissions = [
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
  permissionKeys.shared.inventory.view,
] as const satisfies readonly PermissionKey[];

const viewerPermissions = [
  permissionKeys.restaurant.dashboard.view,
  permissionKeys.restaurant.sharedDashboard.view,
  permissionKeys.restaurant.orders.view,
  permissionKeys.restaurant.kitchen.view,
  permissionKeys.restaurant.serving.view,
  permissionKeys.restaurant.workflow.preview,
  permissionKeys.restaurant.tables.view,
  permissionKeys.restaurant.menu.view,
  permissionKeys.shared.analytics.view,
  permissionKeys.shared.inventory.view,
  permissionKeys.shared.cashflow.view,
  permissionKeys.shared.reports.view,
  permissionKeys.shared.financialReports.view,
  permissionKeys.shared.settings.view,
] as const satisfies readonly PermissionKey[];

export const rolePermissionMap: Record<Role, readonly PermissionKey[]> = {
  OWNER: ownerPermissions,
  MANAGER: managerPermissions,
  ADMIN: managerPermissions,
  OPERATOR: operatorPermissions,
  STAFF: staffPermissions,
  VIEWER: viewerPermissions,
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
