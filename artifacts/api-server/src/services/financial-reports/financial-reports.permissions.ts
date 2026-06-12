import type { Role } from "@prisma/client";

import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";

export const financialReportPermissionKeys = {
  view: "shared.financialReports.view",
  export: "shared.financialReports.export",
} as const;

export type FinancialReportPermissionKey =
  (typeof financialReportPermissionKeys)[keyof typeof financialReportPermissionKeys];

const financialReportRolePermissionMap: Record<
  Role,
  readonly FinancialReportPermissionKey[]
> = {
  OWNER: [
    financialReportPermissionKeys.view,
    financialReportPermissionKeys.export,
  ],
  MANAGER: [
    financialReportPermissionKeys.view,
    financialReportPermissionKeys.export,
  ],
  CASHIER: [],
  KITCHEN: [],
  SERVER: [],
};

export function hasFinancialReportPermission(
  role: Role,
  permission: FinancialReportPermissionKey,
) {
  return financialReportRolePermissionMap[role].includes(permission);
}

function requireFinancialReportPermission(
  role: Role,
  permission: FinancialReportPermissionKey,
) {
  if (hasFinancialReportPermission(role, permission)) return;

  throw new AppError({
    statusCode: 403,
    code: errorCodes.forbidden,
    message: "Forbidden.",
    details: { permission },
  });
}

export const requireFinancialReportView = (role: Role) =>
  requireFinancialReportPermission(role, financialReportPermissionKeys.view);

export const requireFinancialReportExport = (role: Role) =>
  requireFinancialReportPermission(role, financialReportPermissionKeys.export);
