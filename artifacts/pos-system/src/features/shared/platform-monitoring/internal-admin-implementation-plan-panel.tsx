import { GitBranch, ListChecks } from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import type { DashboardTone } from "@/features/shared/types";

import {
  adminConsolePhaseCoverage,
  adminImplementationPhases,
  getAdminImplementationSummary,
  type AdminConsolePhaseCoverage,
  type AdminImplementationPhase,
  type AdminImplementationPhaseStatus,
} from "./internal-admin-implementation-plan.mock";

const statusTone: Record<AdminImplementationPhaseStatus, DashboardTone> = {
  implemented: "green",
  planned: "amber",
};

const phaseColumns: DataTableColumn<AdminImplementationPhase>[] = [
  {
    key: "phase",
    header: "Phase",
    cell: (row) => <span className="font-medium text-foreground">{row.phase}</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => <StatusPill tone={statusTone[row.status]}>{row.status}</StatusPill>,
  },
  {
    key: "scope",
    header: "Scope",
    cell: (row) => <span className="text-sm text-muted-foreground">{row.scope}</span>,
  },
  {
    key: "adminConsoleImpact",
    header: "Admin Console Impact",
    cell: (row) => <span className="text-sm text-muted-foreground">{row.adminConsoleImpact}</span>,
  },
  {
    key: "backendImpact",
    header: "Backend Impact",
    cell: (row) => <span className="text-sm text-muted-foreground">{row.backendImpact}</span>,
  },
  {
    key: "dashboardEvidence",
    header: "Dashboard Evidence",
    cell: (row) => <span className="text-sm text-muted-foreground">{row.dashboardEvidence}</span>,
  },
  {
    key: "nextAction",
    header: "Next Action",
    cell: (row) => <span className="text-sm text-muted-foreground">{row.nextAction}</span>,
  },
];

const coverageColumns: DataTableColumn<AdminConsolePhaseCoverage>[] = [
  {
    key: "consoleName",
    header: "Console",
    cell: (row) => <span className="font-medium text-foreground">{row.consoleName}</span>,
  },
  {
    key: "implementedCoverage",
    header: "Implemented Coverage",
    cell: (row) => <span className="text-sm text-muted-foreground">{row.implementedCoverage}</span>,
  },
  {
    key: "plannedCoverage",
    header: "Planned Coverage",
    cell: (row) => <span className="text-sm text-muted-foreground">{row.plannedCoverage}</span>,
  },
  {
    key: "backendReadiness",
    header: "Backend Readiness",
    cell: (row) => <span className="text-sm text-muted-foreground">{row.backendReadiness}</span>,
  },
  {
    key: "hardRule",
    header: "Hard Rule",
    cell: (row) => <span className="text-sm text-muted-foreground">{row.hardRule}</span>,
  },
];

export function InternalAdminImplementationPlanPanel() {
  const summary = getAdminImplementationSummary();

  return (
    <div className="space-y-5">
      <DashboardPanel
        title="Admin Backend Implementation Roadmap"
        description="Format phase implementasi backend admin console. Ini bukan business mode; ini internal platform admin layer."
      >
        <div className="grid gap-3 p-4 md:grid-cols-3">
          <StatCard
            label="Total Phases"
            value={summary.total}
            note="Roadmap backend admin console."
            icon={GitBranch}
            tone="slate"
          />
          <StatCard
            label="Implemented"
            value={summary.implemented}
            note="Foundation + workflow guard sudah masuk ke dashboard."
            icon={ListChecks}
            tone="green"
          />
          <StatCard
            label="Planned"
            value={summary.planned}
            note="Service split, permission, audit, summary, Prisma cleanup."
            icon={GitBranch}
            tone="amber"
          />
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="Implementation Phase Tracker"
        description="Status phase sesuai format backend implementation plan."
      >
        <DataTable
          columns={phaseColumns}
          data={adminImplementationPhases}
          getRowKey={(row) => row.id}
          minWidth={2300}
          pagination={false}
        />
      </DashboardPanel>

      <DashboardPanel
        title="Console Coverage Map"
        description="Mapping phase terhadap 5 admin console yang sudah dibuat route terpisah."
      >
        <DataTable
          columns={coverageColumns}
          data={adminConsolePhaseCoverage}
          getRowKey={(row) => row.id}
          minWidth={1900}
          pagination={false}
        />
      </DashboardPanel>
    </div>
  );
}
