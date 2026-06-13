"use client";

import { AlertTriangle, Database, GitBranch, Server, ShieldCheck, TerminalSquare } from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import type { DashboardTone } from "@/features/shared/types";

import {
  getInternalContractSummary,
  internalApiContracts,
  internalDataIntegrityChecks,
  internalIncidentMocks,
  internalReleaseGates,
  internalRouteOwnershipMocks,
  internalSchemaCandidates,
  type InternalApiContract,
  type InternalDataIntegrityCheck,
  type InternalIncidentMock,
  type InternalReleaseGate,
  type InternalRouteOwnership,
  type InternalSchemaCandidate,
} from "./dev-monitoring-contracts.mock";

const toneMap: Record<string, DashboardTone> = {
  Draft: "slate",
  "Mock Ready": "green",
  "Needs Backend": "amber",
  Blocked: "rose",
  Low: "green",
  Medium: "amber",
  High: "rose",
  Active: "green",
  Planned: "slate",
  "Needs Wiring": "amber",
  Info: "blue",
  Warning: "amber",
  Critical: "rose",
  Required: "rose",
  Optional: "slate",
  Open: "rose",
  Watching: "amber",
  Resolved: "green",
};

function tone(status: string): DashboardTone {
  return toneMap[status] ?? "slate";
}

const apiContractColumns: DataTableColumn<InternalApiContract>[] = [
  { key: "domain", header: "Domain", cell: (row) => <span className="font-medium text-foreground">{row.domain}</span> },
  { key: "method", header: "Method", cell: (row) => <StatusPill tone="blue">{row.method}</StatusPill> },
  { key: "endpoint", header: "Endpoint", cell: (row) => <code className="text-xs text-muted-foreground">{row.endpoint}</code> },
  { key: "auth", header: "Auth", cell: (row) => <span className="text-sm text-muted-foreground">{row.auth}</span> },
  { key: "responseShape", header: "Response Shape", cell: (row) => <code className="text-xs text-muted-foreground">{row.responseShape}</code> },
  { key: "readiness", header: "Readiness", cell: (row) => <StatusPill tone={tone(row.readiness)}>{row.readiness}</StatusPill> },
];

