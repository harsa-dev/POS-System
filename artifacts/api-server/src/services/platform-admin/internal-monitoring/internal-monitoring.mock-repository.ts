import type {
  InternalMonitoringApiImplementationStepDto,
  InternalMonitoringControlRoomCardDto,
  InternalMonitoringControlRoomSignalDto,
  InternalMonitoringDataIntegrityCheckDto,
  InternalMonitoringDevActionItemDto,
  InternalMonitoringRouteInventoryItemDto,
  InternalMonitoringSchemaDecisionRecordDto,
} from "./internal-monitoring.types.js";

export function getInternalMonitoringCards(): InternalMonitoringControlRoomCardDto[] {
  return [
    {
      id: "runtime-source",
      label: "Runtime Source",
      value: "Read-only API",
      note: "Server-side mock repository, mutation disabled.",
      tone: "green",
    },
    {
      id: "blocked-mutations",
      label: "Blocked Mutations",
      value: "4",
      note: "POST/PATCH/DELETE internal routes remain blocked.",
      tone: "rose",
    },
    {
      id: "ready-contracts",
      label: "Ready Contracts",
      value: "5",
      note: "Health, routes, contracts, integrity, and mutation-readiness endpoints are scaffolded.",
      tone: "blue",
    },
    {
      id: "schema-state",
      label: "Schema State",
      value: "Hold",
      note: "No Prisma schema promotion in this phase.",
      tone: "amber",
    },
  ];
}

export function getInternalMonitoringSignals(): InternalMonitoringControlRoomSignalDto[] {
  return [
    {
      id: "route-mounted",
      area: "Routing",
      signal: "Internal monitoring backend route mounted under /api/internal.",
      source: "artifacts/api-server/src/routes/internal-monitoring.ts",
      state: "Healthy",
      nextAction: "Keep GET-only route contract in static guard.",
    },
    {
      id: "frontend-adapter",
      area: "Frontend",
      signal: "Frontend adapter can consume read-only API and fall back to mock data.",
      source: "internal-monitoring-data-source.ts",
      state: "Healthy",
      nextAction: "Replace fallback badge with API badge during manual smoke.",
    },
    {
      id: "mutation-readiness",
      area: "Safety",
      signal: "Future mutations are represented as dry-run/readiness contracts only.",
      source: "internal-monitoring-mutation-readiness.ts",
      state: "Watch",
      nextAction: "Do not implement real mutation execution before audit, approval, rollback, and rate limit proof exist.",
    },
    {
      id: "mutation-blocked",
      area: "Safety",
      signal: "Internal monitoring mutation endpoints are blocked until audit and approval policy exist.",
      source: "platform-admin-internal-monitoring-check.mjs",
      state: "Blocked",
      nextAction: "Do not add POST/PATCH/DELETE internal routes in this phase.",
    },
    {
      id: "schema-hold",
      area: "Database",
      signal: "Internal monitoring persistence is not required for the first backend scaffold.",
      source: "platform-admin-internal-monitoring-dashboard-plan.md",
      state: "Watch",
      nextAction: "Collect proof before promoting InternalSystemProbe schema.",
    },
  ];
}

export function getInternalMonitoringApiImplementationSteps(): InternalMonitoringApiImplementationStepDto[] {
  return [
    {
      id: "health-summary",
      phase: "IM-3",
      endpoint: "GET /api/internal/health/summary",
      mockSource: "internal-monitoring.mock-repository.ts",
      contractStatus: "Ready",
      implementationRule: "Return control room DTO only. No mutation side effects.",
      testPlan: "platform-admin:check plus manual browser smoke.",
    },
    {
      id: "routes-inventory",
      phase: "IM-3",
      endpoint: "GET /api/internal/routes/inventory",
      mockSource: "internal-monitoring.mock-repository.ts",
      contractStatus: "Ready",
      implementationRule: "Return route ownership inventory. No route mutation.",
      testPlan: "Static guard checks endpoint string and route file.",
    },
    {
      id: "contracts-readiness",
      phase: "IM-3",
      endpoint: "GET /api/internal/contracts/readiness",
      mockSource: "internal-monitoring.mock-repository.ts",
      contractStatus: "Ready",
      implementationRule: "Return API contract readiness table only.",
      testPlan: "Static guard checks GET-only API surface.",
    },
    {
      id: "integrity-checks",
      phase: "IM-3",
      endpoint: "GET /api/internal/data-integrity/checks",
      mockSource: "internal-monitoring.mock-repository.ts",
      contractStatus: "Ready",
      implementationRule: "Return source-level checks. Do not repair automatically.",
      testPlan: "Static guard blocks internal mutation wiring.",
    },
    {
      id: "mutation-readiness",
      phase: "IM-10",
      endpoint: "GET /api/internal/mutation-readiness/contracts",
      mockSource: "internal-monitoring-mutation-readiness.ts",
      contractStatus: "Ready",
      implementationRule: "Return future mutation readiness metadata only. No mutation execution.",
      testPlan: "Static guard checks GET-only endpoint and blocks internal mutation wiring.",
    },
  ];
}

