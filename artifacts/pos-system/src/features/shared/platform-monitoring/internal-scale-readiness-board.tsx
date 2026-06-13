"use client";

import { Activity, AlertTriangle, ClipboardList, Database, ServerCog, Users } from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import type { DashboardTone } from "@/features/shared/types";

import {
  capacityPlan,
  getScaleReadinessSummary,
  goldenSignals,
  missingMonitorFeatures,
  scaleApiContracts,
  scaleReadinessItems,
  scaleSchemaCandidates,
  type CapacityItem,
  type GoldenSignalItem,
  type MissingFeatureItem,
  type ScaleApiContract,
  type ScaleReadinessItem,
  type ScaleSchemaCandidate,
} from "./internal-scale-readiness.mock";

const toneMap: Record<string, DashboardTone> = {
  Ready: "green",
  Watch: "amber",
  Gap: "rose",
  Blocked: "rose",
  Draft: "amber",
  "Mock Ready": "green",
  "Needs Backend": "blue",
  P0: "rose",
  P1: "amber",
  P2: "slate",
  Low: "green",
  Medium: "amber",
  High: "rose",
  GET: "blue",
  POST: "amber",
};

function tone(value: string): DashboardTone {
  return toneMap[value] ?? "slate";
}

const readinessColumns: DataTableColumn<ScaleReadinessItem>[] = [
  { key: "tier", header: "Scale Tier", cell: (row) => <span className="font-medium text-foreground">{row.tier}</span> },
  { key: "area", header: "Area", cell: (row) => row.area },
  { key: "currentNeed", header: "Need", cell: (row) => <span className="text-sm text-muted-foreground">{row.currentNeed}</span> },
  { key: "dashboardSignal", header: "Current Signal", cell: (row) => <span className="text-sm text-muted-foreground">{row.dashboardSignal}</span> },
  { key: "missingFeature", header: "Missing", cell: (row) => <span className="text-sm text-muted-foreground">{row.missingFeature}</span> },
  { key: "nextUpgrade", header: "Next Upgrade", cell: (row) => <span className="text-sm text-muted-foreground">{row.nextUpgrade}</span> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
];

const goldenColumns: DataTableColumn<GoldenSignalItem>[] = [
  { key: "signal", header: "Signal", cell: (row) => <span className="font-medium text-foreground">{row.signal}</span> },
  { key: "tenUsers", header: "10 Users", cell: (row) => <span className="text-sm text-muted-foreground">{row.tenUsers}</span> },
  { key: "hundredUsers", header: "100 Users", cell: (row) => <span className="text-sm text-muted-foreground">{row.hundredUsers}</span> },
  { key: "millionUsers", header: "1M Users", cell: (row) => <span className="text-sm text-muted-foreground">{row.millionUsers}</span> },
  { key: "futureEndpoint", header: "Future API", cell: (row) => <code className="text-xs text-muted-foreground">{row.futureEndpoint}</code> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
];

const capacityColumns: DataTableColumn<CapacityItem>[] = [
  { key: "component", header: "Component", cell: (row) => <span className="font-medium text-foreground">{row.component}</span> },
  { key: "tenUsers", header: "10 Users", cell: (row) => <span className="text-sm text-muted-foreground">{row.tenUsers}</span> },
  { key: "hundredUsers", header: "100 Users", cell: (row) => <span className="text-sm text-muted-foreground">{row.hundredUsers}</span> },
  { key: "millionUsers", header: "1M Users", cell: (row) => <span className="text-sm text-muted-foreground">{row.millionUsers}</span> },
  { key: "risk", header: "Risk", cell: (row) => <span className="text-sm text-muted-foreground">{row.risk}</span> },
  { key: "action", header: "Action", cell: (row) => <span className="text-sm text-muted-foreground">{row.action}</span> },
];

const missingColumns: DataTableColumn<MissingFeatureItem>[] = [
  { key: "priority", header: "Priority", cell: (row) => <StatusPill tone={tone(row.priority)}>{row.priority}</StatusPill> },
  { key: "feature", header: "Feature", cell: (row) => <span className="font-medium text-foreground">{row.feature}</span> },
  { key: "whyNeeded", header: "Why Needed", cell: (row) => <span className="text-sm text-muted-foreground">{row.whyNeeded}</span> },
  { key: "mockOnlyNow", header: "Mock Now", cell: (row) => <span className="text-sm text-muted-foreground">{row.mockOnlyNow}</span> },
  { key: "futureApiContract", header: "Future API", cell: (row) => <code className="text-xs text-muted-foreground">{row.futureApiContract}</code> },
];

const contractColumns: DataTableColumn<ScaleApiContract>[] = [
  { key: "method", header: "Method", cell: (row) => <StatusPill tone={tone(row.method)}>{row.method}</StatusPill> },
  { key: "endpoint", header: "Endpoint", cell: (row) => <code className="text-xs text-muted-foreground">{row.endpoint}</code> },
  { key: "purpose", header: "Purpose", cell: (row) => <span className="text-sm text-muted-foreground">{row.purpose}</span> },
  { key: "request", header: "Request", cell: (row) => <span className="text-sm text-muted-foreground">{row.request}</span> },
  { key: "response", header: "Response", cell: (row) => <span className="text-sm text-muted-foreground">{row.response}</span> },
  { key: "readiness", header: "Readiness", cell: (row) => <StatusPill tone={tone(row.readiness)}>{row.readiness}</StatusPill> },
];

const schemaColumns: DataTableColumn<ScaleSchemaCandidate>[] = [
  { key: "model", header: "Model", cell: (row) => <span className="font-medium text-foreground">{row.model}</span> },
  { key: "purpose", header: "Purpose", cell: (row) => <span className="text-sm text-muted-foreground">{row.purpose}</span> },
  { key: "fields", header: "Fields", cell: (row) => <code className="text-xs text-muted-foreground">{row.fields}</code> },
  { key: "promoteWhen", header: "Promote When", cell: (row) => <span className="text-sm text-muted-foreground">{row.promoteWhen}</span> },
  { key: "risk", header: "Risk", cell: (row) => <StatusPill tone={tone(row.risk)}>{row.risk}</StatusPill> },
];

export function InternalScaleReadinessBoard() {
  const summary = getScaleReadinessSummary();

  return (
    <>
      <DashboardPanel title="Scale Readiness: 10 → 100 → 1M Users" description="Mock-only board untuk melihat fitur monitoring apa yang cukup untuk demo kecil, apa yang mulai wajib saat user naik, dan apa yang belum boleh diklaim enterprise.">
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Ready Areas" value={summary.ready} note="Aman untuk demo 10 user." icon={Users} tone="green" />
          <StatCard label="Known Gaps" value={summary.gaps} note="Mulai terasa di 100 user." icon={AlertTriangle} tone="amber" />
          <StatCard label="Blocked at Scale" value={summary.blocked} note="Belum layak buat 1M user." icon={ServerCog} tone="rose" />
          <StatCard label="P0 Missing" value={summary.p0Missing} note="Harus ada sebelum klaim scalable." icon={Activity} tone="rose" />
        </div>
      </DashboardPanel>

      <DashboardPanel title="Tier Readiness Matrix" description="Apa yang harus dipantau di 10 user, 100 user, dan 1 juta user. Yang sudah ada dibiarkan, yang belum ada ditandai sebagai gap.">
        <DataTable columns={readinessColumns} data={scaleReadinessItems} getRowKey={(row) => row.id} minWidth={1850} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Golden Signals Board" description="Latency, traffic, errors, saturation. Ini fondasi monitoring, bukan ornamen dashboard.">
        <DataTable columns={goldenColumns} data={goldenSignals} getRowKey={(row) => row.id} minWidth={1700} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Missing Monitoring Features" description="Fitur yang belum ada di internal monitor dan disiapkan dulu sebagai mock sebelum API/backend dibuat.">
        <DataTable columns={missingColumns} data={missingMonitorFeatures} getRowKey={(row) => row.id} minWidth={1650} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Capacity Plan by Scale Tier" description="Rencana kapasitas per komponen. Masih dummy, tapi arahnya jelas untuk app runtime, DB, API, dan operasi.">
        <DataTable columns={capacityColumns} data={capacityPlan} getRowKey={(row) => row.id} minWidth={1800} pagination={false} />
      </DashboardPanel>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardPanel title="Scale API Contracts" description="Kontrak API masa depan untuk scale readiness, telemetry, capacity, dan load-test planning. POST tetap blocked dulu.">
          <DataTable columns={contractColumns} data={scaleApiContracts} getRowKey={(row) => row.id} minWidth={1700} pagination={false} />
        </DashboardPanel>

        <DashboardPanel title="Scale Schema Candidates" description="Kandidat schema saja. Prisma tetap tidak disentuh sampai endpoint real dan kebutuhan historis terbukti.">
          <DataTable columns={schemaColumns} data={scaleSchemaCandidates} getRowKey={(row) => row.id} minWidth={1500} pagination={false} />
        </DashboardPanel>
      </div>

      <DashboardPanel title="Scale Promotion Rule" description="Aturan keras supaya dashboard ini tidak berubah jadi kebun metrik tanpa tujuan.">
        <div className="grid gap-3 p-4 md:grid-cols-3">
          {[
            [ClipboardList, "10 users", "Build, route, smoke test, and schema lock are enough. Jangan pura-pura butuh Kubernetes dulu."],
            [Activity, "100 users", "Add read-only health API, p95 latency, error split, incident owner, and backup freshness."],
            [Database, "1M users", "Require telemetry coverage, SLO budget, capacity forecast, security guardrails, and cost monitor before claiming scalable."],
          ].map(([Icon, title, note]) => {
            const TypedIcon = Icon as typeof Activity;
            return (
              <article key={String(title)} className="rounded-lg border border-border bg-card p-4">
                <TypedIcon className="mb-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <p className="font-semibold text-foreground">{title as string}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{note as string}</p>
              </article>
            );
          })}
        </div>
      </DashboardPanel>
    </>
  );
}
