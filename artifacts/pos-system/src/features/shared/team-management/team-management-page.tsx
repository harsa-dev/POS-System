"use client";

import { useEffect, useMemo, useState } from "react";

import { DashboardShell } from "@/features/shared/dashboard";

import {
  AccessChangelogPanel,
  AssignmentImportExportPanel,
  JobRolePresetPanel,
  PermissionMatrixPanel,
  RoleBuilderPanel,
  RoleRegistryPanel,
  TeamOverviewCards,
} from "./components";
import {
  getJobRoleById,
  jobRoleLibrary,
  type BusinessRoleSector,
  type JobRoleProfile,
} from "./job-role-library";
import {
  clonePermissionState,
  countGrantedPermissions,
  countRiskyPermissions,
  countTotalPermissions,
  createAccessLog,
  getPermissionDiff,
  getPermissionKeys,
  permissionModules,
  roleIdFromName,
  validateRoleName,
  type ManagedRole,
  type PermissionActionId,
  type TeamMemberStatus,
} from "./role-permission-library";
import {
  exportRolePermissionStore,
  loadRolePermissionStore,
  resetRolePermissionStore,
  saveRolePermissionStore,
  type RolePermissionStoreState,
} from "./role-permission-store";
import {
  baseRoles,
  businessRoleSectors,
  type DraftRole,
  type RoleFilter,
} from "./team-management.types";

function jobToDraft(job: JobRoleProfile): DraftRole {
  return {
    name: job.title,
    description: `${job.description} Responsibilities: ${job.responsibilities.join("; ")}.`,
    baseRole: job.baseRole,
    permissions: clonePermissionState(job.recommendedPermissions),
    sourceJobId: job.id,
  };
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
    sourceJobId: "sourceJobId" in role ? role.sourceJobId ?? null : null,
    permissions: getPermissionKeys(role.permissions),
  };
}

