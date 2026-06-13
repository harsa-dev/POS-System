"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  KeyRound,
  Library,
  LockKeyhole,
  Plus,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import { DashboardPanel, DashboardShell } from "@/features/shared/dashboard";
import type { DashboardTone } from "@/features/shared/types";

import {
  clonePermissionState,
  countGrantedPermissions,
  countRiskyPermissions,
  countTotalPermissions,
  createAccessLog,
  createDraftFromTemplate,
  findTemplate,
  getPermissionDiff,
  getPermissionKeys,
  permissionModules,
  roleIdFromName,
  roleTemplateLibrary,
  validateRoleName,
  type ManagedRole,
  type PermissionActionId,
  type PermissionState,
  type SystemRole,
  type TeamMemberStatus,
} from "./role-permission-library";
import {
  exportRolePermissionStore,
  loadRolePermissionStore,
  resetRolePermissionStore,
  saveRolePermissionStore,
  type RolePermissionStoreState,
} from "./role-permission-store";

type DraftRole = {
  id?: string;
  name: string;
  description: string;
  baseRole: SystemRole;
  permissions: PermissionState;
};

type RoleFilter = "all" | "locked" | "custom" | "risk";

const baseRoles: SystemRole[] = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF", "VIEWER"];

const statusTone: Record<string, DashboardTone> = {
  Active: "green",
  Pending: "amber",
  Suspended: "rose",
  Locked: "slate",
  Custom: "blue",
  Draft: "amber",
};

const filterLabels: Record<RoleFilter, string> = {
  all: "All roles",
  locked: "System locked",
  custom: "Custom roles",
  risk: "Risky access",
};

function getStatusTone(status: string): DashboardTone {
  return statusTone[status] ?? "slate";
}

function hasPermission(permissions: PermissionState, moduleId: string, actionId: PermissionActionId) {
  return (permissions[moduleId] ?? []).includes(actionId);
}

function roleToDraft(role: ManagedRole): DraftRole {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    baseRole: role.baseRole,
    permissions: clonePermissionState(role.permissions),
  };
}

function buildPolicyPayload(role: ManagedRole | DraftRole) {
  return {
    roleName: role.name,
    baseRole: role.baseRole,
    locked: "locked" in role ? role.locked : false,
    permissions: getPermissionKeys(role.permissions),
  };
}

function createTemplateDraft(templateId: string): DraftRole {
  return createDraftFromTemplate(findTemplate(templateId));
}

