import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

import {
  TEAM_MANAGEMENT_API_ENDPOINTS,
  type AssignTeamMemberRolePayload,
  type CreateTeamRolePayload,
  type DeleteTeamRolePayload,
  type TeamManagementAuditQuery,
  type TeamManagementListQuery,
  type TeamManagementMutationResultDto,
  type TeamManagementSnapshotDto,
  type UpdateTeamMemberStatusPayload,
  type UpdateTeamRolePayload,
} from "./team-management-contract";
import type {
  AccessChangeLog,
  ManagedRole,
  TeamMember,
} from "./role-permission-library";

type ApiDataEnvelope<T> = ApiEnvelope<T> & { data: T };

type ApiListEnvelope<T> = ApiEnvelope<T> & {
  data: T;
  meta?: {
    pagination?: {
      page?: number;
      limit: number;
      totalItems?: number;
      totalPages?: number;
      hasNextPage?: boolean;
      hasPreviousPage?: boolean;
      nextCursor?: string | null;
    };
  };
};

type TeamManagementQueryInput = Partial<TeamManagementListQuery & TeamManagementAuditQuery>;

function buildQuery(params?: TeamManagementQueryInput) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    if (typeof value !== "string" && typeof value !== "number") continue;
    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const teamManagementApi = {
  getSnapshot() {
    return apiClient.get<ApiDataEnvelope<TeamManagementSnapshotDto>>(TEAM_MANAGEMENT_API_ENDPOINTS.snapshot);
  },

  listRoles(params?: Pick<TeamManagementListQuery, "search" | "page" | "limit">) {
    return apiClient.get<ApiListEnvelope<ManagedRole[]>>(
      `${TEAM_MANAGEMENT_API_ENDPOINTS.roles}${buildQuery(params)}`,
    );
  },

  createRole(payload: CreateTeamRolePayload) {
    return apiClient.post<ApiDataEnvelope<TeamManagementMutationResultDto>>(
      TEAM_MANAGEMENT_API_ENDPOINTS.roles,
      { json: payload },
    );
  },

  updateRole(roleId: string, payload: UpdateTeamRolePayload) {
    return apiClient.patch<ApiDataEnvelope<TeamManagementMutationResultDto>>(
      TEAM_MANAGEMENT_API_ENDPOINTS.role(roleId),
      { json: payload },
    );
  },

  deleteRole(roleId: string, payload?: DeleteTeamRolePayload) {
    return apiClient.delete<ApiDataEnvelope<TeamManagementMutationResultDto>>(
      TEAM_MANAGEMENT_API_ENDPOINTS.role(roleId),
      payload ? { json: payload } : undefined,
    );
  },

  listMembers(params?: TeamManagementListQuery) {
    return apiClient.get<ApiListEnvelope<TeamMember[]>>(
      `${TEAM_MANAGEMENT_API_ENDPOINTS.members}${buildQuery(params)}`,
    );
  },

  assignMemberRole(memberId: string, payload: AssignTeamMemberRolePayload) {
    return apiClient.patch<ApiDataEnvelope<TeamManagementMutationResultDto>>(
      TEAM_MANAGEMENT_API_ENDPOINTS.memberRole(memberId),
      { json: payload },
    );
  },

  updateMemberStatus(memberId: string, payload: UpdateTeamMemberStatusPayload) {
    return apiClient.patch<ApiDataEnvelope<TeamManagementMutationResultDto>>(
      TEAM_MANAGEMENT_API_ENDPOINTS.memberStatus(memberId),
      { json: payload },
    );
  },

  getAuditLog(params?: TeamManagementAuditQuery) {
    return apiClient.get<ApiListEnvelope<AccessChangeLog[]>>(
      `${TEAM_MANAGEMENT_API_ENDPOINTS.auditLog}${buildQuery(params)}`,
    );
  },
};