export function TeamManagementRolePermissionPage() {
  const [store, setStore] = useState<RolePermissionStoreState>(() => loadRolePermissionStore());
  const [selectedSector, setSelectedSector] = useState<BusinessRoleSector>("custom-business");
  const [selectedJobId, setSelectedJobId] = useState("service-operations-manager");
  const [selectedRoleId, setSelectedRoleId] = useState("owner-default");
  const [draft, setDraft] = useState<DraftRole>(() => jobToDraft(getJobRoleById("service-operations-manager")));
  const [query, setQuery] = useState("");
  const [jobQuery, setJobQuery] = useState("");
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [selectedMemberId, setSelectedMemberId] = useState("usr-001");
  const [selectedAssignRoleId, setSelectedAssignRoleId] = useState("operator-default");
  const [importText, setImportText] = useState("");
  const [notice, setNotice] = useState("Real-world job role library ready. Still dummy, but at least it stopped inventing jobs out of dashboard fog.");

  const { roles, members, logs } = store;
  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0];
  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? members[0];

  const totalPermissions = useMemo(() => countTotalPermissions(), []);
  const draftPermissionCount = useMemo(() => countGrantedPermissions(draft.permissions), [draft.permissions]);
  const draftRiskCount = useMemo(() => countRiskyPermissions(draft.permissions), [draft.permissions]);
  const customRoleCount = roles.filter((role) => !role.locked).length;
  const lockedRoleCount = roles.filter((role) => role.locked).length;

  const filteredJobRoles = useMemo(() => {
    const normalizedQuery = jobQuery.trim().toLowerCase();

    return jobRoleLibrary.filter((job) => {
      const matchesSector = job.sector === selectedSector;
      const matchesQuery =
        !normalizedQuery ||
        job.title.toLowerCase().includes(normalizedQuery) ||
        job.department.toLowerCase().includes(normalizedQuery) ||
        job.aliases.join(" ").toLowerCase().includes(normalizedQuery);

      return matchesSector && matchesQuery;
    });
  }, [jobQuery, selectedSector]);

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

  function applyJobPreset(jobId: string) {
    const job = getJobRoleById(jobId);
    setSelectedJobId(job.id);
    setSelectedSector(job.sector);
    setDraft(jobToDraft(job));
    setNotice(`Applied job preset: ${job.title}. Review permissions before saving. Shocking concept, reviewing access.`);
  }

  function togglePermission(moduleId: string, actionId: PermissionActionId) {
    setDraft((current) => {
      const nextActions = new Set(current.permissions[moduleId] ?? []);
      if (nextActions.has(actionId)) nextActions.delete(actionId);
      else nextActions.add(actionId);

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
        setNotice("Locked system roles cannot be overwritten. Clone first.");
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
          createAccessLog("UPDATE_ROLE", draft.name.trim(), `Added ${diff.added.length} and removed ${diff.removed.length} permissions.`),
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
      category: draft.sourceJobId ? "job" : "library",
      locked: false,
      description: draft.description.trim() || "Custom role created from job role library.",
      recommendedFor: draft.sourceJobId
        ? [getJobRoleById(draft.sourceJobId).sector, getJobRoleById(draft.sourceJobId).department]
        : ["Custom business workflow"],
      permissions: clonePermissionState(draft.permissions),
      assignedUsers: 0,
      status: draft.sourceJobId ? "Job Preset" : "Draft",
      createdAt: now,
      updatedAt: now,
    };

    updateStore((current) => ({
      ...current,
      roles: [role, ...current.roles],
      logs: [
        createAccessLog(
          draft.sourceJobId ? "APPLY_JOB_PRESET" : "CREATE_ROLE",
          role.name,
          `Created with ${countGrantedPermissions(role.permissions)} permissions.`,
        ),
        ...current.logs,
      ],
    }));

    setSelectedRoleId(role.id);
    setDraft(roleToDraft(role));
    setNotice("Role created in local dummy store.");
  }

  function selectRole(roleId: string) {
    const role = roles.find((item) => item.id === roleId);
    if (!role) return;

    setSelectedRoleId(role.id);
    setDraft(roleToDraft(role));
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
    setNotice("Selected role cloned.");
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
      logs: [createAccessLog("DELETE_ROLE", target.name, "Deleted custom role and moved assigned users to Viewer."), ...current.logs],
    }));

    setSelectedRoleId("owner-default");
    setNotice("Custom role deleted.");
  }

  function assignRoleToMember() {
    const role = roles.find((item) => item.id === selectedAssignRoleId);
    if (!selectedMember || !role) return;

    updateStore((current) => ({
      ...current,
      members: current.members.map((member) =>
        member.id === selectedMember.id ? { ...member, roleId: role.id, status: "Active" as TeamMemberStatus } : member,
      ),
      logs: [createAccessLog("ASSIGN_ROLE", selectedMember.name, `Assigned role ${role.name}.`), ...current.logs],
    }));

    setNotice(`Assigned ${role.name} to ${selectedMember.name} in local dummy store.`);
  }

  function resetDemo() {
    const next = resetRolePermissionStore();
    setStore(next);
    setSelectedRoleId("owner-default");
    applyJobPreset("service-operations-manager");
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
      if (parsed.version !== 3 || !Array.isArray(parsed.roles) || !Array.isArray(parsed.members)) {
        throw new Error("Invalid payload.");
      }

      setStore({
        version: 3,
        roles: parsed.roles,
        members: parsed.members,
        logs: [createAccessLog("RESET_DEMO", "Imported state", "Imported dummy role permission JSON."), ...(Array.isArray(parsed.logs) ? parsed.logs : [])],
      });
      setNotice("Imported dummy role permission state.");
    } catch {
      setNotice("Import failed. JSON payload is invalid.");
    }
  }

  return (
    <DashboardShell
      title="Team Management"
      description="Advanced role library with real-world job presets for Restaurant, Retail, Raw Material, and planned Custom Business."
    >
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{notice}</div>

      <TeamOverviewCards
        lockedRoleCount={lockedRoleCount}
        jobPresetCount={jobRoleLibrary.length}
        draftPermissionCount={draftPermissionCount}
        totalPermissions={totalPermissions}
        draftRiskCount={draftRiskCount}
        customRoleCount={customRoleCount}
      />

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <JobRolePresetPanel
          sectors={businessRoleSectors}
          selectedSector={selectedSector}
          selectedJobId={selectedJobId}
          jobQuery={jobQuery}
          filteredJobRoles={filteredJobRoles}
          onSectorChange={setSelectedSector}
          onJobQueryChange={setJobQuery}
          onApplyJobPreset={applyJobPreset}
        />

        <RoleBuilderPanel
          draft={draft}
          setDraft={setDraft}
          baseRoles={baseRoles}
          draftRiskCount={draftRiskCount}
          draftPayload={draftPayload}
          onSaveDraftAsRole={saveDraftAsRole}
          onCloneSelectedRole={cloneSelectedRole}
          onResetDemo={resetDemo}
        />
      </div>

      <PermissionMatrixPanel
        permissions={draft.permissions}
        onTogglePermission={togglePermission}
        onSetModulePermissions={setModulePermissions}
      />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <RoleRegistryPanel
          filteredRoles={filteredRoles}
          selectedRoleId={selectedRoleId}
          query={query}
          filter={filter}
          totalPermissions={totalPermissions}
          onQueryChange={setQuery}
          onFilterChange={setFilter}
          onSelectRole={selectRole}
          onDeleteRole={deleteRole}
        />

        <AssignmentImportExportPanel
          members={members}
          roles={roles}
          selectedMemberId={selectedMemberId}
          selectedAssignRoleId={selectedAssignRoleId}
          importText={importText}
          selectedRolePayload={selectedRolePayload}
          onMemberChange={setSelectedMemberId}
          onAssignRoleChange={setSelectedAssignRoleId}
          onAssignRoleToMember={assignRoleToMember}
          onExportState={exportState}
          onImportState={importState}
          onImportTextChange={setImportText}
        />
      </div>

      <AccessChangelogPanel logs={logs} />
    </DashboardShell>
  );
}
