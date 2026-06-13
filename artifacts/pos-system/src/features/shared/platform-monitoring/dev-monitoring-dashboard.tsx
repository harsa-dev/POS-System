"use client";

import {
  Activity,
  AlertTriangle,
  Bot,
  Database,
  GitBranch,
  Server,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import { DashboardPanel, DashboardShell } from "@/features/shared/dashboard";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import type { DashboardTone } from "@/features/shared/types";

import {
  devApiPreparationMocks,
  devMonitoringMetrics,
  devSchemaPreparation,
  devServiceHealthMocks,
  devTaskQueueMocks,
  devTenantModeSnapshots,
  getDevMonitoringSummary,
  type DevApiPreparation,
  type DevServiceHealth,
  type DevTaskQueueItem,
  type DevTenantModeSnapshot,
} from "./dev-monitoring.mock";

const statusTone: Record<string, DashboardTone> = {
  Healthy: "green",
  Warning: "amber",
  Critical: "rose",
  "Mock Only": "slate",
  Queued: "slate",
  "In Review": "amber",
  Blocked: "rose",
  Done: "green",
  Low: "slate",
  Medium: "amber",
  High: "rose",
};

function getTone(status: string): DashboardTone {
  return statusTone[status] ?? "slate";
}

const serviceColumns: DataTableColumn<DevServiceHealth>[] = [
  { key: "service", header: "Service", cell: (row) => <span className="font-medium text-foreground">{row.service}</span> },
  { key: "area", header: "Area", cell: (row) => <code className="text-xs text-muted-foreground">{row.area}</code> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={getTone(row.status)}>{row.status}</StatusPill> },
  { key: "uptime", header: "Uptime", cell: (row) => row.uptime },
  { key: "latency", header: "Latency", cell: (row) => row.latency },
  { key: "lastCheck", header: "Last Check", cell: (row) => row.lastCheck },
  { key: "owner", header: "Owner", cell: (row) => row.owner },
];

const modeColumns: DataTableColumn<DevTenantModeSnapshot>[] = [
  { key: "mode", header: "Business Mode", cell: (row) => <span className="font-medium text-foreground">{row.mode}</span> },
  { key: "tenants", header: "Tenants", cell: (row) => row.tenants },
  { key: "activeRoutes", header: "Active Routes", cell: (row) => row.activeRoutes },
  { key: "mockRoutes", header: "Mock Routes", cell: (row) => row.mockRoutes },
  { key: "risk", header: "Risk", cell: (row) => <StatusPill tone={getTone(row.risk)}>{row.risk}</StatusPill> },
];

const taskColumns: DataTableColumn<DevTaskQueueItem>[] = [
  { key: "task", header: "Task", cell: (row) => <span className="font-medium text-foreground">{row.task}</span> },
  { key: "source", header: "Source", cell: (row) => row.source },
  { key: "priority", header: "Priority", cell: (row) => <StatusPill tone={getTone(row.priority)}>{row.priority}</StatusPill> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={getTone(row.status)}>{row.status}</StatusPill> },
  { key: "target", header: "Target", cell: (row) => row.target },
];

const apiColumns: DataTableColumn<DevApiPreparation>[] = [
  { key: "domain", header: "Domain", cell: (row) => <span className="font-medium text-foreground">{row.domain}</span> },
  { key: "method", header: "Method", cell: (row) => <StatusPill tone="blue">{row.method}</StatusPill> },
  { key: "futureEndpoint", header: "Future Endpoint", cell: (row) => <code className="text-xs text-muted-foreground">{row.futureEndpoint}</code> },
  { key: "mockSource", header: "Mock Source", cell: (row) => row.mockSource },
  { key: "readiness", header: "Readiness", cell: (row) => <StatusPill tone={getTone(row.readiness)}>{row.readiness}</StatusPill> },
];

export function DevMonitoringDashboard() {
  const summary = getDevMonitoringSummary();

  return (
    <DashboardShell
      title="Super Admin / Dev Monitoring"
      description="Internal mock dashboard buat ngawasin route, mode, mock API readiness, schema risk, dan kerjaan AI/dev sebelum backend beneran dibangun."
    >
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Dashboard ini masih UI-only. Data berasal dari mock file, API dan schema di bawah hanya persiapan kontrak. Prisma schema tidak disentuh.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Monitored Services" value={String(summary.services)} note="Client-side dummy service map" icon={Server} tone="blue" />
        <StatCard label="Open Warnings" value={String(summary.warnings)} note="Butuh review sebelum API asli" icon={AlertTriangle} tone="amber" />
        <StatCard label="Critical Prep" value={String(summary.critical)} note="Mutation endpoint belum siap" icon={ShieldCheck} tone="rose" />
        <StatCard label="Mock API Contracts" value={String(summary.mockApis)} note="Endpoint draft only" icon={Database} tone="slate" />
      </div>

      <DashboardPanel title="Dev Control Cards" description="Ringkasan hardcoded untuk status platform internal.">
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          {devMonitoringMetrics.map((metric) => (
            <article key={metric.id} className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{metric.label}</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight">{metric.value}</p>
                </div>
                <StatusPill tone={getTone(metric.status)}>{metric.status}</StatusPill>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{metric.note}</p>
            </article>
          ))}
        </div>
      </DashboardPanel>

      <DashboardPanel title="Service Health Mock" description="Nanti bisa diganti endpoint health check internal.">
        <DataTable columns={serviceColumns} data={devServiceHealthMocks} getRowKey={(row) => row.id} minWidth={1100} pagination={false} />
      </DashboardPanel>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardPanel title="Business Mode Runtime Snapshot" description="Dummy summary buat ngawasin mode aktif, route, dan mock surface.">
          <DataTable columns={modeColumns} data={devTenantModeSnapshots} getRowKey={(row) => row.id} minWidth={720} pagination={false} />
        </DashboardPanel>

        <DashboardPanel title="Dev Notes" description="Checklist kecil biar dashboard ini tidak berubah jadi tong sampah fitur.">
          <div className="grid gap-3 p-4 text-sm leading-6 text-muted-foreground">
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <GitBranch className="h-4 w-4" /> Route rule
              </div>
              Tambah route baru di samping route lama. Jangan redirect atau hapus flow restaurant sebelum workspace stabil.
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <Bot className="h-4 w-4" /> AI boundary
              </div>
              Naming AI dan business-mode-service AI boleh jalan, tapi dashboard ini cuma baca status dan mock readiness.
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <TerminalSquare className="h-4 w-4" /> Build gate
              </div>
              Sebelum schema/API asli, gate minimal tetap typecheck, build, dan manual route smoke test.
            </div>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel title="AI / Dev Task Queue" description="Dummy queue untuk kerjaan lintas AI, Codex, dan manual review.">
        <DataTable columns={taskColumns} data={devTaskQueueMocks} getRowKey={(row) => row.id} minWidth={900} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="API Preparation" description="Endpoint future. Belum ada fetch, mutation, ataupun server handler.">
        <DataTable columns={apiColumns} data={devApiPreparationMocks} getRowKey={(row) => row.id} minWidth={1180} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Schema Preparation Only" description="Kandidat model internal kalau nanti monitoring mau persist data. Belum update Prisma schema.">
        <div className="grid gap-3 p-4 md:grid-cols-3">
          {devSchemaPreparation.map((item) => (
            <article key={item.model} className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-foreground">{item.model}</h3>
                <StatusPill tone="slate">Planned</StatusPill>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{item.reason}</p>
              <code className="mt-3 block rounded-md bg-background px-3 py-2 text-xs leading-5 text-muted-foreground">{item.fields}</code>
            </article>
          ))}
        </div>
      </DashboardPanel>

      <DashboardPanel title="Manual Smoke Test Checklist" description="Checklist dummy buat lo sebagai super admin/dev sebelum lanjut phase API.">
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            [Activity, "Open /dashboard/dev-monitoring", "Route render tanpa mode-specific guard."],
            [ShieldCheck, "Check sidebar visibility", "Muncul untuk OWNER/MANAGER lewat settings.manage."],
            [Database, "Confirm no schema diff", "Tidak ada prisma/schema.prisma update."],
            [Server, "Prepare API later", "Endpoint masih contract planning."],
          ].map(([Icon, title, note]) => {
            const TypedIcon = Icon as typeof Activity;
            return (
              <div key={String(title)} className="rounded-lg border border-border bg-card p-4">
                <TypedIcon className="mb-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <p className="font-semibold text-foreground">{title as string}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{note as string}</p>
              </div>
            );
          })}
        </div>
      </DashboardPanel>
    </DashboardShell>
  );
}
