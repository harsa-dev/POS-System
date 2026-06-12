import type { Role } from "@prisma/client";

import { permissionKeys, requirePermission } from "../permissions/index.js";

export function requireCashflowView(role: Role) {
  requirePermission(role, permissionKeys.shared.cashflow.view);
}

export function requireCashflowCreate(role: Role) {
  requirePermission(role, permissionKeys.shared.cashflow.create);
}

export function requireCashflowSync(role: Role) {
  requirePermission(role, permissionKeys.shared.cashflow.sync);
}

export function requireCashflowVoid(role: Role) {
  requirePermission(role, permissionKeys.shared.cashflow.void);
}

export function requireCashflowExport(role: Role) {
  requirePermission(role, permissionKeys.shared.cashflow.export);
}
