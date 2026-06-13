import type { OrderStatus, Role } from "@prisma/client";

export type PermissionKey =
  | "viewFinancialReports"
  | "manageMenu"
  | "accessOperations"
  | "manageInventory"
  | "usePos"
  | "manageTables"
  | "managePayments";

const managementRoles: readonly Role[] = ["OWNER", "MANAGER", "ADMIN"];
const operationsRoles: readonly Role[] = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF"];

const permissionRules: Record<PermissionKey, readonly Role[]> = {
  viewFinancialReports: managementRoles,
  manageMenu: managementRoles,
  accessOperations: operationsRoles,
  manageInventory: managementRoles,
  usePos: operationsRoles,
  manageTables: operationsRoles,
  managePayments: managementRoles,
};

const fullStatuses: readonly OrderStatus[] = ["PENDING_PAYMENT", "PAID", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"];
const opsStatuses: readonly OrderStatus[] = ["PAID", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"];

const orderStatusPermissions: Record<Role, readonly OrderStatus[]> = {
  OWNER: fullStatuses,
  MANAGER: fullStatuses,
  ADMIN: fullStatuses,
  OPERATOR: opsStatuses,
  STAFF: opsStatuses,
  VIEWER: [],
};

export function can(role: Role, permission: PermissionKey) {
  return permissionRules[permission].includes(role);
}

export function isOwnerRole(role: Role) {
  return role === "OWNER";
}

export function canTransitionOrderStatus(role: Role, statusOrCurrentStatus: OrderStatus, nextStatus?: OrderStatus) {
  const targetStatus = nextStatus ?? statusOrCurrentStatus;
  return orderStatusPermissions[role].includes(targetStatus);
}

export const canViewFinancialReports = (role: Role) => can(role, "viewFinancialReports");
export const canManageMenu = (role: Role) => can(role, "manageMenu");
export const canAccessKitchen = (role: Role) => can(role, "accessOperations");
export const canManageInventory = (role: Role) => can(role, "manageInventory");
