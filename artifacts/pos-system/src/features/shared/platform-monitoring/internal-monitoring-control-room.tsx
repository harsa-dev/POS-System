"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, ClipboardList, Database, GitBranch, RefreshCw, ServerCog } from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import { DashboardActionButton, DashboardActions, DashboardPanel } from "@/features/shared/dashboard";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import type { DashboardTone } from "@/features/shared/types";
import type {
  InternalMonitoringApiImplementationStepDto,
  InternalMonitoringControlRoomSignalDto,
  InternalMonitoringDevActionItemDto,
  InternalMonitoringSchemaDecisionRecordDto,
  InternalMonitoringSource,
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
  api: "green",
  mock: "blue",
  fallback: "amber",
};

function tone(value: string): DashboardTone {
  return toneMap[value] ?? "slate";
}

function sourceLabel(source: InternalMonitoringSource) {
  if (source === "api") return "Read-only API";
  if (source === "fallback") return "Fallback Mock";
  return "Mock";
}

function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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

  return (
    <>
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
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-1">
              Generated: {formatGeneratedAt(controlRoomData.generatedAt)}
            </span>
            <span className="rounded-full bg-muted px-3 py-1">
              Endpoint: GET /api/internal/health/summary
            </span>
            {controlRoomData.fallbackReason ? (
              <span className="rounded-full bg-chart-3/15 px-3 py-1 text-foreground">
                Fallback reason: {controlRoomData.fallbackReason}
              </span>
            ) : null}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {controlRoomData.cards.map((card) => (
              <StatCard key={card.id} label={card.label} value={card.value} note={card.note} icon={Activity} tone={card.tone} />
            ))}
          </div>
        </div>
      </DashboardPanel>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardPanel title="Runtime Signals" description="Sinyal utama dari route, mock data, API contract, dan schema guard.">
          <DataTable columns={signalColumns} data={controlRoomData.signals} getRowKey={(row) => row.id} minWidth={1180} pagination={false} />
        </DashboardPanel>

        <DashboardPanel title="Dev Action Queue" description="Action item paling penting sebelum dashboard ini naik dari mock ke endpoint asli.">
          <DataTable columns={actionColumns} data={controlRoomData.devActionItems} getRowKey={(row) => row.id} minWidth={1100} pagination={false} />
        </DashboardPanel>
      </div>

      <DashboardPanel title="API Implementation Blueprint" description="Blueprint teknis per endpoint: dari mock source, contract status, rule implementasi, sampai test plan.">
        <DataTable columns={apiColumns} data={controlRoomData.apiImplementationSteps} getRowKey={(row) => row.id} minWidth={1700} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Schema Decision Records" description="Keputusan sementara untuk kandidat schema. Prisma tetap tidak disentuh sampai proof-nya cukup.">
        <DataTable columns={schemaColumns} data={controlRoomData.schemaDecisionRecords} getRowKey={(row) => row.id} minWidth={1350} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Next Promotion Checklist" description="Checklist keras sebelum fase backend. Ini bukan ritual, ini pertahanan hidup dari migration yang sembrono.">
        <div className="grid gap-3 p-4 md:grid-cols-3">
          {[
            [GitBranch, "Route wired", `P0 actions: ${summary.p0Actions}. Route harus render dulu.`],
            [ServerCog, "API read-only", `${summary.readyContracts} contracts ready. Mulai dari GET endpoint.`],
            [Database, "Schema locked", `${summary.blockedSignals} blocked signal. Schema baru tetap hold.`],
            [ClipboardList, "Contracts synced", `${summary.totalSignals} signals wajib cocok dengan docs.`],
            [AlertTriangle, "Mutation guarded", "PATCH/POST internal harus nunggu audit + permission."],
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
