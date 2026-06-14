import {
  TEAM_MANAGEMENT_API_CONTRACT_VERSION,
  type TeamManagementSnapshotDto,
} from "./team-management-contract";
import type { RolePermissionStoreState } from "./role-permission-store";

export type TeamManagementSnapshotCounts = {
  roles: number;
  members: number;
  activeMembers: number;
  pendingMembers: number;
  suspendedMembers: number;
  logs: number;
};

export type TeamManagementSnapshotComparison = {
  local: TeamManagementSnapshotCounts;
  backend: TeamManagementSnapshotCounts;
  deltas: TeamManagementSnapshotCounts;
  hasDrift: boolean;
  warnings: string[];
};

export function buildLocalTeamManagementSnapshot(store: RolePermissionStoreState): TeamManagementSnapshotDto {
  return {
    contractVersion: TEAM_MANAGEMENT_API_CONTRACT_VERSION,
    source: "localStorage",
    generatedAt: new Date().toISOString(),
    roles: store.roles,
    members: store.members,
    logs: store.logs,
  };
}

export function countTeamManagementSnapshot(snapshot: TeamManagementSnapshotDto): TeamManagementSnapshotCounts {
  return {
    roles: snapshot.roles.length,
    members: snapshot.members.length,
    activeMembers: snapshot.members.filter((member) => member.status === "Active").length,
    pendingMembers: snapshot.members.filter((member) => member.status === "Pending").length,
    suspendedMembers: snapshot.members.filter((member) => member.status === "Suspended").length,
    logs: snapshot.logs.length,
  };
}

function diffCounts(local: TeamManagementSnapshotCounts, backend: TeamManagementSnapshotCounts): TeamManagementSnapshotCounts {
  return {
    roles: backend.roles - local.roles,
    members: backend.members - local.members,
    activeMembers: backend.activeMembers - local.activeMembers,
    pendingMembers: backend.pendingMembers - local.pendingMembers,
    suspendedMembers: backend.suspendedMembers - local.suspendedMembers,
    logs: backend.logs - local.logs,
  };
}

function formatDelta(label: string, value: number) {
  if (value === 0) return null;
  const direction = value > 0 ? "more" : "fewer";
  return `Backend has ${Math.abs(value)} ${direction} ${label} than localStorage.`;
}

export function compareTeamManagementSnapshots(
  localSnapshot: TeamManagementSnapshotDto,
  backendSnapshot: TeamManagementSnapshotDto,
): TeamManagementSnapshotComparison {
  const local = countTeamManagementSnapshot(localSnapshot);
  const backend = countTeamManagementSnapshot(backendSnapshot);
  const deltas = diffCounts(local, backend);

  const warnings = [
    formatDelta("roles", deltas.roles),
    formatDelta("members", deltas.members),
    formatDelta("active members", deltas.activeMembers),
    formatDelta("pending members", deltas.pendingMembers),
    formatDelta("suspended members", deltas.suspendedMembers),
    formatDelta("logs", deltas.logs),
  ].filter((warning): warning is string => Boolean(warning));

  if (backendSnapshot.contractVersion !== TEAM_MANAGEMENT_API_CONTRACT_VERSION) {
    warnings.unshift(`Backend contract version mismatch: ${backendSnapshot.contractVersion}`);
  }

  return {
    local,
    backend,
    deltas,
    hasDrift: warnings.length > 0,
    warnings,
  };
}
