import type {
  AccessChangeLog,
  ManagedRole,
  PermissionState,
  SystemRole,
  TeamMember,
  TeamMemberStatus,
} from "./role-permission-library";
import type { BusinessRoleSector } from "./job-role-library";

export const TEAM_MANAGEMENT_API_CONTRACT_VERSION = "team-management.v1.local-contract";

export const TEAM_MANAGEMENT_API_ENDPOINTS = {
  snapshot: "/api/team-management/snapshot",
  roles: "/api/team-management/roles",
  role: (roleId: string) => `/api/team-management/roles/${encodeURIComponent(roleId)}`,
  members: "/api/team-management/members",
  member: (memberId: string) => `/api/team-management/members/${encodeURIComponent(memberId)}`,
  memberRole: (memberId: string) => `/api/team-management/members/${encodeURIComponent(memberId)}/role`,
  memberStatus: (memberId: string) => `/api/team-management/members/${encodeURIComponent(memberId)}/status`,
  auditLog: "/api/team-management/audit-log",
} as const;

export type TeamManagementDataSource = "localStorage" | "api";
export type PersistableTeamMemberStatus = Extract<TeamMemberStatus, "Active" | "Suspended">;

export type TeamManagementSnapshotDto = {
  contractVersion: typeof TEAM_MANAGEMENT_API_CONTRACT_VERSION;
  source: TeamManagementDataSource;
  generatedAt: string;
  business?: {
    id: string;
    name: string;
    mode: BusinessRoleSector;
    type: string;
  };
  viewer?: {
    userId: string;
    role: SystemRole;
  };
  roles: ManagedRole[];
  members: TeamMember[];
  logs: AccessChangeLog[];
};

export type CreateTeamRolePayload = {
  name: string;
  description: string;
  baseRole: SystemRole;
  permissions: PermissionState;
  sourceJobId?: string;
};

export type UpdateTeamRolePayload = Partial<CreateTeamRolePayload> & {
  expectedUpdatedAt?: string;
};

export type AssignTeamMemberRolePayload = {
  roleId: string;
  expectedMemberStatus?: TeamMemberStatus;
};

export type UpdateTeamMemberStatusPayload = {
  status: PersistableTeamMemberStatus;
  reason?: string;
};

export type DeleteTeamRolePayload = {
  fallbackRoleId?: string;
  expectedUpdatedAt?: string;
};

export type TeamManagementMutationResultDto = {
  snapshot: TeamManagementSnapshotDto;
  log: AccessChangeLog;
  message: string;
};

export type TeamManagementListQuery = {
  search?: string;
  roleId?: string;
  status?: TeamMemberStatus;
  page?: number;
  limit?: number;
};

export type TeamManagementAuditQuery = {
  action?: AccessChangeLog["action"];
  target?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};
