"use client";

import { Activity, AlertTriangle, ClipboardList, Database, GitBranch, ServerCog } from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import type { DashboardTone } from "@/features/shared/types";

import {
  apiImplementationSteps,
  controlRoomCards,
  controlRoomSignals,
  devActionItems,
  getControlRoomSummary,
  schemaDecisionRecords,
  type ApiImplementationStep,
  type ControlRoomSignal,
  type DevActionItem,
  type SchemaDecisionRecord,
} from "./internal-monitoring-control-room.mock";

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
};

function tone(value: string): DashboardTone {
  return toneMap[value] ?? "slate";
}

const signalColumns: DataTableColumn<ControlRoomSignal>[] = [
  { key: "area", header: "Area", cell: (row) => <span className="font-medium text-foreground">{row.area}</span> },
  { key: "signal", header: "Signal", cell: (row) => <span className="text-sm text-muted-foreground">{row.signal}</span> },
  { key: "source", header: "Source", cell: (row) => <code className="text-xs text-muted-foreground">{row.source}</code> },
  { key: "state", header: "State", cell: (row) => <StatusPill tone={tone(row.state)}>{row.state}</StatusPill> },
  { key: "nextAction", header: "Next Action", cell: (row) => <span className="text-sm text-muted-foreground">{row.nextAction}</span> },
];

const apiColumns: DataTableColumn<ApiImplementationStep>[] = [
  { key: "phase", header: "Phase", cell: (row) => row.phase },
  { key: "endpoint", header: "Endpoint", cell: (row) => <code className="text-xs text-muted-foreground">{row.endpoint}</code> },
  { key: "mockSource", header: "Mock Source", cell: (row) => <code className="text-xs text-muted-foreground">{row.mockSource}</code> },
  { key: "contractStatus", header: "Contract", cell: (row) => <StatusPill tone={tone(row.contractStatus)}>{row.contractStatus}</StatusPill> },
  { key: "implementationRule", header: "Rule", cell: (row) => <span className="text-sm text-muted-foreground">{row.implementationRule}</span> },
  { key: "testPlan", header: "Test Plan", cell: (row) => <span className="text-sm text-muted-foreground">{row.testPlan}</span> },
];

const schemaColumns: DataTableColumn<SchemaDecisionRecord>[] = [
  { key: "candidate", header: "Candidate", cell: (row) => <span className="font-medium text-foreground">{row.candidate}</span> },
  { key: "decision", header: "Decision", cell: (row) => <StatusPill tone={tone(row.decision)}>{row.decision}</StatusPill> },
  { key: "reason", header: "Reason", cell: (row) => <span className="text-sm text-muted-foreground">{row.reason}</span> },
  { key: "requiredProof", header: "Required Proof", cell: (row) => <span className="text-sm text-muted-foreground">{row.requiredProof}</span> },
];

const actionColumns: DataTableColumn<DevActionItem>[] = [
  { key: "priority", header: "Priority", cell: (row) => <StatusPill tone={tone(row.priority)}>{row.priority}</StatusPill> },
  { key: "title", header: "Action", cell: (row) => <span className="font-medium text-foreground">{row.title}</span> },
  { key: "owner", header: "Owner", cell: (row) => row.owner },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
  { key: "doneWhen", header: "Done When", cell: (row) => <span className="text-sm text-muted-foreground">{row.doneWhen}</span> },
];

export function InternalMonitoringControlRoom() {
  const summary = getControlRoomSummary();

  return (
    <>
      <DashboardPanel title="Control Room Readiness" description="Layer operasional untuk ngelihat mana yang siap naik API, mana yang masih mock, dan mana yang harus dikunci dulu.">
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          {controlRoomCards.map((card) => (
            <StatCard key={card.id} label={card.label} value={card.value} note={card.note} icon={Activity} tone={card.tone} />
          ))}
        </div>
      </DashboardPanel>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardPanel title="Runtime Signals" description="Sinyal utama dari route, mock data, API contract, dan schema guard.">
          <DataTable columns={signalColumns} data={controlRoomSignals} getRowKey={(row) => row.id} minWidth={1180} pagination={false} />
        </DashboardPanel>

        <DashboardPanel title="Dev Action Queue" description="Action item paling penting sebelum dashboard ini naik dari mock ke endpoint asli.">
          <DataTable columns={actionColumns} data={devActionItems} getRowKey={(row) => row.id} minWidth={1100} pagination={false} />
        </DashboardPanel>
      </div>

      <DashboardPanel title="API Implementation Blueprint" description="Blueprint teknis per endpoint: dari mock source, contract status, rule implementasi, sampai test plan.">
        <DataTable columns={apiColumns} data={apiImplementationSteps} getRowKey={(row) => row.id} minWidth={1700} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Schema Decision Records" description="Keputusan sementara untuk kandidat schema. Prisma tetap tidak disentuh sampai proof-nya cukup.">
        <DataTable columns={schemaColumns} data={schemaDecisionRecords} getRowKey={(row) => row.id} minWidth={1350} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Next Promotion Checklist" description="Checklist keras sebelum fase backend. Ini bukan ritual, ini pertahanan hidup dari migration yang sembrono.">
        <div className="grid gap-3 p-4 md:grid-cols-3">
          {[
            [GitBranch, "Route wired", `P0 actions: ${summary.p0Actions}. Route harus render dulu.`],
            [ServerCog, "API read-only", `${summary.readyContracts} contracts ready. Mulai dari GET endpoint.`],
            [Database, "Schema locked", `${summary.blockedSignals} blocked signal. Schema baru tetap hold.`],
            [ClipboardList, "Contracts synced", `${summary.totalSignals} signals wajib cocok dengan docs.`],
            [AlertTriangle, "Mutation guarded", "PATCH/POST internal harus nunggu audit + permission."],
            [Activity, "Fallback ready", "UI harus tetap render pakai mock kalau API belum aktif."],
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