const routeColumns: DataTableColumn<InternalRouteOwnership>[] = [
  { key: "route", header: "Route", cell: (row) => <code className="text-xs text-muted-foreground">{row.route}</code> },
  { key: "page", header: "Page", cell: (row) => <span className="text-sm text-muted-foreground">{row.page}</span> },
  { key: "module", header: "Module", cell: (row) => row.module },
  { key: "owner", header: "Owner", cell: (row) => row.owner },
  { key: "guard", header: "Guard", cell: (row) => <span className="text-sm text-muted-foreground">{row.guard}</span> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
];

const integrityColumns: DataTableColumn<InternalDataIntegrityCheck>[] = [
  { key: "check", header: "Check", cell: (row) => <span className="font-medium text-foreground">{row.check}</span> },
  { key: "scope", header: "Scope", cell: (row) => <code className="text-xs text-muted-foreground">{row.scope}</code> },
  { key: "expected", header: "Expected", cell: (row) => row.expected },
  { key: "current", header: "Current", cell: (row) => <span className="text-sm text-muted-foreground">{row.current}</span> },
  { key: "severity", header: "Severity", cell: (row) => <StatusPill tone={tone(row.severity)}>{row.severity}</StatusPill> },
];

const releaseGateColumns: DataTableColumn<InternalReleaseGate>[] = [
  { key: "gate", header: "Gate", cell: (row) => <span className="font-medium text-foreground">{row.gate}</span> },
  { key: "command", header: "Command", cell: (row) => <code className="text-xs text-muted-foreground">{row.command}</code> },
  { key: "owner", header: "Owner", cell: (row) => row.owner },
  { key: "passCondition", header: "Pass Condition", cell: (row) => <span className="text-sm text-muted-foreground">{row.passCondition}</span> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
];

const incidentColumns: DataTableColumn<InternalIncidentMock>[] = [
  { key: "time", header: "Time", cell: (row) => row.time },
  { key: "title", header: "Incident", cell: (row) => <span className="font-medium text-foreground">{row.title}</span> },
  { key: "area", header: "Area", cell: (row) => <code className="text-xs text-muted-foreground">{row.area}</code> },
  { key: "impact", header: "Impact", cell: (row) => <span className="text-sm text-muted-foreground">{row.impact}</span> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
];

export function DevMonitoringDeepDive() {
  const summary = getInternalContractSummary();

  return (
    <>
      <DashboardPanel title="Internal Contract Readiness" description="Lapisan persiapan sebelum API asli dibuat. Semua data masih mock, tapi shape-nya sengaja dibuat seperti kontrak backend beneran.">
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard label="API Contracts" value={String(summary.contracts)} note="future endpoint draft" icon={Server} tone="blue" />
          <StatCard label="Blocked APIs" value={String(summary.blockedContracts)} note="mutation belum aman" icon={AlertTriangle} tone="rose" />
          <StatCard label="Schema Candidates" value={String(summary.schemaCandidates)} note="planning only" icon={Database} tone="slate" />
          <StatCard label="Route Issues" value={String(summary.routeIssues)} note="wiring review" icon={GitBranch} tone="amber" />
          <StatCard label="Warnings" value={String(summary.warnings)} note="manual check" icon={ShieldCheck} tone="amber" />
          <StatCard label="Release Gates" value={String(summary.releaseGates)} note="before merge" icon={TerminalSquare} tone="rose" />
        </div>
      </DashboardPanel>

      <DashboardPanel title="Future API Contract Matrix" description="Kontrak endpoint internal: auth, request, response, error, owner, dan readiness sudah dipetakan. Handler belum dibuat.">
        <DataTable columns={apiContractColumns} data={internalApiContracts} getRowKey={(row) => row.id} minWidth={1480} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Schema Candidate Map" description="Kandidat model database. Ini hanya planning supaya nanti schema tidak ditambah asal tempel seperti stiker di motor. Belum ada Prisma update.">
        <div className="grid gap-3 p-4 xl:grid-cols-2">
          {internalSchemaCandidates.map((item: InternalSchemaCandidate) => (
            <article key={item.id} className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{item.model}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.purpose}</p>
                </div>
                <StatusPill tone={tone(item.risk)}>{item.risk} Risk</StatusPill>
              </div>
              <div className="grid gap-2 text-xs leading-5 text-muted-foreground">
                <code className="rounded-md bg-background px-3 py-2">Fields: {item.fields}</code>
                <code className="rounded-md bg-background px-3 py-2">Indexes: {item.indexes}</code>
                <code className="rounded-md bg-background px-3 py-2">Relations: {item.relations}</code>
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">Migration phase: {item.migrationPhase}</p>
            </article>
          ))}
        </div>
      </DashboardPanel>

      <DashboardPanel title="Route Ownership Matrix" description="Melacak route, page, module owner, guard, dan status wiring supaya dashboard internal tidak jadi yatim piatu di router.">
        <DataTable columns={routeColumns} data={internalRouteOwnershipMocks} getRowKey={(row) => row.id} minWidth={1380} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Data Integrity Checks" description="Checklist validasi aman sebelum dashboard ini naik dari mock ke API read-only.">
        <DataTable columns={integrityColumns} data={internalDataIntegrityChecks} getRowKey={(row) => row.id} minWidth={1280} pagination={false} />
      </DashboardPanel>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardPanel title="Release Gates" description="Gate minimum sebelum merge/deploy lokal. Bukan otomatis dulu, tapi sudah jelas command dan pass condition-nya.">
          <DataTable columns={releaseGateColumns} data={internalReleaseGates} getRowKey={(row) => row.id} minWidth={1040} pagination={false} />
        </DashboardPanel>

        <DashboardPanel title="Incident Timeline Mock" description="Dummy incident log untuk hal yang perlu diawasi selama refactor V3 berjalan.">
          <DataTable columns={incidentColumns} data={internalIncidentMocks} getRowKey={(row) => row.id} minWidth={940} pagination={false} />
        </DashboardPanel>
      </div>
    </>
  );
}
