"use client";

import {
  BadgeDollarSign,
  ClipboardCheck,
  ClipboardList,
  Crown,
  FileClock,
  LifeBuoy,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import type { DashboardTone } from "@/features/shared/types";

import {
  internalAdminActionRows,
  internalAdminApiContracts,
  internalAdminConsoleCards,
  internalAdminMetrics,
  internalAdminSchemaCandidates,
  internalAdminWorkflows,
  type ConsoleRisk,
  type ConsoleStatus,
  type InternalAdminActionRow,
  type InternalAdminApiContract,
  type InternalAdminConsoleId,
  type InternalAdminMetric,
  type InternalAdminSchemaCandidate,
  type InternalAdminWorkflow,
} from "./internal-admin-consoles.mock";

const toneMap: Record<ConsoleStatus | ConsoleRisk | string, DashboardTone> = {
  "Ready Mock": "green",
  Draft: "amber",
  "Needs API": "amber",
  Blocked: "rose",
  Low: "green",
  Medium: "amber",
  High: "rose",
  Critical: "rose",
  GET: "green",
  POST: "amber",
  PATCH: "amber",
};

const iconMap = {
  "admin-role-console": Crown,
  "billing-operations-console": BadgeDollarSign,
  "support-ops-console": LifeBuoy,
  "admin-action-audit": FileClock,
  "sensitive-action-approval": ShieldCheck,
} satisfies Record<InternalAdminConsoleId, typeof Crown>;

function tone(value: string): DashboardTone {
  return toneMap[value] ?? "slate";
}

function filterByConsole<T extends { consoleId: InternalAdminConsoleId }>(
  items: T[],
  consoleId: InternalAdminConsoleId,
) {
  return items.filter((item) => item.consoleId === consoleId);
}

const metricColumns: DataTableColumn<InternalAdminMetric>[] = [
  { key: "label", header: "Metric", cell: (row) => <span className="font-medium text-foreground">{row.label}</span> },
  { key: "value", header: "Value", cell: (row) => <span className="font-semibold text-foreground">{row.value}</span> },
  { key: "note", header: "Note", cell: (row) => <span className="text-sm text-muted-foreground">{row.note}</span> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
];

const workflowColumns: DataTableColumn<InternalAdminWorkflow>[] = [
  { key: "workflow", header: "Workflow", cell: (row) => <span className="font-medium text-foreground">{row.workflow}</span> },
  { key: "actor", header: "Actor", cell: (row) => row.actor },
  { key: "currentMockStep", header: "Current Mock Step", cell: (row) => <span className="text-sm text-muted-foreground">{row.currentMockStep}</span> },
  { key: "futureAutomation", header: "Future Automation", cell: (row) => <span className="text-sm text-muted-foreground">{row.futureAutomation}</span> },
  { key: "requiredGuardrail", header: "Guardrail", cell: (row) => <span className="text-sm text-muted-foreground">{row.requiredGuardrail}</span> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
];

const apiColumns: DataTableColumn<InternalAdminApiContract>[] = [
  { key: "method", header: "Method", cell: (row) => <StatusPill tone={tone(row.method)}>{row.method}</StatusPill> },
  { key: "endpoint", header: "Endpoint", cell: (row) => <code className="text-xs text-muted-foreground">{row.endpoint}</code> },
  { key: "purpose", header: "Purpose", cell: (row) => <span className="text-sm text-muted-foreground">{row.purpose}</span> },
  { key: "authRule", header: "Auth Rule", cell: (row) => <span className="text-sm text-muted-foreground">{row.authRule}</span> },
  { key: "responseShape", header: "Response", cell: (row) => <code className="text-xs text-muted-foreground">{row.responseShape}</code> },
  { key: "blockedBy", header: "Blocked By", cell: (row) => <span className="text-sm text-muted-foreground">{row.blockedBy}</span> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
];

const schemaColumns: DataTableColumn<InternalAdminSchemaCandidate>[] = [
  { key: "model", header: "Model", cell: (row) => <span className="font-medium text-foreground">{row.model}</span> },
  { key: "purpose", header: "Purpose", cell: (row) => <span className="text-sm text-muted-foreground">{row.purpose}</span> },
  { key: "candidateFields", header: "Candidate Fields", cell: (row) => <code className="text-xs text-muted-foreground">{row.candidateFields}</code> },
  { key: "promoteWhen", header: "Promote When", cell: (row) => <span className="text-sm text-muted-foreground">{row.promoteWhen}</span> },
  { key: "risk", header: "Risk", cell: (row) => <StatusPill tone={tone(row.risk)}>{row.risk}</StatusPill> },
];

const actionColumns: DataTableColumn<InternalAdminActionRow>[] = [
  { key: "action", header: "Action", cell: (row) => <span className="font-medium text-foreground">{row.action}</span> },
  { key: "requester", header: "Requester", cell: (row) => row.requester },
  { key: "target", header: "Target", cell: (row) => <span className="text-sm text-muted-foreground">{row.target}</span> },
  { key: "approvalRule", header: "Approval Rule", cell: (row) => <span className="text-sm text-muted-foreground">{row.approvalRule}</span> },
  { key: "rollbackPlan", header: "Rollback Plan", cell: (row) => <span className="text-sm text-muted-foreground">{row.rollbackPlan}</span> },
  { key: "risk", header: "Risk", cell: (row) => <StatusPill tone={tone(row.risk)}>{row.risk}</StatusPill> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
];

export function InternalAdminConsolePage({
  consoleId,
}: {
  consoleId: InternalAdminConsoleId;
}) {
  const consoleCard = internalAdminConsoleCards.find((item) => item.id === consoleId);

  if (!consoleCard) {
    return (
      <DashboardPanel title="Admin Console Not Found" description="Console id tidak ditemukan di mock registry.">
        <div className="p-4 text-sm text-muted-foreground">Periksa internal-admin-consoles.mock.ts.</div>
      </DashboardPanel>
    );
  }

  const Icon = iconMap[consoleId];
  const metrics = filterByConsole(internalAdminMetrics, consoleId);
  const workflows = filterByConsole(internalAdminWorkflows, consoleId);
  const apiContracts = filterByConsole(internalAdminApiContracts, consoleId);
  const schemaCandidates = filterByConsole(internalAdminSchemaCandidates, consoleId);
  const actionRows = filterByConsole(internalAdminActionRows, consoleId);

  return (
    <div className="space-y-6">
      <DashboardPanel title={consoleCard.title} description={consoleCard.mission}>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Owner Role" value={consoleCard.ownerRole} note={consoleCard.primaryJobs} icon={Icon} tone="slate" />
          <StatCard label="Readiness" value={consoleCard.readiness} note="Masih mock-only, belum backend." icon={ClipboardCheck} tone={tone(consoleCard.readiness)} />
          <StatCard label="Risk" value={consoleCard.risk} note="Butuh guardrail sebelum mutation." icon={LockKeyhole} tone={tone(consoleCard.risk)} />
          <StatCard label="API Contracts" value={apiContracts.length} note="GET dulu, mutation nanti." icon={ClipboardList} tone="amber" />
        </div>
      </DashboardPanel>

      <DashboardPanel title="Scope Boundary" description="Batas aman console ini sebelum ada RBAC dan audit beneran.">
        <div className="grid gap-4 p-4 lg:grid-cols-2">
          <article className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Primary jobs</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{consoleCard.primaryJobs}</p>
          </article>
          <article className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Blocked scope</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{consoleCard.blockedScope}</p>
          </article>
        </div>
      </DashboardPanel>

      <DashboardPanel title="Console Metrics" description="Dummy metrics untuk ringkasan operasional console.">
        <DataTable columns={metricColumns} data={metrics} getRowKey={(row) => row.id} minWidth={950} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Console Workflows" description="Workflow dummy yang nanti bisa diganti API/task engine.">
        <DataTable columns={workflowColumns} data={workflows} getRowKey={(row) => row.id} minWidth={1700} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Future API Contracts" description="Kontrak API khusus console ini. Belum ada handler real.">
        <DataTable columns={apiColumns} data={apiContracts} getRowKey={(row) => row.id} minWidth={1900} pagination={false} />
      </DashboardPanel>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.05fr]">
        <DashboardPanel title="Schema Candidates" description="Kandidat model Prisma. Jangan masuk schema sampai API real dan kebutuhan persistence jelas.">
          <DataTable columns={schemaColumns} data={schemaCandidates} getRowKey={(row) => row.id} minWidth={1500} pagination={false} />
        </DashboardPanel>

        <DashboardPanel title="Sensitive Actions" description="Aksi dummy yang butuh approval, audit, dan rollback sebelum boleh jadi mutation real.">
          <DataTable columns={actionColumns} data={actionRows} getRowKey={(row) => row.id} minWidth={1700} pagination={false} />
        </DashboardPanel>
      </div>
    </div>
  );
}

export function AdminRoleConsolePage() {
  return <InternalAdminConsolePage consoleId="admin-role-console" />;
}

export function BillingOperationsConsolePage() {
  return <InternalAdminConsolePage consoleId="billing-operations-console" />;
}

export function SupportOpsConsolePage() {
  return <InternalAdminConsolePage consoleId="support-ops-console" />;
}

export function AdminActionAuditConsolePage() {
  return <InternalAdminConsolePage consoleId="admin-action-audit" />;
}

export function SensitiveActionApprovalConsolePage() {
  return <InternalAdminConsolePage consoleId="sensitive-action-approval" />;
}
