import { AlertTriangle, Download, Upload, UserCog } from "lucide-react";

import { StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";

import {
  countGrantedPermissions,
  countRiskyPermissions,
  type ManagedRole,
  type TeamMember,
} from "../role-permission-library";
import { getStatusTone } from "./team-management-ui";

export function AssignmentImportExportPanel({
  members,
  roles,
  selectedMemberId,
  selectedAssignRoleId,
  importText,
  selectedRolePayload,
  onMemberChange,
  onAssignRoleChange,
  onAssignRoleToMember,
  onExportState,
  onImportState,
  onImportTextChange,
}: {
  members: TeamMember[];
  roles: ManagedRole[];
  selectedMemberId: string;
  selectedAssignRoleId: string;
  importText: string;
  selectedRolePayload: string;
  onMemberChange: (memberId: string) => void;
  onAssignRoleChange: (roleId: string) => void;
  onAssignRoleToMember: () => void;
  onExportState: () => void;
  onImportState: () => void;
  onImportTextChange: (value: string) => void;
}) {
  const selectedMember = members.find((member) => member.id === selectedMemberId);
  const currentRole = selectedMember ? roles.find((role) => role.id === selectedMember.roleId) : undefined;
  const targetRole = roles.find((role) => role.id === selectedAssignRoleId);
  const currentGranted = currentRole ? countGrantedPermissions(currentRole.permissions) : 0;
  const targetGranted = targetRole ? countGrantedPermissions(targetRole.permissions) : 0;
  const currentRisk = currentRole ? countRiskyPermissions(currentRole.permissions) : 0;
  const targetRisk = targetRole ? countRiskyPermissions(targetRole.permissions) : 0;
  const permissionDelta = targetGranted - currentGranted;
  const riskDelta = targetRisk - currentRisk;

  return (
    <DashboardPanel title="Assignment + Import / Export" description="Dummy assignment flow + local JSON portability. Belum backend, tapi contract shape sudah kelihatan.">
      <div className="grid gap-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Member</span>
            <select value={selectedMemberId} onChange={(event) => onMemberChange(event.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none ring-primary/20 transition focus:ring-4">
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Role</span>
            <select value={selectedAssignRoleId} onChange={(event) => onAssignRoleChange(event.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none ring-primary/20 transition focus:ring-4">
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <div className="mb-3 flex items-center gap-2 font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Assignment impact preview
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-xl border border-border bg-background p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Current</p>
              <p className="mt-1 font-medium text-foreground">{currentRole?.name ?? "Unknown role"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{currentGranted} permissions · {currentRisk} risky</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Target</p>
              <p className="mt-1 font-medium text-foreground">{targetRole?.name ?? "Unknown role"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{targetGranted} permissions · {targetRisk} risky</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill tone={permissionDelta > 0 ? "amber" : permissionDelta < 0 ? "blue" : "slate"}>
              {permissionDelta >= 0 ? "+" : ""}{permissionDelta} permissions
            </StatusPill>
            <StatusPill tone={riskDelta > 0 ? "rose" : riskDelta < 0 ? "green" : "slate"}>
              {riskDelta >= 0 ? "+" : ""}{riskDelta} risky
            </StatusPill>
          </div>
        </div>

        <button type="button" onClick={onAssignRoleToMember} className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90">
          <UserCog className="h-4 w-4" />
          Assign Role
        </button>

        <div className="rounded-2xl border border-border bg-background">
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

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onExportState} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted">
            <Download className="h-4 w-4" />
            Export JSON
          </button>
          <button type="button" onClick={onImportState} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted">
            <Upload className="h-4 w-4" />
            Import JSON
          </button>
        </div>

        <textarea value={importText} onChange={(event) => onImportTextChange(event.target.value)} rows={7} className="rounded-xl border border-border bg-background px-3 py-3 font-mono text-xs outline-none ring-primary/20 transition focus:ring-4" />

        <pre className="max-h-56 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">{selectedRolePayload}</pre>
      </div>
    </DashboardPanel>
  );
}
