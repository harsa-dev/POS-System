"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, DatabaseZap, RefreshCw, Server } from "lucide-react";

import { StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";
import { getApiErrorMessage } from "@/lib/api/api-client";

import { teamManagementApi } from "../team-management-api";
import type { TeamManagementSnapshotDto } from "../team-management-contract";
import type { RolePermissionStoreState } from "../role-permission-store";
import {
  buildLocalTeamManagementSnapshot,
  compareTeamManagementSnapshots,
  type TeamManagementSnapshotCounts,
} from "../team-management-snapshot-compare";

type SnapshotStatus = "idle" | "loading" | "success" | "error";

function CountGrid({ title, counts }: { title: string; counts: TeamManagementSnapshotCounts }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-lg font-semibold text-foreground">{counts.roles}</p>
          <p className="text-xs text-muted-foreground">Roles</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">{counts.members}</p>
          <p className="text-xs text-muted-foreground">Members</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">{counts.logs}</p>
          <p className="text-xs text-muted-foreground">Logs</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">{counts.activeMembers}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">{counts.pendingMembers}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">{counts.suspendedMembers}</p>
          <p className="text-xs text-muted-foreground">Suspended</p>
        </div>
      </div>
    </div>
  );
}

export function SnapshotSyncPanel({ store }: { store: RolePermissionStoreState }) {
  const [status, setStatus] = useState<SnapshotStatus>("idle");
  const [backendSnapshot, setBackendSnapshot] = useState<TeamManagementSnapshotDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const localSnapshot = useMemo(() => buildLocalTeamManagementSnapshot(store), [store]);
  const comparison = useMemo(
    () => backendSnapshot ? compareTeamManagementSnapshots(localSnapshot, backendSnapshot) : null,
    [backendSnapshot, localSnapshot],
  );

  async function checkBackendSnapshot() {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await teamManagementApi.getSnapshot();
      setBackendSnapshot(response.data);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(getApiErrorMessage(error, "Failed to fetch backend Team Management snapshot."));
    }
  }

  return (
    <DashboardPanel
      title="Backend Snapshot Check"
      description="Manual comparison between localStorage demo state and the read-only backend snapshot. UI runtime still stays local until this is boringly reliable."
    >
      <div className="grid gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <DatabaseZap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">Snapshot adapter guard</p>
                <StatusPill tone={status === "success" ? "green" : status === "error" ? "rose" : status === "loading" ? "amber" : "slate"}>
                  {status}
                </StatusPill>
                {comparison && (
                  <StatusPill tone={comparison.hasDrift ? "amber" : "green"}>
                    {comparison.hasDrift ? "drift detected" : "counts aligned"}
                  </StatusPill>
                )}
              </div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                This does not replace local state. It only checks whether the backend snapshot is ready to become a future data source.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={checkBackendSnapshot}
            disabled={status === "loading"}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={status === "loading" ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Check Backend Snapshot
          </button>
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {comparison && (
          <div className="grid gap-4 xl:grid-cols-2">
            <CountGrid title="LocalStorage Snapshot" counts={comparison.local} />
            <CountGrid title="Backend Snapshot" counts={comparison.backend} />
          </div>
        )}

        {backendSnapshot && (
          <div className="rounded-2xl border border-border bg-background p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
              <Server className="h-4 w-4" />
              Backend metadata
            </div>
            <div className="mt-3 grid gap-2 text-muted-foreground md:grid-cols-2">
              <p>Source: {backendSnapshot.source}</p>
              <p>Generated: {new Date(backendSnapshot.generatedAt).toLocaleString()}</p>
              <p>Business: {backendSnapshot.business?.name ?? "-"}</p>
              <p>Viewer role: {backendSnapshot.viewer?.role ?? "-"}</p>
            </div>
          </div>
        )}

        {comparison?.warnings.length ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              Snapshot drift notes
            </div>
            <ul className="list-disc space-y-1 pl-5">
              {comparison.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </DashboardPanel>
  );
}
