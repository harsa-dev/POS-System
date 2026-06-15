"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  Database,
  Eye,
  GitBranch,
  LockKeyhole,
  RefreshCw,
  Route,
  ServerCog,
  ShieldCheck,
} from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import { DashboardActionButton, DashboardActions, DashboardPanel } from "@/features/shared/dashboard";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import type { DashboardTone } from "@/features/shared/types";
import type {
  InternalMonitoringApiImplementationStepDto,
  InternalMonitoringControlRoomSignalDto,
  InternalMonitoringDataIntegrityCheckDto,
  InternalMonitoringDevActionItemDto,
  InternalMonitoringMutationReadinessContractDto,
  InternalMonitoringRouteInventoryItemDto,
  InternalMonitoringSchemaDecisionRecordDto,
  InternalMonitoringSource,
  InternalSystemProbeHistoryItemDto,
} from "@/lib/api/internal-monitoring-api";

import {
  getInternalMonitoringMockControlRoomData,
  loadInternalMonitoringControlRoomData,
  type InternalMonitoringDataSourceResult,
} from "./internal-monitoring-data-source";

const toneMap: Record<string, DashboardTone> = {
  Healthy: "green",
  Watch: "amber",
  Blocked: "rose",
  Ready: "green",
  Draft: "amber",
  Hold: "amber",
  Prepare: "blue",
  "Promote Later": "slate",
  P0: "rose",
  P1: "amber",
  P2: "slate",
  Todo: "slate",
  Doing: "blue",
  Waiting: "amber",
  active: "green",
  planned: "amber",
  blocked: "rose",
  auth: "amber",
  "platform-admin": "green",
  pass: "green",
  watch: "amber",
  fail: "rose",
  critical: "rose",
  info: "blue",
  warning: "amber",
  api: "green",
  mock: "blue",
  fallback: "amber",
  ready: "green",
  "schema-missing": "amber",
  "database-unavailable": "rose",
  "not-configured": "amber",
  "Dry-run Only": "blue",
  Required: "amber",
  "Design Ready": "green",
  POST: "rose",
  PATCH: "rose",
  DELETE: "rose",
  "Operational - API synced": "green",
  "Degraded - fallback active": "amber",
  "Mock - local preview": "blue",
  Refreshing: "blue",
};

const sectionLinks = [
  { id: "runtime-status", label: "Runtime Status" },
  { id: "runtime-signals", label: "Runtime Signals" },
  { id: "probe-history", label: "Probe History" },
  { id: "route-inventory", label: "Route Inventory" },
  { id: "api-contracts", label: "API Contracts" },
  { id: "data-integrity", label: "Data Integrity" },
  { id: "mutation-readiness", label: "Mutation Readiness" },
  { id: "schema-decisions", label: "Schema Risk" },
  { id: "dev-actions", label: "Dev Queue" },
  { id: "promotion-checklist", label: "Promotion Checklist" },
] as const;

function tone(value: string): DashboardTone {
  return toneMap[value] ?? "slate";
}

function sourceLabel(source: InternalMonitoringSource) {
  if (source === "api") return "Read-only API";
  if (source === "fallback") return "Fallback Mock";
  return "Mock";
}

function formatGeneratedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid timestamp";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getGeneratedAtAgeMinutes(value: string) {
  const generatedAtTime = new Date(value).getTime();

  if (Number.isNaN(generatedAtTime)) return null;

  return Math.max(0, Math.floor((Date.now() - generatedAtTime) / 60_000));
}

