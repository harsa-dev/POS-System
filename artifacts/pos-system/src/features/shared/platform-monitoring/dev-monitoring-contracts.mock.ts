export type ContractReadiness = "Draft" | "Mock Ready" | "Needs Backend" | "Blocked";

export type InternalApiContract = {
  id: string;
  domain: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  endpoint: string;
  purpose: string;
  auth: string;
  requestShape: string;
  responseShape: string;
  errors: string;
  mockSource: string;
  owner: string;
  readiness: ContractReadiness;
};

export type InternalSchemaCandidate = {
  id: string;
  model: string;
  purpose: string;
  fields: string;
  indexes: string;
  relations: string;
  migrationPhase: string;
  risk: "Low" | "Medium" | "High";
};

export type InternalRouteOwnership = {
  id: string;
  route: string;
  page: string;
  module: string;
  owner: string;
  guard: string;
  status: "Active" | "Planned" | "Needs Wiring";
};

export type InternalDataIntegrityCheck = {
  id: string;
  check: string;
  scope: string;
  expected: string;
  current: string;
  severity: "Info" | "Warning" | "Critical";
};

export type InternalReleaseGate = {
  id: string;
  gate: string;
  command: string;
  owner: string;
  passCondition: string;
  status: "Required" | "Optional" | "Blocked";
};

export type InternalIncidentMock = {
  id: string;
  time: string;
  title: string;
  area: string;
  impact: string;
  action: string;
  status: "Open" | "Watching" | "Resolved";
};

export const internalApiContracts: InternalApiContract[] = [
  {
    id: "api-health-summary",
    domain: "Platform Health",
    method: "GET",
    endpoint: "/api/internal/health/summary",
    purpose: "Return overall service status, warning count, critical count, and last probe timestamp.",
    auth: "OWNER or SUPER_ADMIN only. Later: internal.monitor.read permission.",
    requestShape: "Query: tenantId?, mode?, includeMock=false",
    responseShape: "{ summary, services[], incidents[], generatedAt }",
    errors: "401 unauthorized, 403 forbidden, 503 probe unavailable",
    mockSource: "devServiceHealthMocks + devMonitoringMetrics",
    owner: "Core Platform",
    readiness: "Mock Ready",
  },
  {
    id: "api-route-inventory",
    domain: "Route Inventory",
    method: "GET",
    endpoint: "/api/internal/routes/inventory",
    purpose: "Expose registered dashboard routes, page ownership, guard, and wiring status.",
    auth: "OWNER or SUPER_ADMIN only.",
    requestShape: "Query: group?, status?, mode?",
    responseShape: "{ routes[], totals: { active, planned, needsWiring } }",
    errors: "401 unauthorized, 403 forbidden",
    mockSource: "internalRouteOwnershipMocks",
    owner: "Frontend Architecture",
    readiness: "Needs Backend",
  },
  {
    id: "api-contract-readiness",
    domain: "API Contract Registry",
    method: "GET",
    endpoint: "/api/internal/contracts/readiness",
    purpose: "List future API contracts for shared dashboards before server handlers are implemented.",
    auth: "OWNER or SUPER_ADMIN only.",
    requestShape: "Query: domain?, readiness?, owner?",
    responseShape: "{ contracts[], countsByReadiness, generatedAt }",
    errors: "401 unauthorized, 403 forbidden",
    mockSource: "internalApiContracts",
    owner: "Backend Planning",
    readiness: "Draft",
  },
  {
    id: "api-integrity-checks",
    domain: "Data Integrity",
    method: "GET",
    endpoint: "/api/internal/data-integrity/checks",
    purpose: "Run safe read-only checks for route constants, module registry, mock data shape, and schema drift.",
    auth: "OWNER or SUPER_ADMIN only.",
    requestShape: "Query: scope?, severity?",
    responseShape: "{ checks[], failedCount, warningCount, generatedAt }",
    errors: "401 unauthorized, 403 forbidden, 500 check runner failed",
    mockSource: "internalDataIntegrityChecks",
    owner: "Quality Gate",
    readiness: "Needs Backend",
  },
  {
    id: "api-alert-acknowledge",
    domain: "Internal Alerts",
    method: "PATCH",
    endpoint: "/api/internal/alerts/:alertId/acknowledge",
    purpose: "Mark internal warning/incident as acknowledged by owner/dev.",
    auth: "OWNER or SUPER_ADMIN only. Later: internal.alert.write permission.",
    requestShape: "Params: alertId. Body: { note?: string, nextAction?: string }",
    responseShape: "{ alert, acknowledgedBy, acknowledgedAt }",
    errors: "400 invalid body, 401 unauthorized, 403 forbidden, 404 alert not found",
    mockSource: "internalIncidentMocks",
    owner: "Internal Ops",
    readiness: "Blocked",
  },
];

