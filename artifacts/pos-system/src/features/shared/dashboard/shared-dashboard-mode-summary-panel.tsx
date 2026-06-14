import type { ElementType } from "react";
import { Layers } from "lucide-react";

import { DashboardPanel } from "./dashboard-shell";
import type { SharedDashboardModeContext } from "./shared-dashboard-mode-context";

export function SharedDashboardModeSummaryPanel({
  context,
  icon: Icon = Layers,
}: {
  context: SharedDashboardModeContext;
  icon?: ElementType;
}) {
  return (
    <DashboardPanel
      title="Shared Dashboard Mode Context"
      description="Shared dashboards are scoped by active business mode before loading data."
    >
      <div className="grid gap-3 p-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Mode</p>
              <p className="mt-1 text-lg font-bold text-foreground">{context.activeModeShortLabel}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Query Scope</p>
          <p className="mt-2 break-all text-sm font-semibold text-foreground">{context.queryScopeKey}</p>
          <p className="mt-2 text-xs text-muted-foreground">API mode header: {context.apiModeHeader}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Supported Modes</p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {context.supportedModeLabels.join(", ")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {context.isSupported ? "Current mode is supported." : "Current mode is not supported."}
          </p>
        </div>
      </div>
    </DashboardPanel>
  );
}
