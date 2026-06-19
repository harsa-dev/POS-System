import type { Request, Response } from "express";
import type { Role } from "../../lib/auth.js";

import { requireModeAccess, requireRole } from "../../lib/auth.js";
import { permissionKeys, type PermissionKey } from "../../services/permissions/permission-registry.js";

export const SERVICE_BUSINESS_PERMISSIONS = {
  view: permissionKeys.service.dashboard.view,
  requestCreate: permissionKeys.service.jobs.create,
  jobStatusUpdate: permissionKeys.service.jobs.update,
  costCreate: permissionKeys.service.costs.create,
  quoteCreate: permissionKeys.service.quotes.create,
  quoteApprove: permissionKeys.service.quotes.approve,
  invoiceCreate: permissionKeys.service.invoices.create,
  invoicePaymentRecord: permissionKeys.service.invoices.recordPayment,
} as const satisfies Record<string, PermissionKey>;

export type ServiceBusinessPermission =
  (typeof SERVICE_BUSINESS_PERMISSIONS)[keyof typeof SERVICE_BUSINESS_PERMISSIONS];

const VIEW_ROLES = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF", "VIEWER"] as const satisfies readonly Role[];
const OPERATE_ROLES = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF"] as const satisfies readonly Role[];
const BILLING_ROLES = ["OWNER", "MANAGER", "ADMIN", "OPERATOR"] as const satisfies readonly Role[];
const APPROVAL_ROLES = ["OWNER", "MANAGER", "ADMIN"] as const satisfies readonly Role[];

const SERVICE_BUSINESS_PERMISSION_ROLES = {
  [SERVICE_BUSINESS_PERMISSIONS.view]: VIEW_ROLES,
  [SERVICE_BUSINESS_PERMISSIONS.requestCreate]: OPERATE_ROLES,
  [SERVICE_BUSINESS_PERMISSIONS.jobStatusUpdate]: OPERATE_ROLES,
  [SERVICE_BUSINESS_PERMISSIONS.costCreate]: OPERATE_ROLES,
  [SERVICE_BUSINESS_PERMISSIONS.quoteCreate]: BILLING_ROLES,
  [SERVICE_BUSINESS_PERMISSIONS.quoteApprove]: APPROVAL_ROLES,
  [SERVICE_BUSINESS_PERMISSIONS.invoiceCreate]: BILLING_ROLES,
  [SERVICE_BUSINESS_PERMISSIONS.invoicePaymentRecord]: BILLING_ROLES,
} as const satisfies Record<ServiceBusinessPermission, readonly Role[]>;

export function getServiceBusinessPermissionRoles(permission: ServiceBusinessPermission) {
  return [...SERVICE_BUSINESS_PERMISSION_ROLES[permission]];
}

export async function requireServiceBusinessPermission(
  req: Request,
  res: Response,
  permission: ServiceBusinessPermission,
) {
  const user = await requireRole(req, res, getServiceBusinessPermissionRoles(permission));
  if (!user) return null;

  await requireModeAccess(user, "custom-business");

  return user;
}