function PermissionCheckbox({
  checked,
  disabled,
  label,
  description,
  destructive,
  elevated,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  description: string;
  destructive?: boolean;
  elevated?: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={[
        "flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition",
        checked ? "border-primary/40 bg-primary/5" : "border-border bg-background hover:bg-muted/30",
        disabled ? "cursor-not-allowed opacity-60" : "",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-1 h-4 w-4 rounded border-border"
      />
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
          {label}
          {destructive && <StatusPill tone="rose">Risk</StatusPill>}
          {elevated && <StatusPill tone="amber">Elevated</StatusPill>}
        </span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

function MiniStat({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone: DashboardTone;
}) {
  return <StatCard label={label} value={value} note={note} icon={Icon} tone={tone} />;
}

export function TeamManagementRolePermissionPage() {
  const [store, setStore] = useState<RolePermissionStoreState>(() => loadRolePermissionStore());
  const [selectedTemplateId, setSelectedTemplateId] = useState("operations-supervisor-template");
  const [selectedRoleId, setSelectedRoleId] = useState("owner-default");
  const [draft, setDraft] = useState<DraftRole>(() => createTemplateDraft("operations-supervisor-template"));
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [selectedMemberId, setSelectedMemberId] = useState("usr-001");
  const [selectedAssignRoleId, setSelectedAssignRoleId] = useState("operator-default");
  const [importText, setImportText] = useState("");
  const [notice, setNotice] = useState("Dummy role builder ready. Nothing is saved to backend yet, because apparently civilization demands staging first.");

  const { roles, members, logs } = store;
  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0];
  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? members[0];

  const totalPermissions = useMemo(() => countTotalPermissions(), []);
  const draftPermissionCount = useMemo(() => countGrantedPermissions(draft.permissions), [draft.permissions]);
  const draftRiskCount = useMemo(() => countRiskyPermissions(draft.permissions), [draft.permissions]);
  const customRoleCount = roles.filter((role) => !role.locked).length;
  const lockedRoleCount = roles.filter((role) => role.locked).length;

  const filteredRoles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return roles.filter((role) => {
      const matchesQuery =
        !normalizedQuery ||
        role.name.toLowerCase().includes(normalizedQuery) ||
        role.description.toLowerCase().includes(normalizedQuery) ||
        role.baseRole.toLowerCase().includes(normalizedQuery);

      const matchesFilter =
        filter === "all" ||
        (filter === "locked" && role.locked) ||
        (filter === "custom" && !role.locked) ||
        (filter === "risk" && countRiskyPermissions(role.permissions) > 0);

      return matchesQuery && matchesFilter;
    });
  }, [filter, query, roles]);

  const selectedRolePayload = useMemo(() => JSON.stringify(buildPolicyPayload(selectedRole), null, 2), [selectedRole]);
  const draftPayload = useMemo(() => JSON.stringify(buildPolicyPayload(draft), null, 2), [draft]);

  useEffect(() => {
    saveRolePermissionStore(store);
  }, [store]);

  function updateStore(updater: (current: RolePermissionStoreState) => RolePermissionStoreState) {
    setStore((current) => updater(current));
  }

  function selectTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    setDraft(createTemplateDraft(templateId));
  }

  function selectRole(roleId: string) {
    const role = roles.find((item) => item.id === roleId);
    if (!role) return;

    setSelectedRoleId(role.id);
    setDraft(roleToDraft(role));
  }

  function togglePermission(moduleId: string, actionId: PermissionActionId) {
    setDraft((current) => {
      const nextActions = new Set(current.permissions[moduleId] ?? []);

      if (nextActions.has(actionId)) {
        nextActions.delete(actionId);
      } else {
        nextActions.add(actionId);
      }

      return {
        ...current,
        permissions: {
          ...current.permissions,
          [moduleId]: Array.from(nextActions),
        },
      };
    });
  }

  function setModulePermissions(moduleId: string, mode: "all" | "none" | "view") {
    const module = permissionModules.find((item) => item.id === moduleId);
    if (!module) return;

    const actions =
      mode === "all"
        ? module.actions.map((action) => action.id)
        : mode === "view"
          ? module.actions.some((action) => action.id === "view")
            ? ["view" as PermissionActionId]
            : []
          : [];

    setDraft((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [moduleId]: actions,
      },
    }));
  }

  function saveDraftAsRole() {
    const error = validateRoleName(draft.name, roles, draft.id);
    if (error) {
      setNotice(error);
      return;
    }

    const now = new Date().toISOString();

    if (draft.id) {
      const existing = roles.find((role) => role.id === draft.id);

      if (!existing || existing.locked) {
        setNotice("Locked system roles cannot be overwritten. Clone first, because chaos needs at least one guard rail.");
        return;
      }

      const diff = getPermissionDiff(existing.permissions, draft.permissions);

      updateStore((current) => ({
        ...current,
        roles: current.roles.map((role) =>
          role.id === draft.id
            ? {
                ...role,
                name: draft.name.trim(),
                description: draft.description.trim(),
                baseRole: draft.baseRole,
                permissions: clonePermissionState(draft.permissions),
                updatedAt: now,
                status: "Custom",
              }
            : role,
        ),
        logs: [
          createAccessLog(
            "UPDATE_ROLE",
            draft.name.trim(),
            `Added ${diff.added.length} and removed ${diff.removed.length} permissions.`,
          ),
          ...current.logs,
        ],
      }));

      setNotice("Custom role updated in local dummy store.");
      return;
    }

    const role: ManagedRole = {
      id: roleIdFromName(draft.name),
      name: draft.name.trim(),
      baseRole: draft.baseRole,
      category: "library",
      locked: false,
      description: draft.description.trim() || "Custom role created from dummy permission builder.",
      recommendedFor: ["Custom business workflow"],
      permissions: clonePermissionState(draft.permissions),
      assignedUsers: 0,
      status: "Draft",
      createdAt: now,
      updatedAt: now,
    };

    updateStore((current) => ({
      ...current,
      roles: [role, ...current.roles],
      logs: [
        createAccessLog("CREATE_ROLE", role.name, `Created with ${countGrantedPermissions(role.permissions)} permissions.`),
        ...current.logs,
      ],
    }));

    setSelectedRoleId(role.id);
    setDraft(roleToDraft(role));
    setNotice("Custom role created in local dummy store.");
  }

  function cloneSelectedRole() {
    if (!selectedRole) return;

    const now = new Date().toISOString();
    const role: ManagedRole = {
      ...selectedRole,
      id: roleIdFromName(`${selectedRole.name} copy`),
      name: `${selectedRole.name} Copy`,
      locked: false,
      category: "library",
      assignedUsers: 0,
      status: "Draft",
      permissions: clonePermissionState(selectedRole.permissions),
      createdAt: now,
      updatedAt: now,
    };

    updateStore((current) => ({
      ...current,
      roles: [role, ...current.roles],
      logs: [createAccessLog("CLONE_ROLE", role.name, `Cloned from ${selectedRole.name}.`), ...current.logs],
    }));

    setSelectedRoleId(role.id);
    setDraft(roleToDraft(role));
    setNotice("Selected role cloned. Edit it before assigning to humans, those fragile production incidents.");
  }

  function deleteRole(roleId: string) {
    const target = roles.find((role) => role.id === roleId);
    if (!target || target.locked) return;

    const fallbackRoleId = "viewer-default";

    updateStore((current) => ({
      ...current,
      roles: current.roles.filter((role) => role.id !== roleId),
      members: current.members.map((member) =>
        member.roleId === roleId ? { ...member, roleId: fallbackRoleId } : member,
      ),
      logs: [
        createAccessLog("DELETE_ROLE", target.name, "Deleted custom role and moved assigned users to Viewer."),
        ...current.logs,
      ],
    }));

    setSelectedRoleId("owner-default");
    setDraft(createTemplateDraft(selectedTemplateId));
    setNotice("Custom role deleted. Assigned dummy users were moved to Viewer.");
  }

  function assignRoleToMember() {
    const role = roles.find((item) => item.id === selectedAssignRoleId);
    if (!selectedMember || !role) return;

    updateStore((current) => ({
      ...current,
      members: current.members.map((member) =>
        member.id === selectedMember.id ? { ...member, roleId: role.id, status: "Active" as TeamMemberStatus } : member,
      ),
      logs: [
        createAccessLog("ASSIGN_ROLE", selectedMember.name, `Assigned role ${role.name}.`),
        ...current.logs,
      ],
    }));

    setNotice(`Assigned ${role.name} to ${selectedMember.name} in local dummy store.`);
  }

  function resetDemo() {
    const next = resetRolePermissionStore();
    setStore(next);
    setSelectedRoleId("owner-default");
    setDraft(createTemplateDraft("operations-supervisor-template"));
    setNotice("Demo role store reset.");
  }

  function exportState() {
    const payload = exportRolePermissionStore(store);
    void navigator.clipboard?.writeText(payload);
    setImportText(payload);
    setNotice("Export JSON copied to clipboard and textarea.");
  }

  function importState() {
    try {
      const parsed = JSON.parse(importText) as RolePermissionStoreState;
      if (parsed.version !== 2 || !Array.isArray(parsed.roles) || !Array.isArray(parsed.members)) {
        throw new Error("Invalid payload.");
      }

      setStore({
        version: 2,
        roles: parsed.roles,
        members: parsed.members,
        logs: [
          createAccessLog("RESET_DEMO", "Imported state", "Imported dummy role permission JSON."),
          ...(Array.isArray(parsed.logs) ? parsed.logs : []),
        ],
      });
      setNotice("Imported dummy role permission state.");
    } catch {
      setNotice("Import failed. JSON payload is invalid.");
    }
  }

  return (
    <DashboardShell
      title="Team Management"
      description="Advanced dummy shared dashboard untuk role library, permission matrix, assignment flow, policy payload, dan audit-style changelog."
    >
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        {notice}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="System Roles" value={String(lockedRoleCount)} note="Default, locked, tidak bisa dihapus" icon={LockKeyhole} tone="slate" />
        <MiniStat label="Custom Roles" value={String(customRoleCount)} note="Persisted in localStorage dummy" icon={ShieldCheck} tone="blue" />
        <MiniStat label="Granted Actions" value={`${draftPermissionCount}/${totalPermissions}`} note={`${draftRiskCount} elevated/destructive in draft`} icon={KeyRound} tone={draftRiskCount > 4 ? "rose" : "green"} />
        <MiniStat label="Team Members" value={String(members.length)} note="Dummy users with assignable roles" icon={Users} tone="amber" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardPanel title="Role Library & Draft" description="Default roles locked. Custom roles can be created, edited, cloned, assigned, exported, and reset. Human civilization trembles before localStorage.">
          <div className="grid gap-4 p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_170px]">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Template</span>
                <select
                  value={selectedTemplateId}
                  onChange={(event) => selectTemplate(event.target.value)}
                  className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
                >
                  {roleTemplateLibrary.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} · {template.category === "default" ? "Default" : "Library"}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Base role</span>
                <select
                  value={draft.baseRole}
                  onChange={(event) => setDraft((current) => ({ ...current, baseRole: event.target.value as SystemRole }))}
                  className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
                >
                  {baseRoles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Library className="h-4 w-4 text-primary" />
                <p className="font-medium text-foreground">{findTemplate(selectedTemplateId).name}</p>
                {findTemplate(selectedTemplateId).locked && <StatusPill tone="slate">Locked base</StatusPill>}
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{findTemplate(selectedTemplateId).description}</p>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Role name</span>
              <input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Example: Branch Inventory Approver"
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Description</span>
              <textarea
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                rows={3}
                className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
              />
            </label>

            <div className="grid gap-2 rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-semibold text-foreground">Risk guard preview</p>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Draft ini punya <strong>{draftRiskCount}</strong> elevated/destructive permissions. Di backend nanti ini harus butuh owner/admin approval.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={saveDraftAsRole} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90">
                <Save className="h-4 w-4" />
                Save Draft Role
              </button>
              <button type="button" onClick={cloneSelectedRole} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted">
                <Copy className="h-4 w-4" />
                Clone Selected
              </button>
              <button type="button" onClick={resetDemo} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted">
                <RefreshCcw className="h-4 w-4" />
                Reset Demo
              </button>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Permission Matrix" description="Centang permission per module. Select all/view-only/none disiapkan supaya nanti enak disambung ke API permission policy.">
          <div className="grid max-h-[760px] gap-4 overflow-auto p-4">
            {permissionModules.map((module) => (
              <section key={module.id} className="rounded-2xl border border-border bg-muted/10 p-4">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{module.label}</p>
                      <StatusPill tone={module.scope === "admin" ? "rose" : module.scope === "finance" ? "amber" : "blue"}>
                        {module.scope}
                      </StatusPill>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{module.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setModulePermissions(module.id, "all")} className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted">All</button>
                    <button type="button" onClick={() => setModulePermissions(module.id, "view")} className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted">View only</button>
                    <button type="button" onClick={() => setModulePermissions(module.id, "none")} className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted">None</button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {module.actions.map((action) => (
                    <PermissionCheckbox
                      key={`${module.id}-${action.id}`}
                      checked={hasPermission(draft.permissions, module.id, action.id)}
                      label={action.label}
                      description={action.description}
                      destructive={action.destructive}
                      elevated={action.elevated}
                      onChange={() => togglePermission(module.id, action.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </DashboardPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <DashboardPanel title="Role Registry" description="Cari role, filter locked/custom/risky, pilih role untuk diedit atau assign. Default tetap terkunci.">
          <div className="grid gap-4 p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_180px]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search role, description, base role..."
                  className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
                />
              </label>

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value as RoleFilter)}
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
              >
                {Object.entries(filterLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-3">
              {filteredRoles.map((role) => {
                const granted = countGrantedPermissions(role.permissions);
                const risk = countRiskyPermissions(role.permissions);
                const selected = role.id === selectedRoleId;

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => selectRole(role.id)}
                    className={[
                      "w-full rounded-2xl border p-4 text-left transition",
                      selected ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/30",
                    ].join(" ")}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">{role.name}</p>
                          <StatusPill tone={getStatusTone(role.status)}>{role.status}</StatusPill>
                          <StatusPill tone="slate">{role.baseRole}</StatusPill>
                          {risk > 0 && <StatusPill tone="amber">{risk} risk</StatusPill>}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{role.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusPill tone="green">{granted}/{totalPermissions}</StatusPill>
                        {!role.locked && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteRole(role.id);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                event.stopPropagation();
                                deleteRole(role.id);
                              }
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-rose-50 hover:text-rose-600"
                            aria-label={`Delete ${role.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{role.assignedUsers} assigned users</span>
                      <span>•</span>
                      <span>{role.recommendedFor.join(", ")}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Assign Role to Team" description="Dummy assignment flow. Nanti ini jadi UserRoleAssignment dengan businessId scope, bukan role nempel random di user table seperti tambalan ban.">
          <div className="grid gap-4 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Member</span>
                <select
                  value={selectedMemberId}
                  onChange={(event) => setSelectedMemberId(event.target.value)}
                  className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Role</span>
                <select
                  value={selectedAssignRoleId}
                  onChange={(event) => setSelectedAssignRoleId(event.target.value)}
                  className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={assignRoleToMember}
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              <UserCog className="h-4 w-4" />
              Assign Role
            </button>

            <div className="rounded-2xl border border-border bg-background">
              <div className="border-b border-border p-4">
                <p className="font-semibold text-foreground">Team Assignment Preview</p>
                <p className="mt-1 text-sm text-muted-foreground">Role sekarang dibaca dari registry, bukan string liar.</p>
              </div>
              {members.map((member) => {
                const role = roles.find((item) => item.id === member.roleId);

                return (
                  <div key={member.id} className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{member.email} · {member.area}</p>
                    </div>
                    <div className="text-right">
                      <StatusPill tone={getStatusTone(member.status)}>{member.status}</StatusPill>
                      <p className="mt-1 text-xs text-muted-foreground">{role?.name ?? "Unknown role"}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <p className="mb-2 text-sm font-semibold text-foreground">Selected role policy payload</p>
              <pre className="max-h-56 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">{selectedRolePayload}</pre>
            </div>
          </div>
        </DashboardPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardPanel title="Import / Export Dummy Policy" description="Export JSON buat disimulasikan antar browser/local dev. Import tetap divalidasi basic supaya tidak jadi tempat sampah JSON liar.">
          <div className="grid gap-4 p-4">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={exportState} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted">
                <Download className="h-4 w-4" />
                Export JSON
              </button>
              <button type="button" onClick={importState} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted">
                <Upload className="h-4 w-4" />
                Import JSON
              </button>
            </div>

            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder="Exported dummy role permission JSON will appear here..."
              rows={10}
              className="rounded-xl border border-border bg-background px-3 py-3 font-mono text-xs outline-none ring-primary/20 transition focus:ring-4"
            />

            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <p className="mb-2 text-sm font-semibold text-foreground">Draft policy payload</p>
              <pre className="max-h-56 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">{draftPayload}</pre>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Access Changelog" description="Audit-style dummy log untuk role create/update/clone/delete/assign. Nanti ini bisa masuk AuditLog backend.">
          <div className="grid max-h-[560px] gap-3 overflow-auto p-4">
            {logs.map((log) => (
              <article key={log.id} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <p className="font-semibold text-foreground">{log.action}</p>
                  <StatusPill tone="slate">{new Date(log.at).toLocaleString()}</StatusPill>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{log.target}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{log.note}</p>
                <p className="mt-2 text-xs text-muted-foreground">Actor: {log.actor}</p>
              </article>
            ))}
          </div>
        </DashboardPanel>
      </div>
    </DashboardShell>
  );
}
