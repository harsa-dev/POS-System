"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  Crown,
  Database,
  FileStack,
  GitBranch,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import type { DashboardTone } from "@/features/shared/types";

import {
  loadAdminRoleConsoleData,
  type AdminRoleConsoleDataSourceResult,
  type AdminRoleConsoleSectionState,
} from "./admin-role-console-data-source";
import type {
  ConsoleRisk,
  ConsoleStatus,
  InternalAdminApiContract,
  InternalAdminMetric,
  InternalAdminSchemaCandidate,
  InternalAdminWorkflow,
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
  "mock-registry": "slate",
  "section-fallback": "amber",
};

function tone(value: string): DashboardTone {
  return toneMap[value] ?? "slate";
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

const rolloutColumns: DataTableColumn<InternalAdminApiContract>[] = [
  { key: "id", header: "Readiness Item", cell: (row) => <span className="font-medium text-foreground">{row.id}</span> },
  { key: "purpose", header: "Purpose", cell: (row) => <span className="text-sm text-muted-foreground">{row.purpose}</span> },
  { key: "authRule", header: "Access Planning", cell: (row) => <span className="text-sm text-muted-foreground">{row.authRule}</span> },
  { key: "blockedBy", header: "Blocked By", cell: (row) => <span className="text-sm text-muted-foreground">{row.blockedBy}</span> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
];

const schemaColumns: DataTableColumn<InternalAdminSchemaCandidate>[] = [
  { key: "model", header: "Candidate", cell: (row) => <span className="font-medium text-foreground">{row.model}</span> },
  { key: "purpose", header: "Purpose", cell: (row) => <span className="text-sm text-muted-foreground">{row.purpose}</span> },
  { key: "candidateFields", header: "Candidate Fields", cell: (row) => <code className="text-xs text-muted-foreground">{row.candidateFields}</code> },
  { key: "promoteWhen", header: "Promote When", cell: (row) => <span className="text-sm text-muted-foreground">{row.promoteWhen}</span> },
  { key: "risk", header: "Risk", cell: (row) => <StatusPill tone={tone(row.risk)}>{row.risk}</StatusPill> },
];

const sectionColumns: DataTableColumn<AdminRoleConsoleSectionState>[] = [
  { key: "label", header: "Section", cell: (row) => <span className="font-medium text-foreground">{row.label}</span> },
  { key: "source", header: "Source", cell: (row) => <StatusPill tone={tone(row.source)}>{row.source}</StatusPill> },
  { key: "records", header: "Records", cell: (row) => <span className="font-semibold text-foreground">{row.records}</span> },
  { key: "note", header: "Note", cell: (row) => <span className="text-sm text-muted-foreground">{row.note}</span> },
];

function AdminRoleConsoleSkeleton() {
  return (
    <DashboardPanel title="Admin Role Console" description="Loading read-only admin role data source.">
      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-lg border border-border bg-muted/40" />
        ))}
      </div>
    </DashboardPanel>
  );
}

export function AdminRoleConsolePage() {
  const [data, setData] = useState<AdminRoleConsoleDataSourceResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const result = await loadAdminRoleConsoleData();

        if (isMounted) {
          setData(result);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const fallbackSections = useMemo(
    () => data?.sectionFallbacks.filter((section) => section.fallback) ?? [],
    [data?.sectionFallbacks],
  );

  if (isLoading || !data) {
    return <AdminRoleConsoleSkeleton />;
  }

  const { consoleCard } = data;

  return (
    <div className="space-y-6">
      <DashboardPanel title={consoleCard.title} description={consoleCard.mission}>
        <div className="border-b border-border bg-muted/20 px-4 py-3" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <StatusPill tone={tone(data.source)}>Source: {data.source}</StatusPill>
            <span>Generated {new Date(data.generatedAt).toLocaleString()}</span>
            <span>Read-only frontend adapter. No backend, DB, Prisma, or role mutation in AR-2.</span>
          </div>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Owner Role" value={consoleCard.ownerRole} note={consoleCard.primaryJobs} icon={Crown} tone="slate" />
          <StatCard label="Readiness" value={consoleCard.readiness} note="Frontend mock registry with section fallback." icon={ClipboardCheck} tone={tone(consoleCard.readiness)} />
          <StatCard label="Risk" value={consoleCard.risk} note="Write behavior remains blocked." icon={LockKeyhole} tone={tone(consoleCard.risk)} />
          <StatCard label="Fallback Sections" value={fallbackSections.length} note="Section-level fallback coverage." icon={RotateCcw} tone={fallbackSections.length > 0 ? "amber" : "green"} />
        </div>
      </DashboardPanel>

      <DashboardPanel title="Read-only Safety Boundary" description="AR-2 is a frontend rollout step, not an internal role management engine.">
        <div className="grid gap-4 p-4 lg:grid-cols-3">
          <StatCard label="Backend" value="Not connected" note="No internal admin role endpoint is called in this phase." icon={Database} tone="slate" />
          <StatCard label="Mutation" value="Blocked" note="No role assignment, revocation, approval execution, or template write." icon={ShieldCheck} tone="rose" />
          <StatCard label="Write Items" value={data.blockedWriteItems} note="Rows that must stay planning-only." icon={LockKeyhole} tone={data.blockedWriteItems > 0 ? "rose" : "green"} />
        </div>
      </DashboardPanel>

      <DashboardPanel title="Section Source Health" description="Setiap section punya source/fallback state supaya nanti gampang diganti loader real tanpa membongkar UI.">
        <DataTable columns={sectionColumns} data={data.sectionFallbacks} getRowKey={(row) => row.key} minWidth={1100} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Console Metrics" description="Mock metrics loaded through the Admin Role Console data source adapter.">
        <DataTable columns={metricColumns} data={data.metrics} getRowKey={(row) => row.id} minWidth={950} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Console Workflows" description="Workflow planning rows from the frontend adapter. Execution remains blocked.">
        <DataTable columns={workflowColumns} data={data.workflows} getRowKey={(row) => row.id} minWidth={1700} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Read-only Rollout Preview" description="Frontend-only readiness map. This is not a backend contract phase.">
        <DataTable columns={rolloutColumns} data={data.rolloutPreview} getRowKey={(row) => row.id} minWidth={1500} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Schema Candidates" description="Candidate storage only. No Prisma promotion in AR-2.">
        <DataTable columns={schemaColumns} data={data.schemaCandidates} getRowKey={(row) => row.id} minWidth={1500} pagination={false} />
      </DashboardPanel>
    </div>
  );
}
