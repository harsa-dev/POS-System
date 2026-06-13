"use client";

import { AlertTriangle, ClipboardCheck, Eye, LockKeyhole, Route, Server, ShieldCheck } from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import type { DashboardTone } from "@/features/shared/types";

import {
  accessPolicyRules,
  apiEnvelopeExamples,
  apiRolloutPlans,
  getInternalUpgradeSummary,
  internalRunbookSteps,
  observabilityTargets,
  schemaPromotionBacklog,
  type AccessPolicyRule,
  type ApiRolloutPlan,
  type InternalRunbookStep,
  type ObservabilityTarget,
  type SchemaPromotionBacklog,
} from "./internal-monitoring-upgrade.mock";

const toneMap: Record<string, DashboardTone> = {
  Mock: "slate",
  "Read-only API": "blue",
  Persisted: "green",
  Automated: "green",
  Low: "green",
  Medium: "amber",
  High: "rose",
};

function tone(value: string): DashboardTone {
  return toneMap[value] ?? "slate";
}

const rolloutColumns: DataTableColumn<ApiRolloutPlan>[] = [
  { key: "endpoint", header: "Endpoint", cell: (row) => <code className="text-xs text-muted-foreground">{row.endpoint}</code> },
  { key: "phase", header: "Phase", cell: (row) => <StatusPill tone={tone(row.phase)}>{row.phase}</StatusPill> },
  { key: "currentState", header: "Current State", cell: (row) => <span className="text-sm text-muted-foreground">{row.currentState}</span> },
  { key: "nextStep", header: "Next Step", cell: (row) => <span className="text-sm text-muted-foreground">{row.nextStep}</span> },
  { key: "risk", header: "Risk", cell: (row) => <StatusPill tone={tone(row.risk)}>{row.risk}</StatusPill> },
  { key: "owner", header: "Owner", cell: (row) => row.owner },
];

const schemaColumns: DataTableColumn<SchemaPromotionBacklog>[] = [
  { key: "model", header: "Model", cell: (row) => <span className="font-medium text-foreground">{row.model}</span> },
  { key: "promoteWhen", header: "Promote When", cell: (row) => <span className="text-sm text-muted-foreground">{row.promoteWhen}</span> },
  { key: "blockedBy", header: "Blocked By", cell: (row) => <span className="text-sm text-muted-foreground">{row.blockedBy}</span> },
  { key: "acceptance", header: "Acceptance", cell: (row) => <span className="text-sm text-muted-foreground">{row.acceptance}</span> },
  { key: "risk", header: "Risk", cell: (row) => <StatusPill tone={tone(row.risk)}>{row.risk}</StatusPill> },
];

const accessColumns: DataTableColumn<AccessPolicyRule>[] = [
  { key: "role", header: "Role", cell: (row) => <span className="font-medium text-foreground">{row.role}</span> },
  { key: "canView", header: "Can View", cell: (row) => row.canView },
  { key: "canAct", header: "Can Act", cell: (row) => row.canAct },
  { key: "blockedActions", header: "Blocked Actions", cell: (row) => <span className="text-sm text-muted-foreground">{row.blockedActions}</span> },
  { key: "reason", header: "Reason", cell: (row) => <span className="text-sm text-muted-foreground">{row.reason}</span> },
];

const observabilityColumns: DataTableColumn<ObservabilityTarget>[] = [
  { key: "metric", header: "Metric", cell: (row) => <span className="font-medium text-foreground">{row.metric}</span> },
  { key: "source", header: "Source", cell: (row) => <span className="text-sm text-muted-foreground">{row.source}</span> },
  { key: "threshold", header: "Threshold", cell: (row) => <span className="text-sm text-muted-foreground">{row.threshold}</span> },
  { key: "futureEndpoint", header: "Future Endpoint", cell: (row) => <code className="text-xs text-muted-foreground">{row.futureEndpoint}</code> },
  { key: "action", header: "Action", cell: (row) => <span className="text-sm text-muted-foreground">{row.action}</span> },
];

const runbookColumns: DataTableColumn<InternalRunbookStep>[] = [
  { key: "step", header: "Step", cell: (row) => <span className="font-medium text-foreground">{row.step}</span> },
  { key: "trigger", header: "Trigger", cell: (row) => <span className="text-sm text-muted-foreground">{row.trigger}</span> },
  { key: "action", header: "Action", cell: (row) => <span className="text-sm text-muted-foreground">{row.action}</span> },
  { key: "owner", header: "Owner", cell: (row) => row.owner },
  { key: "doneWhen", header: "Done When", cell: (row) => <span className="text-sm text-muted-foreground">{row.doneWhen}</span> },
];