export const internalSchemaCandidates: InternalSchemaCandidate[] = [
  {
    id: "schema-probe",
    model: "InternalSystemProbe",
    purpose: "Persist periodic service checks if health monitoring needs history.",
    fields: "id, tenantId?, service, area, status, latencyMs, checkedAt, metadataJson",
    indexes: "@@index([service, checkedAt]), @@index([tenantId, checkedAt])",
    relations: "optional Tenant relation later",
    migrationPhase: "Phase 2 after API read-only handler exists",
    risk: "Low",
  },
  {
    id: "schema-alert",
    model: "InternalAlert",
    purpose: "Store internal platform warnings, acknowledgements, and ownership.",
    fields: "id, source, severity, title, status, acknowledgedById?, acknowledgedAt?, createdAt",
    indexes: "@@index([status, severity]), @@index([source, createdAt])",
    relations: "acknowledgedBy -> User optional",
    migrationPhase: "Phase 3 after alert UI action is real",
    risk: "Medium",
  },
  {
    id: "schema-route-snapshot",
    model: "InternalRouteSnapshot",
    purpose: "Snapshot route inventory when route registry becomes dynamic or multi-tenant.",
    fields: "id, route, moduleId, guard, mode, status, capturedAt",
    indexes: "@@index([moduleId, status]), @@index([capturedAt])",
    relations: "none for first implementation",
    migrationPhase: "Optional. Prefer computed runtime data first.",
    risk: "Low",
  },
  {
    id: "schema-feature-flag",
    model: "FeatureFlagSnapshot",
    purpose: "Track enabled/disabled platform features per tenant/mode.",
    fields: "id, tenantId, mode, key, enabled, source, capturedAt",
    indexes: "@@unique([tenantId, mode, key]), @@index([mode, enabled])",
    relations: "tenant -> Restaurant/Organization later depending final tenant model",
    migrationPhase: "Phase 4 after business modes stabilize",
    risk: "High",
  },
];

export const internalRouteOwnershipMocks: InternalRouteOwnership[] = [
  {
    id: "route-monitoring",
    route: "/dashboard/internal-monitoring",
    page: "pages/dashboard/platform-monitoring.tsx",
    module: "settings",
    owner: "Super Admin / Dev",
    guard: "settings.manage + protected dashboard shell",
    status: "Needs Wiring",
  },
  {
    id: "route-overview",
    route: "/dashboard/overview",
    page: "pages/dashboard/overview.tsx",
    module: "shared business",
    owner: "Business Overview",
    guard: "shared dashboard route",
    status: "Active",
  },
  {
    id: "route-hpp",
    route: "/dashboard/hpp-calculator",
    page: "pages/dashboard/hpp-calculator.tsx",
    module: "shared reports",
    owner: "HPP Planning",
    guard: "dashboard access",
    status: "Active",
  },
  {
    id: "route-payroll",
    route: "/dashboard/payroll",
    page: "pages/dashboard/payroll.tsx",
    module: "employees",
    owner: "Workforce Ops",
    guard: "employees.manage planned",
    status: "Active",
  },
];

export const internalDataIntegrityChecks: InternalDataIntegrityCheck[] = [
  {
    id: "check-no-schema-change",
    check: "No Prisma schema mutation in UI-only phase",
    scope: "database/schema",
    expected: "schema.prisma unchanged",
    current: "Manual check required after pull",
    severity: "Warning",
  },
  {
    id: "check-route-constant",
    check: "Internal monitoring route constant exists",
    scope: "routing/constants",
    expected: "ROUTES.INTERNAL_MONITORING is defined",
    current: "Prepared",
    severity: "Info",
  },
  {
    id: "check-app-route",
    check: "Internal monitoring page is mounted in App router",
    scope: "routing/app",
    expected: "Route renders page component",
    current: "Needs manual wiring if connector blocked",
    severity: "Warning",
  },
  {
    id: "check-contract-shape",
    check: "Every future API contract has auth, request, response, and error shape",
    scope: "api/planning",
    expected: "No empty contract fields",
    current: "Mock contract complete",
    severity: "Info",
  },
];

export const internalReleaseGates: InternalReleaseGate[] = [
  {
    id: "gate-typecheck",
    gate: "TypeScript check",
    command: "pnpm typecheck",
    owner: "Frontend",
    passCondition: "No TS errors from new mock types, imports, or route constants.",
    status: "Required",
  },
  {
    id: "gate-build",
    gate: "Production build",
    command: "pnpm build",
    owner: "Frontend",
    passCondition: "Dashboard compiles without route/lazy import failure.",
    status: "Required",
  },
  {
    id: "gate-schema-diff",
    gate: "Schema diff review",
    command: "git diff -- prisma/schema.prisma",
    owner: "Backend",
    passCondition: "No Prisma diff in this UI-only phase.",
    status: "Required",
  },
  {
    id: "gate-smoke",
    gate: "Manual route smoke test",
    command: "open /dashboard/internal-monitoring",
    owner: "Project Owner",
    passCondition: "Page renders, tables load, no console crash.",
    status: "Required",
  },
];

export const internalIncidentMocks: InternalIncidentMock[] = [
  {
    id: "inc-route-wiring",
    time: "Mock 11:20",
    title: "Internal monitoring route prepared but may need App wiring",
    area: "router",
    impact: "Dashboard page exists but direct route may not render until App.tsx is updated.",
    action: "Add lazy import and protected route entry when connector/build allows.",
    status: "Watching",
  },
  {
    id: "inc-schema-hold",
    time: "Mock 11:24",
    title: "Schema candidates intentionally parked",
    area: "database",
    impact: "No persistence for probe history yet. Safe for UI phase.",
    action: "Only promote schema after API read-only contracts are implemented.",
    status: "Resolved",
  },
  {
    id: "inc-shared-growth",
    time: "Mock 11:30",
    title: "Shared dashboard count growing fast",
    area: "features/shared",
    impact: "Sidebar and route ownership can become messy if naming is not guarded.",
    action: "Keep route ownership table updated before adding more dashboards.",
    status: "Open",
  },
];

export function getInternalContractSummary() {
  return {
    contracts: internalApiContracts.length,
    blockedContracts: internalApiContracts.filter((item) => item.readiness === "Blocked").length,
    schemaCandidates: internalSchemaCandidates.length,
    routeIssues: internalRouteOwnershipMocks.filter((item) => item.status === "Needs Wiring").length,
    warnings: internalDataIntegrityChecks.filter((item) => item.severity === "Warning").length,
    releaseGates: internalReleaseGates.filter((item) => item.status === "Required").length,
  };
}
