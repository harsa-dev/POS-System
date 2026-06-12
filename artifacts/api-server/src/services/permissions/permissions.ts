import type { OrderStatus, Role } from "@prisma/client";

export type PermissionKey =
  | "viewFinancialReports"
  | "manageMenu"
  | "accessKitchen"
  | "manageInventory"
  | "usePos"
  | "manageTables"
  | "managePayments";

const permissionRules: Record<PermissionKey, readonly Role[]> = {
  viewFinancialReports: ["OWNER", "MANAGER"],
  manageMenu: ["OWNER", "MANAGER"],
  accessKitchen: ["OWNER", "MANAGER", "KITCHEN"],
  manageInventory: ["OWNER", "MANAGER"],
  usePos: ["OWNER", "MANAGER", "CASHIER"],
  manageTables: ["OWNER", "MANAGER", "SERVER"],
  managePayments: ["OWNER", "MANAGER"],
};

const orderStatusPermissions: Record<Role, readonly OrderStatus[]> = {
  OWNER: [
    "PENDING_PAYMENT",
    "PAID",
    "PREPARING",
    "READY",
    "SERVED",
    "COMPLETED",
    "CANCELLED",
  ],
  MANAGER: [
    "PENDING_PAYMENT",
    "PAID",
    "PREPARING",
    "READY",
    "SERVED",
    "COMPLETED",
    "CANCELLED",
  ],
  CASHIER: ["PAID", "CANCELLED", "COMPLETED"],
  KITCHEN: ["PREPARING", "READY", "CANCELLED"],
  SERVER: ["SERVED", "COMPLETED", "CANCELLED"],
};

export function can(role: Role, permission: PermissionKey) {
  return permissionRules[permission].includes(role);
}

export function isOwnerRole(role: Role) {
  return role === "OWNER";
}

export function canTransitionOrderStatus(
  role: Role,
  statusOrCurrentStatus: OrderStatus,
  nextStatus?: OrderStatus,
) {
  const targetStatus = nextStatus ?? statusOrCurrentStatus;

  return orderStatusPermissions[role].includes(targetStatus);
}

export const canViewFinancialReports = (role: Role) => can(role, "viewFinancialReports");
export const canManageMenu = (role: Role) => can(role, "manageMenu");
export const canAccessKitchen = (role: Role) => can(role, "accessKitchen");
export const canManageInventory = (role: Role) => can(role, "manageInventory");