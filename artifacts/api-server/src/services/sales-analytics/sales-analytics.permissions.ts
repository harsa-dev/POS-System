import type { Role } from "@prisma/client";

import { permissionKeys, requirePermission } from "../permissions/index.js";

export const requireSalesAnalyticsView = (role: Role) =>
  requirePermission(role, permissionKeys.shared.analytics.view);

export const requireSalesAnalyticsExport = (role: Role) =>
  requirePermission(role, permissionKeys.shared.analytics.export);
