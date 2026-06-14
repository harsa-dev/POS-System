import type { Dispatch, SetStateAction } from "react";
import { AlertTriangle, Copy, RefreshCcw, Save } from "lucide-react";

import { DashboardPanel } from "@/features/shared/dashboard";

import type { SystemRole } from "../role-permission-library";
import type { DraftRole } from "../team-management.types";

export function RoleBuilderPanel({
  draft,
  setDraft,
  baseRoles,
  draftRiskCount,
  draftPayload,
  onSaveDraftAsRole,
  onCloneSelectedRole,
  onResetDemo,
}: {
  draft: DraftRole;
  setDraft: Dispatch<SetStateAction<DraftRole>>;
  baseRoles: SystemRole[];
  draftRiskCount: number;
  draftPayload: string;
  onSaveDraftAsRole: () => void;
  onCloneSelectedRole: () => void;
  onResetDemo: () => void;
}) {
  return (
    <DashboardPanel
      title="Draft Role Builder"
      description="Job preset masuk ke sini. Review permission, ubah base role, lalu simpan sebagai custom role dummy."
    >
      <div className="grid gap-4 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Role name</span>
            <input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Base role</span>
            <select
              value={draft.baseRole}
              onChange={(event) => setDraft((current) => ({ ...current, baseRole: event.target.value as SystemRole }))}
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
            >
              {baseRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">Description</span>
          <textarea
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
            rows={4}
            className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
          />
        </label>

        <div className="rounded-2xl border border-border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
          <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Risk guard preview
          </div>
          Draft ini punya <strong>{draftRiskCount}</strong> elevated/destructive permissions. Backend nanti harus require approval untuk action berisiko.
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onSaveDraftAsRole} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90">
            <Save className="h-4 w-4" />
            Save Role
          </button>
          <button type="button" onClick={onCloneSelectedRole} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted">
            <Copy className="h-4 w-4" />
            Clone Selected
          </button>
          <button type="button" onClick={onResetDemo} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted">
            <RefreshCcw className="h-4 w-4" />
            Reset Demo
          </button>
        </div>

        <pre className="max-h-60 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">{draftPayload}</pre>
      </div>
    </DashboardPanel>
  );
}
