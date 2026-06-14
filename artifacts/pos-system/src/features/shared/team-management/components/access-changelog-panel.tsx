import { CheckCircle2 } from "lucide-react";

import { StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";

import type { AccessChangeLog } from "../role-permission-library";

export function AccessChangelogPanel({ logs }: { logs: AccessChangeLog[] }) {
  return (
    <DashboardPanel title="Access Changelog" description="Audit-style dummy log. Backend nanti bisa pindah ke AuditLog business scope.">
      <div className="grid max-h-[420px] gap-3 overflow-auto p-4 md:grid-cols-2">
        {logs.map((log) => (
          <article key={log.id} className="rounded-2xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <p className="font-semibold text-foreground">{log.action}</p>
              <StatusPill tone="slate">{new Date(log.at).toLocaleString()}</StatusPill>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{log.target}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{log.note}</p>
          </article>
        ))}
      </div>
    </DashboardPanel>
  );
}
