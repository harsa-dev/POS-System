import { Search, Trash2, X } from "lucide-react";

import { StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";

import {
  countGrantedPermissions,
  countRiskyPermissions,
  type ManagedRole,
} from "../role-permission-library";
import { roleFilterLabels, type RoleFilter } from "../team-management.types";
import { getStatusTone } from "./team-management-ui";

export function RoleRegistryPanel({
  filteredRoles,
  selectedRoleId,
  pendingDeleteRoleId,
  query,
  filter,
  totalPermissions,
  getAssignedMemberCount,
  onQueryChange,
  onFilterChange,
  onSelectRole,
  onRequestDeleteRole,
  onCancelDeleteRole,
  onConfirmDeleteRole,
}: {
  filteredRoles: ManagedRole[];
  selectedRoleId: string;
  pendingDeleteRoleId: string | null;
  query: string;
  filter: RoleFilter;
  totalPermissions: number;
  getAssignedMemberCount: (roleId: string) => number;
  onQueryChange: (query: string) => void;
  onFilterChange: (filter: RoleFilter) => void;
  onSelectRole: (roleId: string) => void;
  onRequestDeleteRole: (roleId: string) => void;
  onCancelDeleteRole: () => void;
  onConfirmDeleteRole: (roleId: string) => void;
}) {
  return (
    <DashboardPanel title="Role Registry" description="Registry role default + custom + job preset. Cari role, filter, pilih untuk diedit atau assign.">
      <div className="grid gap-4 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search role..."
              className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
            />
          </label>

          <select
            value={filter}
            onChange={(event) => onFilterChange(event.target.value as RoleFilter)}
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
          >
            {Object.entries(roleFilterLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3">
          {filteredRoles.map((role) => {
            const granted = countGrantedPermissions(role.permissions);
            const risk = countRiskyPermissions(role.permissions);
            const selected = role.id === selectedRoleId;
            const pendingDelete = pendingDeleteRoleId === role.id;
            const assignedMemberCount = getAssignedMemberCount(role.id);

            return (
              <article
                key={role.id}
                className={[
                  "rounded-2xl border p-4 transition",
                  selected ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/30",
                ].join(" ")}
              >
                <button type="button" onClick={() => onSelectRole(role.id)} className="w-full text-left">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{role.name}</p>
                        <StatusPill tone={getStatusTone(role.status)}>{role.status}</StatusPill>
                        <StatusPill tone="slate">{role.baseRole}</StatusPill>
                        <StatusPill tone={assignedMemberCount > 0 ? "blue" : "slate"}>{assignedMemberCount} users</StatusPill>
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
                            onRequestDeleteRole(role.id);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              event.stopPropagation();
                              onRequestDeleteRole(role.id);
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
                </button>

                {pendingDelete && (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                    <p className="font-semibold">Confirm custom role deletion</p>
                    <p className="mt-1 leading-6">
                      {assignedMemberCount > 0
                        ? `${assignedMemberCount} assigned member(s) will be moved to Viewer. Still dummy, still dangerous enough to deserve a warning.`
                        : "This custom role will be removed from the local dummy store."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => onConfirmDeleteRole(role.id)} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700">
                        <Trash2 className="h-4 w-4" />
                        Delete role
                      </button>
                      <button type="button" onClick={onCancelDeleteRole} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-900 transition hover:bg-rose-100">
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </DashboardPanel>
  );
}
