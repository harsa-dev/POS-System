import {
  createAccessLog,
  createDefaultManagedRoles,
  createDefaultMembers,
  permissionModules,
  permissionState,
  type AccessChangeLog,
  type ManagedRole,
  type PermissionActionId,
  type PermissionState,
  type SystemRole,
  type TeamMember,
  type TeamMemberStatus,
} from "./role-permission-library";

const STORAGE_KEY = "pos-v3-demo-role-permissions-real-job-library";
const FALLBACK_ROLE_ID = "viewer-default";

const systemRoles: SystemRole[] = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF", "VIEWER"];
const roleCategories: ManagedRole["category"][] = ["default", "library", "job"];
const roleStatuses: ManagedRole["status"][] = ["Locked", "Custom", "Draft", "Job Preset"];
const teamMemberStatuses: TeamMemberStatus[] = ["Active", "Pending", "Suspended"];
const accessLogActions: AccessChangeLog["action"][] = [
  "CREATE_ROLE",
  "UPDATE_ROLE",
  "CLONE_ROLE",
  "DELETE_ROLE",
  "ASSIGN_ROLE",
  "RESET_DEMO",
  "APPLY_JOB_PRESET",
];

export type RolePermissionStoreState = {
  version: 3;
  roles: ManagedRole[];
  members: TeamMember[];
  logs: AccessChangeLog[];
};

function createInitialStore(): RolePermissionStoreState {
  return {
    version: 3,
    roles: createDefaultManagedRoles(),
    members: createDefaultMembers(),
    logs: [
      createAccessLog(
        "RESET_DEMO",
        "Role Permission Demo",
        "Initialized dummy role library with real-world job profile presets.",
      ),
    ],
  };
}

function isBrowser() {
  return typeof window !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizePermissions(value: unknown): PermissionState | null {
  if (!isRecord(value)) return null;

  const seed: Record<string, PermissionActionId[]> = {};

  for (const module of permissionModules) {
    const rawActions = value[module.id];
    if (!Array.isArray(rawActions)) continue;

    const validActionIds = new Set(module.actions.map((action) => action.id));
    seed[module.id] = rawActions.filter(
      (action): action is PermissionActionId => typeof action === "string" && validActionIds.has(action as PermissionActionId),
    );
  }

  return permissionState(seed);
}

function normalizeRole(value: unknown): ManagedRole | null {
  if (!isRecord(value)) return null;

  const id = stringValue(value.id);
  const name = stringValue(value.name);
  const description = stringValue(value.description, "Custom local role.");
  const permissions = normalizePermissions(value.permissions);

  if (!id || !name || !permissions) return null;

  const baseRole = systemRoles.includes(value.baseRole as SystemRole) ? (value.baseRole as SystemRole) : "VIEWER";
  const category = roleCategories.includes(value.category as ManagedRole["category"])
    ? (value.category as ManagedRole["category"])
    : "library";
  const locked = typeof value.locked === "boolean" ? value.locked : category === "default";
  const status = roleStatuses.includes(value.status as ManagedRole["status"])
    ? (value.status as ManagedRole["status"])
    : locked
      ? "Locked"
      : "Custom";

  return {
    id,
    name,
    baseRole,
    category,
    locked,
    description,
    recommendedFor: stringList(value.recommendedFor),
    permissions,
    assignedUsers: typeof value.assignedUsers === "number" ? value.assignedUsers : 0,
    status,
    createdAt: stringValue(value.createdAt, new Date().toISOString()),
    updatedAt: stringValue(value.updatedAt, new Date().toISOString()),
  };
}

function normalizeMember(value: unknown, roleIds: Set<string>): TeamMember | null {
  if (!isRecord(value)) return null;

  const id = stringValue(value.id);
  const name = stringValue(value.name);
  const email = stringValue(value.email);

  if (!id || !name || !email) return null;

  const roleId = typeof value.roleId === "string" && roleIds.has(value.roleId) ? value.roleId : FALLBACK_ROLE_ID;
  const status = teamMemberStatuses.includes(value.status as TeamMemberStatus)
    ? (value.status as TeamMemberStatus)
    : "Pending";

  return {
    id,
    name,
    email,
    roleId: roleIds.has(roleId) ? roleId : [...roleIds][0] ?? FALLBACK_ROLE_ID,
    area: stringValue(value.area, "Unassigned"),
    status,
  };
}

function normalizeLog(value: unknown): AccessChangeLog | null {
  if (!isRecord(value)) return null;

  const action = accessLogActions.includes(value.action as AccessChangeLog["action"])
    ? (value.action as AccessChangeLog["action"])
    : null;

  if (!action) return null;

  return {
    id: stringValue(value.id, `log-${Date.now()}`),
    at: stringValue(value.at, new Date().toISOString()),
    actor: stringValue(value.actor, "Demo Owner"),
    action,
    target: stringValue(value.target, "Unknown target"),
    note: stringValue(value.note, "Imported local access log."),
  };
}

export function normalizeRolePermissionStore(value: unknown): RolePermissionStoreState {
  const initial = createInitialStore();
  if (!isRecord(value)) return initial;

  const importedRoles = Array.isArray(value.roles) ? value.roles.map(normalizeRole).filter((role): role is ManagedRole => Boolean(role)) : [];
  const defaultRoles = createDefaultManagedRoles();
  const roleMap = new Map<string, ManagedRole>();

  for (const role of defaultRoles) roleMap.set(role.id, role);
  for (const role of importedRoles) roleMap.set(role.id, role);

  const roles = [...roleMap.values()];
  const roleIds = new Set(roles.map((role) => role.id));

  const members = Array.isArray(value.members)
    ? value.members.map((member) => normalizeMember(member, roleIds)).filter((member): member is TeamMember => Boolean(member))
    : initial.members;

  const logs = Array.isArray(value.logs)
    ? value.logs.map(normalizeLog).filter((log): log is AccessChangeLog => Boolean(log))
    : initial.logs;

  return {
    version: 3,
    roles,
    members: members.length > 0 ? members : initial.members,
    logs: logs.length > 0 ? logs : initial.logs,
  };
}

export function loadRolePermissionStore(): RolePermissionStoreState {
  if (!isBrowser()) return createInitialStore();

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return createInitialStore();

  try {
    return normalizeRolePermissionStore(JSON.parse(raw));
  } catch {
    return createInitialStore();
  }
}

export function saveRolePermissionStore(state: RolePermissionStoreState) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeRolePermissionStore(state)));
}

export function resetRolePermissionStore() {
  const next = createInitialStore();
  saveRolePermissionStore(next);
  return next;
}

export function exportRolePermissionStore(state: RolePermissionStoreState) {
  return JSON.stringify(normalizeRolePermissionStore(state), null, 2);
}