export function InternalMonitoringUpgradeBoard() {
  const summary = getInternalUpgradeSummary();

  return (
    <>
      <DashboardPanel title="API & Schema Readiness Board" description="Upgrade layer untuk nentuin kapan mock boleh naik jadi API read-only, kapan schema boleh dipromote, dan apa yang wajib diblokir dulu.">
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Rollout Items" value={String(summary.rolloutItems)} note="endpoint roadmap" icon={Server} tone="blue" />
          <StatCard label="High Risk" value={String(summary.highRiskItems)} note="must stay blocked" icon={AlertTriangle} tone="rose" />
          <StatCard label="Schema Backlog" value={String(summary.schemaBacklog)} note="not migrated yet" icon={ClipboardCheck} tone="slate" />
          <StatCard label="Access Rules" value={String(summary.accessRules)} note="visibility boundary" icon={LockKeyhole} tone="amber" />
          <StatCard label="Observability" value={String(summary.observabilityTargets)} note="future checks" icon={Eye} tone="green" />
          <StatCard label="Runbook Steps" value={String(summary.runbookSteps)} note="manual ops flow" icon={ShieldCheck} tone="blue" />
        </div>
      </DashboardPanel>

      <DashboardPanel title="API Rollout Plan" description="Urutan naik kelas dari mock ke read-only API. Mutation tetap diblok sampai auth dan audit log aman.">
        <DataTable columns={rolloutColumns} data={apiRolloutPlans} getRowKey={(row) => row.id} minWidth={1500} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Response Envelope Examples" description="Contoh bentuk response yang wajib konsisten saat endpoint asli dibuat nanti.">
        <div className="grid gap-3 p-4 xl:grid-cols-2">
          {apiEnvelopeExamples.map((item) => (
            <article key={item.id} className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
                </div>
                <StatusPill tone={item.state === "Success" ? "green" : "rose"}>{item.state}</StatusPill>
              </div>
              <pre className="overflow-auto rounded-lg bg-background p-3 text-xs leading-5 text-muted-foreground"><code>{item.sample}</code></pre>
            </article>
          ))}
        </div>
      </DashboardPanel>

      <DashboardPanel title="Schema Promotion Backlog" description="Daftar model yang belum boleh masuk Prisma sampai ada trigger, blocker selesai, dan acceptance jelas.">
        <DataTable columns={schemaColumns} data={schemaPromotionBacklog} getRowKey={(row) => row.id} minWidth={1480} pagination={false} />
      </DashboardPanel>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <DashboardPanel title="Access Policy Matrix" description="Siapa boleh lihat apa. Ini penting supaya internal dashboard tidak bocor jadi fitur customer-facing. Dunia sudah cukup kacau tanpa tombol admin di tangan kasir.">
          <DataTable columns={accessColumns} data={accessPolicyRules} getRowKey={(row) => row.id} minWidth={1180} pagination={false} />
        </DashboardPanel>

        <DashboardPanel title="Runbook" description="Langkah manual sebelum API/schema beneran dinaikkan. Belum otomatis, tapi setidaknya bukan mengandalkan ingatan manusia, perangkat penyimpanan paling rapuh. ">
          <DataTable columns={runbookColumns} data={internalRunbookSteps} getRowKey={(row) => row.id} minWidth={1180} pagination={false} />
        </DashboardPanel>
      </div>

      <DashboardPanel title="Observability Targets" description="Target monitoring yang nanti bisa diganti dari mock menjadi checker beneran.">
        <DataTable columns={observabilityColumns} data={observabilityTargets} getRowKey={(row) => row.id} minWidth={1480} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Promotion Rule Reminder" description="Batas keras sebelum naik dari UI-only ke backend phase.">
        <div className="grid gap-3 p-4 md:grid-cols-3">
          {[
            [Route, "Route first", "Route harus render stabil sebelum API asli dibuat."],
            [Server, "Read-only first", "Endpoint GET dibuat dulu. Mutation alert tetap locked."],
            [ShieldCheck, "Schema last", "Prisma model baru hanya boleh masuk setelah ada alasan persistensi."],
          ].map(([Icon, title, note]) => {
            const TypedIcon = Icon as typeof Route;
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
    </>
  );
}
