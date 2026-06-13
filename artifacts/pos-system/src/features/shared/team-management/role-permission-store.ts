import {
  createAccessLog,
  createDefaultManagedRoles,
  createDefaultMembers,
  type AccessChangeLog,
  type ManagedRole,
  type TeamMember,
} from "./role-permission-library";

const STORAGE_KEY = "pos-v3-demo-role-permissions";

export type RolePermissionStoreState = {
  version: 2;
  roles: ManagedRole[];
  members: TeamMember[];
  logs: AccessChangeLog[];
};

function createInitialStore(): RolePermissionStoreState {
  return {
    version: 2,
    roles: createDefaultManagedRoles(),
    members: createDefaultMembers(),
    logs: [
      createAccessLog(
        "RESET_DEMO",
        "Role Permission Demo",
        "Initialized dummy role library and team assignment state.",
      ),
    ],
  };
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadRolePermissionStore(): RolePermissionStoreState {
  if (!isBrowser()) return createInitialStore();

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return createInitialStore();

  try {
    const parsed = JSON.parse(raw) as RolePermissionStoreState;
    if (parsed?.version !== 2 || !Array.isArray(parsed.roles) || !Array.isArray(parsed.members)) {
      return createInitialStore();
    }

    return {
      version: 2,
      roles: parsed.roles,
      members: parsed.members,
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    };
  } catch {
    return createInitialStore();
  }
}

export function saveRolePermissionStore(state: RolePermissionStoreState) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetRolePermissionStore() {
  const next = createInitialStore();
  saveRolePermissionStore(next);
  return next;
}

export function exportRolePermissionStore(state: RolePermissionStoreState) {
  return JSON.stringify(state, null, 2);
}