function getRuntimeStatus(data: InternalMonitoringDataSourceResult, isLoading: boolean) {
  const generatedAtAgeMinutes = getGeneratedAtAgeMinutes(data.generatedAt);
  const staleSourceWarning =
    generatedAtAgeMinutes === null
      ? "Generated timestamp is invalid."
      : generatedAtAgeMinutes > 15
        ? `Generated timestamp is ${generatedAtAgeMinutes} minutes old.`
        : null;
  const fallbackCount = data.sectionFallbacks.length;
  const totalSections = 6;
  const apiCoverage = totalSections - fallbackCount;
  const sectionCoverageLabel = `${apiCoverage}/${totalSections} sections synced`;
  const runtimeStatusLabel = isLoading
    ? "Refreshing"
    : data.source === "api" && fallbackCount === 0 && !staleSourceWarning
      ? "Operational - API synced"
      : data.source === "fallback" || fallbackCount > 0 || staleSourceWarning
        ? "Degraded - fallback active"
        : "Mock - local preview";
  const runtimeMode = data.source === "api" ? "Read-only API" : data.source === "fallback" ? "Fallback mode" : "Mock preview";
  const freshnessLabel =
    generatedAtAgeMinutes === null
      ? "Invalid timestamp"
      : generatedAtAgeMinutes === 0
        ? "Fresh now"
        : `${generatedAtAgeMinutes} minutes old`;

  return {
    apiCoverage,
    fallbackCount,
    freshnessLabel,
    runtimeMode,
    runtimeStatusLabel,
    sectionCoverageLabel,
    staleSourceWarning,
  };
}

function ReadOnlySafetyBanner({ source }: { source: InternalMonitoringSource }) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-700">
              Read-only internal monitoring
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Dashboard ini hanya observability, bukan mutation console.
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-900">
              Semua endpoint Internal Monitoring fase ini wajib GET-only. POST, PATCH, DELETE,
              alert acknowledgement, role elevation, billing mutation, dan tenant action tetap diblokir
              sampai ada RBAC, audit event, approval policy, rollback note, rate limit, dan dry-run mode.
            </p>
          </div>
        </div>
        <StatusPill tone={tone(source)}>{sourceLabel(source)}</StatusPill>
      </div>
    </div>
  );
}

