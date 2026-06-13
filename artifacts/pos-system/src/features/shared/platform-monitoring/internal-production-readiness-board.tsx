"use client";

import { AlertTriangle, BarChart3, ClipboardCheck, LockKeyhole, RadioTower, ServerCog, ShieldCheck } from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import type { DashboardTone } from "@/features/shared/types";

import {
  costBudgetItems,
  getProductionReadinessSummary,
  guardrailItems,
  incidentRunbookItems,
  loadTestScenarios,
  sloBudgetItems,
  telemetryPipelineItems,
  tenantIsolationItems,
  type CostBudgetItem,
  type GuardrailItem,
  type IncidentRunbookItem,
  type LoadTestScenario,
  type SloBudgetItem,
  type TelemetryPipelineItem,
  type TenantIsolationItem,
} from "./internal-production-readiness.mock";

const toneMap: Record<string, DashboardTone> = {
  Ready: "green",
  Watch: "amber",
  Gap: "rose",
  Blocked: "rose",
  Draft: "amber",
  P0: "rose",
  P1: "amber",
  P2: "slate",
  Low: "green",
  Medium: "amber",
  High: "rose",
};

function tone(value: string): DashboardTone {
  return toneMap[value] ?? "slate";
}

const sloColumns: DataTableColumn<SloBudgetItem>[] = [
  { key: "service", header: "Service", cell: (row) => <span className="font-medium text-foreground">{row.service}</span> },
  { key: "sli", header: "SLI", cell: (row) => <span className="text-sm text-muted-foreground">{row.sli}</span> },
  { key: "target", header: "Target", cell: (row) => row.target },
  { key: "currentMock", header: "Current Mock", cell: (row) => <span className="text-sm text-muted-foreground">{row.currentMock}</span> },
  { key: "burnRate", header: "Burn Rate", cell: (row) => row.burnRate },
  { key: "owner", header: "Owner", cell: (row) => row.owner },
  { key: "action", header: "Action", cell: (row) => <span className="text-sm text-muted-foreground">{row.action}</span> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
];

const telemetryColumns: DataTableColumn<TelemetryPipelineItem>[] = [
  { key: "signal", header: "Signal", cell: (row) => <span className="font-medium text-foreground">{row.signal}</span> },
  { key: "currentCoverage", header: "Coverage", cell: (row) => <span className="text-sm text-muted-foreground">{row.currentCoverage}</span> },
  { key: "missing", header: "Missing", cell: (row) => <span className="text-sm text-muted-foreground">{row.missing}</span> },
  { key: "futureCollector", header: "Future Collector", cell: (row) => <span className="text-sm text-muted-foreground">{row.futureCollector}</span> },
  { key: "storagePlan", header: "Storage Plan", cell: (row) => <span className="text-sm text-muted-foreground">{row.storagePlan}</span> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
];

const guardrailColumns: DataTableColumn<GuardrailItem>[] = [
  { key: "priority", header: "Priority", cell: (row) => <StatusPill tone={tone(row.priority)}>{row.priority}</StatusPill> },
  { key: "area", header: "Area", cell: (row) => <span className="font-medium text-foreground">{row.area}</span> },
  { key: "currentControl", header: "Current Control", cell: (row) => <span className="text-sm text-muted-foreground">{row.currentControl}</span> },
  { key: "scaleRisk", header: "Scale Risk", cell: (row) => <span className="text-sm text-muted-foreground">{row.scaleRisk}</span> },
  { key: "futurePolicy", header: "Future Policy", cell: (row) => <span className="text-sm text-muted-foreground">{row.futurePolicy}</span> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
];

const tenantColumns: DataTableColumn<TenantIsolationItem>[] = [
  { key: "risk", header: "Risk", cell: (row) => <StatusPill tone={tone(row.risk)}>{row.risk}</StatusPill> },
  { key: "layer", header: "Layer", cell: (row) => <span className="font-medium text-foreground">{row.layer}</span> },
  { key: "currentState", header: "Current State", cell: (row) => <span className="text-sm text-muted-foreground">{row.currentState}</span> },
  { key: "failureMode", header: "Failure Mode", cell: (row) => <span className="text-sm text-muted-foreground">{row.failureMode}</span> },
  { key: "requiredCheck", header: "Required Check", cell: (row) => <span className="text-sm text-muted-foreground">{row.requiredCheck}</span> },
  { key: "futureApi", header: "Future API", cell: (row) => <code className="text-xs text-muted-foreground">{row.futureApi}</code> },
];

const costColumns: DataTableColumn<CostBudgetItem>[] = [
  { key: "resource", header: "Resource", cell: (row) => <span className="font-medium text-foreground">{row.resource}</span> },
  { key: "tenUsers", header: "10 Users", cell: (row) => <span className="text-sm text-muted-foreground">{row.tenUsers}</span> },
  { key: "hundredUsers", header: "100 Users", cell: (row) => <span className="text-sm text-muted-foreground">{row.hundredUsers}</span> },
  { key: "millionUsers", header: "1M Users", cell: (row) => <span className="text-sm text-muted-foreground">{row.millionUsers}</span> },
  { key: "costSignal", header: "Cost Signal", cell: (row) => <span className="text-sm text-muted-foreground">{row.costSignal}</span> },
  { key: "action", header: "Action", cell: (row) => <span className="text-sm text-muted-foreground">{row.action}</span> },
];

const loadColumns: DataTableColumn<LoadTestScenario>[] = [
  { key: "scenario", header: "Scenario", cell: (row) => <span className="font-medium text-foreground">{row.scenario}</span> },
  { key: "targetTier", header: "Target Tier", cell: (row) => row.targetTier },
  { key: "trafficShape", header: "Traffic Shape", cell: (row) => <span className="text-sm text-muted-foreground">{row.trafficShape}</span> },
  { key: "passCriteria", header: "Pass Criteria", cell: (row) => <span className="text-sm text-muted-foreground">{row.passCriteria}</span> },
  { key: "blockedBy", header: "Blocked By", cell: (row) => <span className="text-sm text-muted-foreground">{row.blockedBy}</span> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
];

const runbookColumns: DataTableColumn<IncidentRunbookItem>[] = [
  { key: "trigger", header: "Trigger", cell: (row) => <span className="font-medium text-foreground">{row.trigger}</span> },
  { key: "firstCheck", header: "First Check", cell: (row) => <span className="text-sm text-muted-foreground">{row.firstCheck}</span> },
  { key: "ownerAction", header: "Owner Action", cell: (row) => <span className="text-sm text-muted-foreground">{row.ownerAction}</span> },
  { key: "escalation", header: "Escalation", cell: (row) => row.escalation },
  { key: "dashboardLink", header: "Link", cell: (row) => <code className="text-xs text-muted-foreground">{row.dashboardLink}</code> },
];

export function InternalProductionReadinessBoard() {
  const summary = getProductionReadinessSummary();

  return (
    <>
      <DashboardPanel title="Production Readiness Command Center" description="Mock-only board untuk menilai apakah internal monitoring sudah siap naik dari demo kecil ke operasi yang lebih serius: SLO, telemetry, guardrail, tenant isolation, cost, load test, dan runbook.">
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="SLO Watch Items" value={summary.sloWatch} note="Butuh tracking sebelum klaim reliable." icon={BarChart3} tone="amber" />
          <StatCard label="Blocked Telemetry" value={summary.blockedTelemetry} note="Tracing/profiling belum siap." icon={RadioTower} tone="rose" />
          <StatCard label="P0 Guardrails" value={summary.p0Guardrails} note="Rate limit, RBAC, audit wajib sebelum mutation." icon={ShieldCheck} tone="rose" />
          <StatCard label="High Tenant Risk" value={summary.highTenantRisk} note="Query/report scoping wajib diaudit." icon={LockKeyhole} tone="rose" />
        </div>
      </DashboardPanel>

      <DashboardPanel title="SLO & Error Budget Mock" description="Target reliability per service. Belum real metrics, tapi kontraknya sudah jelas untuk API monitoring nanti.">
        <DataTable columns={sloColumns} data={sloBudgetItems} getRowKey={(row) => row.id} minWidth={1850} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Telemetry Pipeline Readiness" description="Metrics, logs, traces, dan profiles. Yang belum ada ditandai sebagai gap/blocked supaya tidak pura-pura observability sudah selesai.">
        <DataTable columns={telemetryColumns} data={telemetryPipelineItems} getRowKey={(row) => row.id} minWidth={1700} pagination={false} />
      </DashboardPanel>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <DashboardPanel title="Security & Mutation Guardrails" description="Kontrol minimum sebelum internal API punya mutation. Tombol internal tanpa audit itu bukan fitur, itu jebakan." >
          <DataTable columns={guardrailColumns} data={guardrailItems} getRowKey={(row) => row.id} minWidth={1650} pagination={false} />
        </DashboardPanel>

        <DashboardPanel title="Tenant Isolation Review" description="Checklist dummy untuk mencegah cross-tenant leak saat dashboard/report mulai pakai data asli.">
          <DataTable columns={tenantColumns} data={tenantIsolationItems} getRowKey={(row) => row.id} minWidth={1650} pagination={false} />
        </DashboardPanel>
      </div>

      <DashboardPanel title="Cost Budget by Scale" description="Resource budget dari 10 user, 100 user, sampai 1M user. Scaling tanpa cost signal itu cara mahal untuk belajar panik.">
        <DataTable columns={costColumns} data={costBudgetItems} getRowKey={(row) => row.id} minWidth={1750} pagination={false} />
      </DashboardPanel>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <DashboardPanel title="Load Test Plan" description="Skenario test bertahap. Yang berbahaya tetap blocked sampai telemetry, rate limit, dan staging aman.">
          <DataTable columns={loadColumns} data={loadTestScenarios} getRowKey={(row) => row.id} minWidth={1750} pagination={false} />
        </DashboardPanel>

        <DashboardPanel title="Incident Runbook" description="Langkah pertama saat latency, error, tenant leak, atau cost spike muncul. Masih mock, tapi workflow-nya sudah bisa dibaca.">
          <DataTable columns={runbookColumns} data={incidentRunbookItems} getRowKey={(row) => row.id} minWidth={1750} pagination={false} />
        </DashboardPanel>
      </div>

      <DashboardPanel title="Production Promotion Rule" description="Aturan keras sebelum dashboard ini boleh naik dari mock UI ke API/backend asli.">
        <div className="grid gap-3 p-4 md:grid-cols-3">
          {[
            [ClipboardCheck, "Read-only first", "Promote health, route inventory, and contract readiness as GET endpoints before any PATCH/POST."],
            [ServerCog, "No schema until signal proves need", "Persist only data that needs history, audit, or trend. Jangan simpan semua metrik ke Prisma seperti menabung pasir."],
            [AlertTriangle, "Mutation requires guardrail", "Every internal mutation needs server permission, rate limit, audit write, dry-run mode, and rollback note."],
          ].map(([Icon, title, note]) => {
            const TypedIcon = Icon as typeof ClipboardCheck;
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
