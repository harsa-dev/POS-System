import type { Role } from "@prisma/client";

import { permissionKeys, requirePermission } from "../permissions/index.js";

export const requireFinancialReportView = (role: Role) =>
  requirePermission(role, permissionKeys.shared.financialReports.view);

export const requireFinancialReportExport = (role: Role) =>
  requirePermission(role, permissionKeys.shared.financialReports.export);