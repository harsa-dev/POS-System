import { StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";
import type { DashboardTone } from "@/features/shared/types";

import {
  permissionModules,
  type PermissionActionId,
  type PermissionState,
} from "../role-permission-library";

function hasPermission(permissions: PermissionState, moduleId: string, actionId: PermissionActionId) {
  return (permissions[moduleId] ?? []).includes(actionId);
}

function getModuleScopeTone(scope: string): DashboardTone {
  if (scope === "admin") return "rose";
  if (scope === "finance") return "amber";
  return "blue";
}

function PermissionCheckbox({
  checked,
  label,
  description,
  destructive,
  elevated,
  onChange,
}: {
  checked: boolean;
  label: string;
  description: string;
  destructive?: boolean;
  elevated?: boolean;
  onChange: () => void;
}) {
  return (
    <label className={["flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition", checked ? "border-primary/40 bg-primary/5" : "border-border bg-background hover:bg-muted/30"].join(" ")}>
      <input type="checkbox" checked={checked} onChange={onChange} className="mt-1 h-4 w-4 rounded border-border" />
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

export function PermissionMatrixPanel({
  permissions,
  onTogglePermission,
  onSetModulePermissions,
}: {
  permissions: PermissionState;
  onTogglePermission: (moduleId: string, actionId: PermissionActionId) => void;
  onSetModulePermissions: (moduleId: string, mode: "all" | "none" | "view") => void;
}) {
  return (
    <DashboardPanel title="Permission Matrix" description="Permission tetap bisa diedit manual setelah memilih job preset. Ini pemisahan yang benar: job title bukan permission final.">
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        {permissionModules.map((module) => (
          <section key={module.id} className="rounded-2xl border border-border bg-muted/10 p-4">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{module.label}</p>
                  <StatusPill tone={getModuleScopeTone(module.scope)}>{module.scope}</StatusPill>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{module.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => onSetModulePermissions(module.id, "all")} className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted">All</button>
                <button type="button" onClick={() => onSetModulePermissions(module.id, "view")} className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted">View</button>
                <button type="button" onClick={() => onSetModulePermissions(module.id, "none")} className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted">None</button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {module.actions.map((action) => (
                <PermissionCheckbox
                  key={`${module.id}-${action.id}`}
                  checked={hasPermission(permissions, module.id, action.id)}
                  label={action.label}
                  description={action.description}
                  destructive={action.destructive}
                  elevated={action.elevated}
                  onChange={() => onTogglePermission(module.id, action.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </DashboardPanel>
  );
}
