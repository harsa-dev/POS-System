import { Search } from "lucide-react";

import { StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";

import {
  countRiskyPermissions,
  type ManagedRole,
  type TeamMember,
} from "../role-permission-library";
import {
  memberStatusFilterLabels,
  type MemberStatusFilter,
} from "../team-management.types";
import { getStatusTone } from "./team-management-ui";

export function TeamMemberTable({
  members,
  roles,
  memberQuery,
  memberStatusFilter,
  memberRoleFilter,
  selectedMemberId,
  onMemberQueryChange,
  onMemberStatusFilterChange,
  onMemberRoleFilterChange,
  onSelectMember,
}: {
  members: TeamMember[];
  roles: ManagedRole[];
  memberQuery: string;
  memberStatusFilter: MemberStatusFilter;
  memberRoleFilter: string;
  selectedMemberId: string;
  onMemberQueryChange: (query: string) => void;
  onMemberStatusFilterChange: (status: MemberStatusFilter) => void;
  onMemberRoleFilterChange: (roleId: string) => void;
  onSelectMember: (memberId: string) => void;
}) {
  return (
    <DashboardPanel
      title="Team Members"
      description="Searchable dummy member directory. Masih localStorage, tapi setidaknya tidak lagi cuma daftar pajangan."
    >
      <div className="grid gap-4 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={memberQuery}
              onChange={(event) => onMemberQueryChange(event.target.value)}
              placeholder="Search member, email, area..."
              className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
            />
          </label>

          <select
            value={memberStatusFilter}
            onChange={(event) => onMemberStatusFilterChange(event.target.value as MemberStatusFilter)}
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
          >
            {Object.entries(memberStatusFilterLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={memberRoleFilter}
            onChange={(event) => onMemberRoleFilterChange(event.target.value)}
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
          >
            <option value="all">All roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-background">
          <table className="min-w-[860px] w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Member</th>
                <th className="px-4 py-3 font-semibold">Area</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Assigned Role</th>
                <th className="px-4 py-3 font-semibold">Base</th>
                <th className="px-4 py-3 font-semibold">Risk</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No members match the current filters.
                  </td>
                </tr>
              )}

              {members.map((member) => {
                const role = roles.find((item) => item.id === member.roleId);
                const risk = role ? countRiskyPermissions(role.permissions) : 0;
                const selected = member.id === selectedMemberId;

                return (
                  <tr key={member.id} className={selected ? "border-b border-border bg-primary/5 last:border-b-0" : "border-b border-border last:border-b-0"}>
                    <td className="px-4 py-4">
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{member.email}</p>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{member.area}</td>
                    <td className="px-4 py-4"><StatusPill tone={getStatusTone(member.status)}>{member.status}</StatusPill></td>
                    <td className="px-4 py-4 text-muted-foreground">{role?.name ?? "Unknown role"}</td>
                    <td className="px-4 py-4"><StatusPill tone="slate">{role?.baseRole ?? "-"}</StatusPill></td>
                    <td className="px-4 py-4"><StatusPill tone={risk > 0 ? "amber" : "green"}>{risk} risk</StatusPill></td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => onSelectMember(member.id)}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted"
                      >
                        {selected ? "Selected" : "Select"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardPanel>
  );
}
