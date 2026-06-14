import type { PermissionState, SystemRole, TeamMemberStatus } from "./role-permission-library";
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
export type MemberStatusFilter = "all" | TeamMemberStatus;

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

export const memberStatusFilterLabels: Record<MemberStatusFilter, string> = {
  all: "All statuses",
  Active: "Active",
  Pending: "Pending",
  Suspended: "Suspended",
};
