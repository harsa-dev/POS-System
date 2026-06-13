import type { Request, Response } from "express";
import type { Role } from "../../lib/auth.js";

import { requireRole } from "../../lib/auth.js";

export const RAW_MATERIAL_PERMISSIONS = {
  view: "raw-material.view",
  supplierManage: "raw-material.supplier.manage",
  storageManage: "raw-material.storage.manage",
  intakeCreate: "raw-material.intake.create",
  intakeUpdate: "raw-material.intake.update",
  weighingRecord: "raw-material.weighing.record",
  batchManage: "raw-material.batch.manage",
  processingManage: "raw-material.processing.manage",
  kandangManage: "raw-material.kandang.manage",
  stockAdjust: "raw-material.stock.adjust",
  stockTransfer: "raw-material.stock.transfer",
  stockConsume: "raw-material.stock.consume",
} as const;

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
  return requireRole(req, res, getRawMaterialPermissionRoles(permission));
}
