import type { Role } from "@prisma/client";

import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";

export const permissionKeys = {
  restaurant: {
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
    },
    kitchen: {
      view: "restaurant.kitchen.view",
      update: "restaurant.kitchen.update",
    },
    serving: {
      view: "restaurant.serving.view",
      update: "restaurant.serving.update",
    },
    tables: {
      view: "restaurant.tables.view",
      update: "restaurant.tables.update",
    },
  },
  shared: {
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

export const rolePermissionMap: Record<Role, readonly PermissionKey[]> = {
  OWNER: [
    permissionKeys.restaurant.orders.view,
    permissionKeys.restaurant.orders.create,
    permissionKeys.restaurant.orders.approve,
    permissionKeys.restaurant.orders.cancel,
    permissionKeys.restaurant.orders.updateStatus,

    permissionKeys.restaurant.payments.view,
    permissionKeys.restaurant.payments.create,

    permissionKeys.restaurant.kitchen.view,
    permissionKeys.restaurant.kitchen.update,

    permissionKeys.restaurant.serving.view,
    permissionKeys.restaurant.serving.update,

    permissionKeys.restaurant.tables.view,
    permissionKeys.restaurant.tables.update,

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
  ],

  MANAGER: [
    permissionKeys.restaurant.orders.view,
    permissionKeys.restaurant.orders.create,
    permissionKeys.restaurant.orders.approve,
    permissionKeys.restaurant.orders.cancel,
    permissionKeys.restaurant.orders.updateStatus,

    permissionKeys.restaurant.payments.view,
    permissionKeys.restaurant.payments.create,

    permissionKeys.restaurant.kitchen.view,
    permissionKeys.restaurant.kitchen.update,

    permissionKeys.restaurant.serving.view,
    permissionKeys.restaurant.serving.update,

    permissionKeys.restaurant.tables.view,
    permissionKeys.restaurant.tables.update,

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
  ],

  CASHIER: [
    permissionKeys.restaurant.orders.view,
    permissionKeys.restaurant.orders.create,
    permissionKeys.restaurant.orders.approve,
    permissionKeys.restaurant.orders.cancel,

    permissionKeys.restaurant.payments.view,
    permissionKeys.restaurant.payments.create,

    permissionKeys.shared.cashflow.view,
    permissionKeys.shared.cashflow.sync,
  ],

  KITCHEN: [
    permissionKeys.restaurant.orders.view,

    permissionKeys.restaurant.kitchen.view,
    permissionKeys.restaurant.kitchen.update,
  ],

  SERVER: [
    permissionKeys.restaurant.orders.view,

    permissionKeys.restaurant.serving.view,
    permissionKeys.restaurant.serving.update,

    permissionKeys.restaurant.tables.view,
    permissionKeys.restaurant.tables.update,
  ],
};

export function hasPermission(role: Role, permission: PermissionKey) {
  return (rolePermissionMap[role] as readonly PermissionKey[]).includes(
    permission,
  );
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