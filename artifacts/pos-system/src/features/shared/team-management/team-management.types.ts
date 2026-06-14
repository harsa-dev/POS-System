import type { PermissionState, SystemRole } from "./role-permission-library";
import type { BusinessRoleSector } from "./job-role-library";

export type DraftRole = {
  id?: string;
  name: string;
  description: string;
  baseRole: SystemRole;
  permissions: PermissionState;
  sourceJobId?: string;
};

export type RoleFilter = "all" | "locked" | "custom" | "risk";

export const baseRoles: SystemRole[] = [
  "OWNER",
  "MANAGER",
  "ADMIN",
  "OPERATOR",
  "STAFF",
  "VIEWER",
];

export const businessRoleSectors: BusinessRoleSector[] = [
  "restaurant",
  "retail",
  "raw-material",
  "custom-business",
];

export const roleFilterLabels: Record<RoleFilter, string> = {
  all: "All roles",
  locked: "System locked",
  custom: "Custom roles",
  risk: "Risky access",
};