function QuickSectionNavigation() {
  return (
    <nav
      aria-label="Internal Monitoring sections"
      className="rounded-xl border border-border bg-card p-3 text-card-foreground shadow-sm"
    >
      <div className="flex flex-wrap gap-2">
        {sectionLinks.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            {section.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function SourceHealthSummary({
  data,
  isLoading,
}: {
  data: InternalMonitoringDataSourceResult;
  isLoading: boolean;
}) {
  const fallbackCount = data.sectionFallbacks.length;
  const statusText = isLoading
    ? "Refreshing internal monitoring source..."
    : fallbackCount > 0
      ? `${fallbackCount} fallback section active.`
      : "All visible sections loaded from the current source.";

  return (
    <div
      className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm"
      aria-live="polite"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Source Health</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight">{statusText}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Generated {formatGeneratedAt(data.generatedAt)} · {data.routeInventory.length} routes · {data.contractReadiness.length} contracts · {data.dataIntegrityChecks.length} integrity checks · {data.mutationReadinessContracts.length} dry-run contracts · {data.probeHistory.summary.total} persisted probe records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
            Source: {sourceLabel(data.source)}
          </span>
          <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
            Capability: platform-admin.internal-monitoring.read
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
            GET-only
          </span>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
            Dry-run design only
          </span>
        </div>
      </div>
    </div>
  );
}

function RuntimeStatusPanel({
  data,
  isLoading,
}: {
  data: InternalMonitoringDataSourceResult;
  isLoading: boolean;
}) {
  const runtime = getRuntimeStatus(data, isLoading);

  return (
    <DashboardPanel
      title="Runtime Status"
      description="Ringkasan operasional supaya admin tahu apakah dashboard sedang API-synced, fallback, mock, atau stale. Sangat revolusioner: status yang benar-benar menjelaskan status."
      className="scroll-mt-24"
    >
      <div id="runtime-status" className="sr-only">Runtime Status</div>
      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4" aria-live="polite">
        <article className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Runtime Mode</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-lg font-bold text-foreground">{runtime.runtimeMode}</p>
            <StatusPill tone={tone(runtime.runtimeStatusLabel)}>{runtime.runtimeStatusLabel}</StatusPill>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Current source: {sourceLabel(data.source)}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Freshness</p>
          <p className="mt-3 text-lg font-bold text-foreground">{runtime.freshnessLabel}</p>
          <p className="mt-2 text-sm text-muted-foreground">Generated: {formatGeneratedAt(data.generatedAt)}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Section Coverage</p>
          <p className="mt-3 text-lg font-bold text-foreground">{runtime.sectionCoverageLabel}</p>
          <p className="mt-2 text-sm text-muted-foreground">Fallback sections: {runtime.fallbackCount}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Guardrail</p>
          <p className="mt-3 text-lg font-bold text-foreground">Read-only enforced</p>
          <p className="mt-2 text-sm text-muted-foreground">No POST/PATCH/DELETE runtime controls are exposed.</p>
        </article>
      </div>
      {runtime.staleSourceWarning ? (
        <div className="border-t border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p><span className="font-semibold">Stale source warning:</span> {runtime.staleSourceWarning}</p>
          </div>
        </div>
      ) : null}
    </DashboardPanel>
  );
}

const signalColumns: DataTableColumn<InternalMonitoringControlRoomSignalDto>[] = [
  { key: "area", header: "Area", cell: (row) => <span className="font-medium text-foreground">{row.area}</span> },
  { key: "signal", header: "Signal", cell: (row) => <span className="text-sm text-muted-foreground">{row.signal}</span> },
  { key: "source", header: "Source", cell: (row) => <code className="text-xs text-muted-foreground">{row.source}</code> },
  { key: "state", header: "State", cell: (row) => <StatusPill tone={tone(row.state)}>{row.state}</StatusPill> },
  { key: "nextAction", header: "Next Action", cell: (row) => <span className="text-sm text-muted-foreground">{row.nextAction}</span> },
];

const apiColumns: DataTableColumn<InternalMonitoringApiImplementationStepDto>[] = [
  { key: "phase", header: "Phase", cell: (row) => row.phase },
  { key: "endpoint", header: "Endpoint", cell: (row) => <code className="text-xs text-muted-foreground">{row.endpoint}</code> },
  { key: "mockSource", header: "Mock Source", cell: (row) => <code className="text-xs text-muted-foreground">{row.mockSource}</code> },
  { key: "contractStatus", header: "Contract", cell: (row) => <StatusPill tone={tone(row.contractStatus)}>{row.contractStatus}</StatusPill> },
  { key: "implementationRule", header: "Rule", cell: (row) => <span className="text-sm text-muted-foreground">{row.implementationRule}</span> },
  { key: "testPlan", header: "Test Plan", cell: (row) => <span className="text-sm text-muted-foreground">{row.testPlan}</span> },
];

const routeInventoryColumns: DataTableColumn<InternalMonitoringRouteInventoryItemDto>[] = [
  { key: "route", header: "Route", cell: (row) => <code className="text-xs text-muted-foreground">{row.route}</code> },
  { key: "owner", header: "Owner", cell: (row) => <span className="font-medium text-foreground">{row.owner}</span> },
  { key: "guard", header: "Guard", cell: (row) => <StatusPill tone={tone(row.guard)}>{row.guard}</StatusPill> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
  { key: "notes", header: "Notes", cell: (row) => <span className="text-sm text-muted-foreground">{row.notes}</span> },
];

const integrityColumns: DataTableColumn<InternalMonitoringDataIntegrityCheckDto>[] = [
  { key: "check", header: "Check", cell: (row) => <span className="font-medium text-foreground">{row.check}</span> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
  { key: "severity", header: "Severity", cell: (row) => <StatusPill tone={tone(row.severity)}>{row.severity}</StatusPill> },
  { key: "detail", header: "Detail", cell: (row) => <span className="text-sm text-muted-foreground">{row.detail}</span> },
];

const probeHistoryColumns: DataTableColumn<InternalSystemProbeHistoryItemDto>[] = [
  { key: "probeId", header: "Probe", cell: (row) => <code className="text-xs text-muted-foreground">{row.probeId}</code> },
  { key: "label", header: "Label", cell: (row) => <span className="font-medium text-foreground">{row.label}</span> },
  { key: "area", header: "Area", cell: (row) => row.area },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
  { key: "latencyMs", header: "Latency", cell: (row) => row.latencyMs === null ? "-" : `${row.latencyMs}ms` },
  { key: "observedAt", header: "Observed", cell: (row) => formatGeneratedAt(row.observedAt) },
  { key: "message", header: "Message", cell: (row) => <span className="text-sm text-muted-foreground">{row.message}</span> },
];

const mutationReadinessColumns: DataTableColumn<InternalMonitoringMutationReadinessContractDto>[] = [
  { key: "action", header: "Action", cell: (row) => <span className="font-medium text-foreground">{row.action}</span> },
  { key: "proposedEndpoint", header: "Proposed Endpoint", cell: (row) => <code className="text-xs text-muted-foreground">{row.proposedEndpoint}</code> },
  { key: "proposedMethod", header: "Method", cell: (row) => <StatusPill tone={tone(row.proposedMethod)}>{row.proposedMethod}</StatusPill> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
  { key: "dryRunMode", header: "Dry-run", cell: (row) => <StatusPill tone={tone(row.dryRunMode)}>{row.dryRunMode}</StatusPill> },
  { key: "requiredCapability", header: "Capability", cell: (row) => <code className="text-xs text-muted-foreground">{row.requiredCapability}</code> },
  { key: "requiredAuditEvent", header: "Audit Event", cell: (row) => <code className="text-xs text-muted-foreground">{row.requiredAuditEvent}</code> },
  { key: "blockedReason", header: "Blocked Reason", cell: (row) => <span className="text-sm text-muted-foreground">{row.blockedReason}</span> },
  { key: "requiredProof", header: "Required Proof", cell: (row) => <span className="text-sm text-muted-foreground">{row.requiredProof.join(" · ")}</span> },
];

const schemaColumns: DataTableColumn<InternalMonitoringSchemaDecisionRecordDto>[] = [
  { key: "candidate", header: "Candidate", cell: (row) => <span className="font-medium text-foreground">{row.candidate}</span> },
  { key: "decision", header: "Decision", cell: (row) => <StatusPill tone={tone(row.decision)}>{row.decision}</StatusPill> },
  { key: "reason", header: "Reason", cell: (row) => <span className="text-sm text-muted-foreground">{row.reason}</span> },
  { key: "requiredProof", header: "Required Proof", cell: (row) => <span className="text-sm text-muted-foreground">{row.requiredProof}</span> },
];

const actionColumns: DataTableColumn<InternalMonitoringDevActionItemDto>[] = [
  { key: "priority", header: "Priority", cell: (row) => <StatusPill tone={tone(row.priority)}>{row.priority}</StatusPill> },
  { key: "title", header: "Action", cell: (row) => <span className="font-medium text-foreground">{row.title}</span> },
  { key: "owner", header: "Owner", cell: (row) => row.owner },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
  { key: "doneWhen", header: "Done When", cell: (row) => <span className="text-sm text-muted-foreground">{row.doneWhen}</span> },
];

function ProbeHistoryPanel({ data }: { data: InternalMonitoringDataSourceResult }) {
  const history = data.probeHistory;
  return (
    <DashboardPanel
      title="InternalSystemProbe History"
      description="Read-only persisted probe history from internal_system_probes. Kalau status schema-missing, migration belum dijalankan. Mengejutkan: tabel kosong tidak bisa menampilkan sejarah."
      className="scroll-mt-24"
    >
      <div id="probe-history" className="sr-only">Probe History</div>
      <div className="grid gap-3 border-b border-border p-4 md:grid-cols-4">
        <article className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Persistence Status</p>
          <div className="mt-3">
            <StatusPill tone={tone(history.summary.persistenceStatus)}>{history.summary.persistenceStatus}</StatusPill>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{history.summary.detail}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Retention</p>
          <p className="mt-3 text-lg font-bold text-foreground">{history.summary.retentionDays} days</p>
          <p className="mt-2 text-sm text-muted-foreground">History endpoint only returns recent snapshots.</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Records</p>
          <p className="mt-3 text-lg font-bold text-foreground">{history.summary.total}</p>
          <p className="mt-2 text-sm text-muted-foreground">Current limit: {history.filters.limit}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Status Mix</p>
          <p className="mt-3 text-lg font-bold text-foreground">{history.summary.pass}/{history.summary.watch}/{history.summary.fail}</p>
          <p className="mt-2 text-sm text-muted-foreground">pass / watch / fail</p>
        </article>
      </div>
      <DataTable columns={probeHistoryColumns} data={history.items} getRowKey={(row) => row.id} minWidth={1500} pagination={false} />
    </DashboardPanel>
  );
}

export function InternalMonitoringControlRoom() {
  const [controlRoomData, setControlRoomData] = useState<InternalMonitoringDataSourceResult>(() =>
    getInternalMonitoringMockControlRoomData(),
  );
  const [isLoading, setIsLoading] = useState(false);

  async function refreshControlRoomData() {
    setIsLoading(true);
    try {
      setControlRoomData(await loadInternalMonitoringControlRoomData());
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshControlRoomData();
  }, []);

  const summary = controlRoomData.summary;
  const fallbackSummary = useMemo(() => {
    if (controlRoomData.sectionFallbacks.length === 0) {
      return "No section fallback active.";
    }

    return `${controlRoomData.sectionFallbacks.length} section fallback active.`;
  }, [controlRoomData.sectionFallbacks.length]);

  return (
    <>
      <ReadOnlySafetyBanner source={controlRoomData.source} />
      <SourceHealthSummary data={controlRoomData} isLoading={isLoading} />
      <RuntimeStatusPanel data={controlRoomData} isLoading={isLoading} />
      <QuickSectionNavigation />

      <DashboardPanel
        title="Control Room Readiness"
        description="Layer operasional untuk ngelihat mana yang siap naik API, mana yang masih mock, dan mana yang harus dikunci dulu."
        action={
          <DashboardActions>
            <StatusPill tone={tone(controlRoomData.source)}>{sourceLabel(controlRoomData.source)}</StatusPill>
            <DashboardActionButton icon={RefreshCw} onClick={() => void refreshControlRoomData()} disabled={isLoading}>
              {isLoading ? "Refreshing" : "Refresh Source"}
            </DashboardActionButton>
          </DashboardActions>
        }
      >
        <div className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground" aria-live="polite">
            <span className="rounded-full bg-muted px-3 py-1">
              Generated: {formatGeneratedAt(controlRoomData.generatedAt)}
            </span>
            <span className="rounded-full bg-muted px-3 py-1">
              Endpoints: 6 GET-only internal monitoring APIs
            </span>
            <span className="rounded-full bg-muted px-3 py-1">
              {fallbackSummary}
            </span>
            {controlRoomData.fallbackReason ? (
              <span className="rounded-full bg-chart-3/15 px-3 py-1 text-foreground">
                Fallback reason: {controlRoomData.fallbackReason}
              </span>
            ) : null}
          </div>
          {controlRoomData.sectionFallbacks.length > 0 ? (
            <div className="rounded-lg border border-chart-3/30 bg-chart-3/10 p-3 text-sm text-foreground" role="status">
              <p className="font-semibold">Section fallback active</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {controlRoomData.sectionFallbacks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {controlRoomData.cards.map((card) => (
              <StatCard key={card.id} label={card.label} value={card.value} note={card.note} icon={Activity} tone={card.tone} />
            ))}
          </div>
        </div>
      </DashboardPanel>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardPanel title="Runtime Signals" description="Sinyal utama dari route, mock data, API contract, dan schema guard." className="scroll-mt-24">
          <div id="runtime-signals" className="sr-only">Runtime Signals</div>
          <DataTable columns={signalColumns} data={controlRoomData.signals} getRowKey={(row) => row.id} minWidth={1180} pagination={false} />
        </DashboardPanel>

        <ProbeHistoryPanel data={controlRoomData} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardPanel title="Route Inventory" description="Route internal yang sudah terlihat dari endpoint read-only. Guard dedicated masih fase berikutnya." className="scroll-mt-24">
          <div id="route-inventory" className="sr-only">Route Inventory</div>
          <DataTable columns={routeInventoryColumns} data={controlRoomData.routeInventory} getRowKey={(row) => row.id} minWidth={1250} pagination={false} />
        </DashboardPanel>

        <DashboardPanel title="Data Integrity Checks" description="Read-only checks yang memastikan dashboard internal tidak diam-diam berubah jadi mutation surface." className="scroll-mt-24">
          <div id="data-integrity" className="sr-only">Data Integrity Checks</div>
          <DataTable columns={integrityColumns} data={controlRoomData.dataIntegrityChecks} getRowKey={(row) => row.id} minWidth={1200} pagination={false} />
        </DashboardPanel>
      </div>

      <DashboardPanel title="API Implementation Blueprint" description="Blueprint teknis per endpoint: dari mock source, contract status, rule implementasi, sampai test plan." className="scroll-mt-24">
        <div id="api-contracts" className="sr-only">API Contracts</div>
        <DataTable columns={apiColumns} data={controlRoomData.contractReadiness} getRowKey={(row) => row.id} minWidth={1700} pagination={false} />
      </DashboardPanel>

      <DashboardPanel
        title="Mutation Readiness & Dry-run Contracts"
        description="Catalog desain untuk future platform mutation. Semua baris ini masih metadata read-only, bukan action executor."
        className="scroll-mt-24"
      >
        <div id="mutation-readiness" className="sr-only">Mutation Readiness</div>
        <div className="border-b border-border bg-rose-50 p-4 text-sm text-rose-900">
          Dry-run contract metadata only. Proposed POST/PATCH/DELETE endpoints di bawah ini tetap blocked sampai RBAC, audit event, approval policy, rollback note, rate limit, dan dry-run response siap.
        </div>
        <DataTable columns={mutationReadinessColumns} data={controlRoomData.mutationReadinessContracts} getRowKey={(row) => row.id} minWidth={2200} pagination={false} />
      </DashboardPanel>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardPanel title="Schema Decision Records" description="Keputusan sementara untuk kandidat schema. Prisma tetap tidak disentuh sampai proof-nya cukup." className="scroll-mt-24">
          <div id="schema-decisions" className="sr-only">Schema Decisions</div>
          <DataTable columns={schemaColumns} data={controlRoomData.schemaDecisionRecords} getRowKey={(row) => row.id} minWidth={1350} pagination={false} />
        </DashboardPanel>

        <DashboardPanel title="Dev Action Queue" description="Action item paling penting sebelum dashboard ini naik dari mock ke endpoint asli." className="scroll-mt-24">
          <div id="dev-actions" className="sr-only">Dev Action Queue</div>
          <DataTable columns={actionColumns} data={controlRoomData.devActionItems} getRowKey={(row) => row.id} minWidth={1100} pagination={false} />
        </DashboardPanel>
      </div>

      <DashboardPanel title="Next Promotion Checklist" description="Checklist keras sebelum fase mutation. Ini bukan ritual, ini pertahanan hidup dari migration yang sembrono." className="scroll-mt-24">
        <div id="promotion-checklist" className="sr-only">Promotion Checklist</div>
        <div className="grid gap-3 p-4 md:grid-cols-3">
          {[
            [GitBranch, "Route wired", `P0 actions: ${summary.p0Actions}. Route harus render dulu.`],
            [ServerCog, "API read-only", `${summary.readyContracts} contracts ready. Semua endpoint harus GET.`],
            [Database, "Probe history planned", `${controlRoomData.probeHistory.summary.persistenceStatus} history persistence status.`],
            [ClipboardList, "Contracts synced", `${summary.totalSignals} signals wajib cocok dengan docs.`],
            [ShieldCheck, "Integrity checked", `${controlRoomData.dataIntegrityChecks.length} checks loaded from API/fallback.`],
            [Route, "Routes inventoried", `${controlRoomData.routeInventory.length} internal routes visible.`],
            [AlertTriangle, "Mutation guarded", `${controlRoomData.mutationReadinessContracts.length} mutation readiness contracts remain blocked or dry-run only.`],
            [Eye, "Observability only", "No destructive actions are available in this dashboard."],
            [Activity, "Fallback ready", `${sourceLabel(controlRoomData.source)} source keeps UI alive while backend catches up.`],
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
