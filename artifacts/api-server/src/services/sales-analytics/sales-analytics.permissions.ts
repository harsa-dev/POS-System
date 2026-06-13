import type { Role } from "@prisma/client";

import {
  hasPermission,
  permissionKeys,
  requirePermission,
} from "../permissions/index.js";

export const requireSalesAnalyticsView = (role: Role) =>
  requirePermission(role, permissionKeys.shared.analytics.operationalView);

export const requireSalesAnalyticsExport = (role: Role) =>
  requirePermission(role, permissionKeys.shared.analytics.export);

export const canViewSalesAnalyticsProfit = (role: Role) =>
  hasPermission(role, permissionKeys.shared.analytics.profitView);

export const canExportSalesAnalytics = (role: Role) =>
  hasPermission(role, permissionKeys.shared.analytics.export);

export const getSalesAnalyticsAccess = (role: Role) => ({
  canViewOperational: hasPermission(
    role,
    permissionKeys.shared.analytics.operationalView,
  ),
  canViewProfit: canViewSalesAnalyticsProfit(role),
  canExport: canExportSalesAnalytics(role),
});
