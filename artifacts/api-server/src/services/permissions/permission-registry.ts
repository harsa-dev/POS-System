import type { Role } from "@prisma/client";

import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";

export const permissionKeys = {
  business: {
    orders: {
      view: "business.orders.view",
      create: "business.orders.create",
      approve: "business.orders.approve",
      cancel: "business.orders.cancel",
      updateStatus: "business.orders.update-status",
    },
    payments: {
      view: "business.payments.view",
      create: "business.payments.create",
    },
    operations: {
      view: "business.operations.view",
      update: "business.operations.update",
    },
    tables: {
      view: "business.tables.view",
      update: "business.tables.update",
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
      view: "shared.financialReports.view",
      export: "shared.financialReports.export",
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
  permissionKeys.business.orders.view,
  permissionKeys.business.orders.create,
  permissionKeys.business.orders.approve,
  permissionKeys.business.orders.cancel,
  permissionKeys.business.orders.updateStatus,
  permissionKeys.business.payments.view,
  permissionKeys.business.payments.create,
  permissionKeys.business.operations.view,
  permissionKeys.business.operations.update,
  permissionKeys.business.tables.view,
  permissionKeys.business.tables.update,
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
] as const;

const managerPermissions = [
  permissionKeys.business.orders.view,
  permissionKeys.business.orders.create,
  permissionKeys.business.orders.approve,
  permissionKeys.business.orders.cancel,
  permissionKeys.business.orders.updateStatus,
  permissionKeys.business.payments.view,
  permissionKeys.business.payments.create,
  permissionKeys.business.operations.view,
  permissionKeys.business.operations.update,
  permissionKeys.business.tables.view,
  permissionKeys.business.tables.update,
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
] as const;

const operatorPermissions = [
  permissionKeys.business.orders.view,
  permissionKeys.business.orders.create,
  permissionKeys.business.orders.approve,
  permissionKeys.business.orders.cancel,
  permissionKeys.business.orders.updateStatus,
  permissionKeys.business.payments.view,
  permissionKeys.business.payments.create,
  permissionKeys.business.operations.view,
  permissionKeys.business.operations.update,
  permissionKeys.business.tables.view,
  permissionKeys.business.tables.update,
  permissionKeys.shared.analytics.view,
  permissionKeys.shared.analytics.operationalView,
  permissionKeys.shared.inventory.view,
  permissionKeys.shared.cashflow.view,
  permissionKeys.shared.cashflow.sync,
] as const;

const staffPermissions = [
  permissionKeys.business.orders.view,
  permissionKeys.business.orders.create,
  permissionKeys.business.orders.updateStatus,
  permissionKeys.business.operations.view,
  permissionKeys.business.operations.update,
  permissionKeys.business.tables.view,
  permissionKeys.business.tables.update,
  permissionKeys.shared.inventory.view,
] as const;

const viewerPermissions = [
  permissionKeys.business.orders.view,
  permissionKeys.business.operations.view,
  permissionKeys.business.tables.view,
  permissionKeys.shared.analytics.view,
  permissionKeys.shared.inventory.view,
  permissionKeys.shared.cashflow.view,
  permissionKeys.shared.reports.view,
  permissionKeys.shared.financialReports.view,
  permissionKeys.shared.settings.view,
] as const;

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
