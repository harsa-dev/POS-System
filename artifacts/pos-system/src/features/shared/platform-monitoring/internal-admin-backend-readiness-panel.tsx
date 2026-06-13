import { ServerCog } from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import type { DashboardTone } from "@/features/shared/types";

import type { InternalAdminConsoleId } from "./internal-admin-consoles.mock";
import {
  getInternalAdminBackendEndpoints,
  type BackendReadiness,
  type InternalAdminBackendEndpoint,
} from "./internal-admin-backend-wiring";

const readinessTone: Record<BackendReadiness, DashboardTone> = {
  "Mock Only": "slate",
  "Read API Ready": "green",
  "Write API Blocked": "rose",
};

const methodTone: Record<InternalAdminBackendEndpoint["method"], DashboardTone> = {
  GET: "green",
  POST: "amber",
  PATCH: "amber",
};

const endpointColumns: DataTableColumn<InternalAdminBackendEndpoint>[] = [
  {
    key: "method",
    header: "Method",
    cell: (row) => <StatusPill tone={methodTone[row.method]}>{row.method}</StatusPill>,
  },
  {
    key: "endpoint",
    header: "Endpoint",
    cell: (row) => <code className="text-xs text-muted-foreground">{row.endpoint}</code>,
  },
  {
    key: "queryKey",
    header: "Query Key",
    cell: (row) => <code className="text-xs text-muted-foreground">{row.queryKey}</code>,
  },
  {
    key: "controller",
    header: "Controller",
    cell: (row) => <span className="text-sm text-muted-foreground">{row.controller}</span>,
  },
  {
    key: "requestDto",
    header: "Request DTO",
    cell: (row) => <code className="text-xs text-muted-foreground">{row.requestDto}</code>,
  },
  {
    key: "responseDto",
    header: "Response DTO",
    cell: (row) => <code className="text-xs text-muted-foreground">{row.responseDto}</code>,
  },
  {
    key: "accessRule",
    header: "Access Rule",
    cell: (row) => <span className="text-sm text-muted-foreground">{row.accessRule}</span>,
  },
  {
    key: "readiness",
    header: "Readiness",
    cell: (row) => <StatusPill tone={readinessTone[row.readiness]}>{row.readiness}</StatusPill>,
  },
  {
    key: "nextStep",
    header: "Next Backend Step",
    cell: (row) => <span className="text-sm text-muted-foreground">{row.nextStep}</span>,
  },
];

export function InternalAdminBackendReadinessPanel({
  consoleId,
}: {
  consoleId: InternalAdminConsoleId;
}) {
  const endpoints = getInternalAdminBackendEndpoints(consoleId);
  const readReady = endpoints.filter((item) => item.readiness === "Read API Ready").length;
  const writeBlocked = endpoints.filter((item) => item.readiness === "Write API Blocked").length;

  return (
    <div className="space-y-5">
      <DashboardPanel
        title="Backend Wiring Readiness"
        description="Kontrak backend untuk console ini. Read API boleh dipromote dulu, write API tetap ditahan sampai guardrail siap."
      >
        <div className="grid gap-3 p-4 md:grid-cols-3">
          <StatCard
            label="Backend Endpoints"
            value={endpoints.length}
            note="Target API untuk console ini."
            icon={ServerCog}
            tone="slate"
          />
          <StatCard
            label="Read API Ready"
            value={readReady}
            note="Aman dipasang sebagai GET handler dulu."
            icon={ServerCog}
            tone="green"
          />
          <StatCard
            label="Write API Blocked"
            value={writeBlocked}
            note="Butuh RBAC, audit, approval, dan rollback."
            icon={ServerCog}
            tone={writeBlocked > 0 ? "rose" : "green"}
          />
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="Backend Contract Map"
        description="Endpoint, DTO, query key, controller target, access rule, dan next step."
      >
        <DataTable
          columns={endpointColumns}
          data={endpoints}
          getRowKey={(row) => row.id}
          minWidth={2100}
          pagination={false}
        />
      </DashboardPanel>
    </div>
  );
}