export function getInternalMonitoringSchemaDecisionRecords(): InternalMonitoringSchemaDecisionRecordDto[] {
  return [
    {
      id: "internal-system-probe",
      candidate: "InternalSystemProbe",
      decision: "Hold",
      reason: "Current dashboard can run from read-only mock-backed service.",
      requiredProof: "Need historical trend and retention requirement before Prisma model promotion.",
    },
    {
      id: "internal-alert",
      candidate: "InternalAlert",
      decision: "Hold",
      reason: "Alert acknowledgement is blocked until audit and approval policy exist.",
      requiredProof: "Need audit event, approval workflow, and rollback note.",
    },
    {
      id: "route-snapshot",
      candidate: "InternalRouteSnapshot",
      decision: "Promote Later",
      reason: "Route inventory can be static in the first backend scaffold.",
      requiredProof: "Need route drift history before persistence.",
    },
  ];
}

export function getInternalMonitoringDevActionItems(): InternalMonitoringDevActionItemDto[] {
  return [
    {
      id: "pa-im-3",
      priority: "P0",
      title: "Mount GET-only internal monitoring backend route",
      owner: "Platform Admin",
      status: "Doing",
      doneWhen: "Frontend source badge can show Read-only API instead of Fallback Mock.",
    },
    {
      id: "pa-im-4",
      priority: "P1",
      title: "Add frontend sections for route inventory and contract readiness API payloads",
      owner: "Platform Admin",
      status: "Todo",
      doneWhen: "Dashboard sections consume backend DTOs with mock fallback.",
    },
    {
      id: "pa-im-10",
      priority: "P0",
      title: "Keep future mutation actions design-only and dry-run first",
      owner: "Platform Admin",
      status: "Doing",
      doneWhen: "Mutation readiness contracts list RBAC, audit, approval, rollback, rate limit, and proof requirements without executing writes.",
    },
    {
      id: "pa-im-guard",
      priority: "P0",
      title: "Keep internal monitoring mutation routes blocked",
      owner: "Platform Admin",
      status: "Doing",
      doneWhen: "platform-admin:check fails on /api/internal POST/PATCH/DELETE.",
    },
  ];
}

export function getInternalMonitoringRouteInventory(): InternalMonitoringRouteInventoryItemDto[] {
  return [
    {
      id: "internal-monitoring",
      route: "/dashboard/internal-monitoring",
      owner: "Platform Admin",
      guard: "platform-admin",
      status: "active",
      notes: "Frontend route is mounted behind platform-admin.internal-monitoring.read. Backend endpoint uses OWNER/ADMIN policy.",
    },
    {
      id: "admin-role-console",
      route: "/dashboard/internal/admin-role-console",
      owner: "Platform Admin",
      guard: "auth",
      status: "active",
      notes: "Mock console. Must not get mutation endpoints before RBAC/audit guard.",
    },
    {
      id: "approval-control-console",
      route: "/dashboard/internal/approval-control-console",
      owner: "Platform Admin",
      guard: "auth",
      status: "active",
      notes: "Approval decisions are mock-only and blocked from backend mutation.",
    },
  ];
}

export function getInternalMonitoringDataIntegrityChecks(): InternalMonitoringDataIntegrityCheckDto[] {
  return [
    {
      id: "read-only-phase",
      check: "Internal monitoring is read-only",
      status: "pass",
      severity: "info",
      detail: "Only GET endpoints are scaffolded under /api/internal.",
    },
    {
      id: "no-prisma-promotion",
      check: "No Prisma schema promotion",
      status: "pass",
      severity: "info",
      detail: "Internal monitoring repository is mock-backed and does not add persistence models.",
    },
    {
      id: "mutation-readiness-design-only",
      check: "Mutation readiness is design-only",
      status: "pass",
      severity: "warning",
      detail: "Future mutation contracts are exposed as read-only metadata and require dry-run proof before execution exists.",
    },
    {
      id: "mutation-blocker",
      check: "No internal mutation wiring",
      status: "pass",
      severity: "critical",
      detail: "platform-admin:check blocks POST/PATCH/DELETE internal route wiring.",
    },
  ];
}
