import type { Request, Response } from "express";
import type { Role } from "../../lib/auth.js";

import { requireModeAccess, requireRole } from "../../lib/auth.js";
import { permissionKeys, type PermissionKey } from "../permissions/permission-registry.js";

export const RAW_MATERIAL_PERMISSIONS = {
  view: permissionKeys.rawMaterial.dashboard.view,
  supplierManage: permissionKeys.rawMaterial.suppliers.manage,
  storageManage: permissionKeys.rawMaterial.storage.manage,
  intakeCreate: permissionKeys.rawMaterial.intakes.create,
  intakeUpdate: permissionKeys.rawMaterial.intakes.update,
  weighingRecord: permissionKeys.rawMaterial.weighing.create,
  batchManage: permissionKeys.rawMaterial.batches.manage,
  processingManage: permissionKeys.rawMaterial.processing.manage,
  kandangManage: permissionKeys.rawMaterial.pens.manage,
  stockAdjust: permissionKeys.rawMaterial.stockMovements.adjust,
  stockTransfer: permissionKeys.rawMaterial.stockMovements.transfer,
  stockConsume: permissionKeys.rawMaterial.stockMovements.consume,
} as const satisfies Record<string, PermissionKey>;

export type RawMaterialPermission =
  (typeof RAW_MATERIAL_PERMISSIONS)[keyof typeof RAW_MATERIAL_PERMISSIONS];

const VIEW_ROLES = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF", "VIEWER"] as const satisfies readonly Role[];
const OPERATE_ROLES = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF"] as const satisfies readonly Role[];
const STOCK_ROLES = ["OWNER", "MANAGER", "ADMIN", "OPERATOR"] as const satisfies readonly Role[];
const APPROVAL_ROLES = ["OWNER", "MANAGER", "ADMIN"] as const satisfies readonly Role[];

const RAW_MATERIAL_PERMISSION_ROLES = {
  [RAW_MATERIAL_PERMISSIONS.view]: VIEW_ROLES,
  [RAW_MATERIAL_PERMISSIONS.supplierManage]: OPERATE_ROLES,
  [RAW_MATERIAL_PERMISSIONS.storageManage]: OPERATE_ROLES,
  [RAW_MATERIAL_PERMISSIONS.intakeCreate]: OPERATE_ROLES,
  [RAW_MATERIAL_PERMISSIONS.intakeUpdate]: OPERATE_ROLES,
  [RAW_MATERIAL_PERMISSIONS.weighingRecord]: OPERATE_ROLES,
  [RAW_MATERIAL_PERMISSIONS.batchManage]: STOCK_ROLES,
  [RAW_MATERIAL_PERMISSIONS.processingManage]: STOCK_ROLES,
  [RAW_MATERIAL_PERMISSIONS.kandangManage]: OPERATE_ROLES,
  [RAW_MATERIAL_PERMISSIONS.stockAdjust]: APPROVAL_ROLES,
  [RAW_MATERIAL_PERMISSIONS.stockTransfer]: STOCK_ROLES,
  [RAW_MATERIAL_PERMISSIONS.stockConsume]: STOCK_ROLES,
} as const satisfies Record<RawMaterialPermission, readonly Role[]>;

export function getRawMaterialPermissionRoles(permission: RawMaterialPermission) {
  return [...RAW_MATERIAL_PERMISSION_ROLES[permission]];
}

export async function requireRawMaterialPermission(
  req: Request,
  res: Response,
  permission: RawMaterialPermission,
) {
  const user = await requireRole(req, res, getRawMaterialPermissionRoles(permission));
  if (!user) return null;

  await requireModeAccess(user, "raw-material");

  return user;
}
