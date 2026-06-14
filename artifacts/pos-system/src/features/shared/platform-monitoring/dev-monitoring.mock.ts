export type DevMetricStatus = "Healthy" | "Warning" | "Critical" | "Mock Only";

export type DevMonitoringMetric = {
  id: string;
  label: string;
  value: string;
  note: string;
  status: DevMetricStatus;
};

export type DevServiceHealth = {
  id: string;
  service: string;
  area: string;
  status: DevMetricStatus;
  uptime: string;
  latency: string;
  lastCheck: string;
  owner: string;
};

export type DevTenantModeSnapshot = {
  id: string;
  mode: string;
  tenants: number;
  activeRoutes: number;
  mockRoutes: number;
  risk: DevMetricStatus;
};

export type DevTaskQueueItem = {
  id: string;
  task: string;
  source: string;
  priority: "Low" | "Medium" | "High";
  status: "Queued" | "In Review" | "Blocked" | "Done";
  target: string;
};

export type DevApiPreparation = {
  id: string;
  domain: string;
  futureEndpoint: string;
  method: "GET" | "POST" | "PATCH";
  mockSource: string;
  schemaPlan: string;
  readiness: DevMetricStatus;
};

export const devMonitoringMetrics: DevMonitoringMetric[] = [
  {
    id: "metric-api",
    label: "Mock API Readiness",
    value: "68%",
    note: "Endpoint contract sudah dipisah dari UI untuk beberapa shared dashboard.",
    status: "Warning",
  },
  {
    id: "metric-schema",
    label: "Schema Touch Risk",
    value: "0 migration",
    note: "Belum ada Prisma schema update di phase monitoring ini.",
    status: "Healthy",
  },
  {
    id: "metric-routes",
    label: "Protected Routes",
    value: "31 routes",
    note: "Termasuk Restaurant, shared dashboards, dan V3 workspaces.",
    status: "Mock Only",
  },
  {
    id: "metric-alert",
    label: "Dev Alerts",
    value: "5 open",
    note: "Mostly dummy alerts untuk build, naming, dan route ownership review.",
    status: "Warning",
  },
];

export const devServiceHealthMocks: DevServiceHealth[] = [
  {
    id: "svc-auth",
    service: "Auth Session",
    area: "core/auth",
    status: "Healthy",
    uptime: "99.8%",
    latency: "42ms",
    lastCheck: "Mock 10:12",
    owner: "Core",
  },
  {
    id: "svc-registry",
    service: "Mode Registry",
    area: "app/registry",
    status: "Healthy",
    uptime: "100%",
    latency: "local",
    lastCheck: "Mock 10:14",
    owner: "Architecture",
  },
  {
    id: "svc-shared-dashboard",
    service: "Shared Dashboards",
    area: "features/shared",
    status: "Warning",
    uptime: "mock",
    latency: "client-only",
    lastCheck: "Mock 10:18",
    owner: "Business UI",
  },
  {
    id: "svc-prisma",
    service: "Prisma Schema",
    area: "server/db",
    status: "Mock Only",
    uptime: "not checked",
    latency: "n/a",
    lastCheck: "No runtime probe",
    owner: "Backend",
  },
];

export const devTenantModeSnapshots: DevTenantModeSnapshot[] = [
  { id: "mode-restaurant", mode: "Restaurant", tenants: 4, activeRoutes: 17, mockRoutes: 3, risk: "Healthy" },
  { id: "mode-retail", mode: "Retail", tenants: 1, activeRoutes: 0, mockRoutes: 9, risk: "Warning" },
  { id: "mode-raw", mode: "Raw Material", tenants: 1, activeRoutes: 7, mockRoutes: 5, risk: "Warning" },
  { id: "mode-custom", mode: "Custom Business", tenants: 1, activeRoutes: 0, mockRoutes: 8, risk: "Mock Only" },
];

export const devTaskQueueMocks: DevTaskQueueItem[] = [
  {
    id: "task-001",
    task: "Verify shared dashboard route ownership",
    source: "Dev Monitor",
    priority: "High",
    status: "In Review",
    target: "routes + sidebar registry",
  },
  {
    id: "task-002",
    task: "Prepare API contracts for workforce dashboards",
    source: "Shared Business",
    priority: "High",
    status: "Queued",
    target: "mock data adapters",
  },
  {
    id: "task-003",
    task: "Check naming conflicts from general naming AI",
    source: "Naming AI",
    priority: "Medium",
    status: "Queued",
    target: "constants + labels",
  },
  {
    id: "task-004",
    task: "Keep service mode changes isolated",
    source: "Business Mode Service AI",
    priority: "High",
    status: "Blocked",
    target: "mode boundary docs",
  },
];

export const devApiPreparationMocks: DevApiPreparation[] = [
  {
    id: "api-health",
    domain: "Health Monitor",
    method: "GET",
    futureEndpoint: "/api/internal/health",
    mockSource: "devServiceHealthMocks",
    schemaPlan: "No schema needed. Runtime probe only.",
    readiness: "Warning",
  },
  {
    id: "api-tenant-mode",
    domain: "Tenant Mode Snapshot",
    method: "GET",
    futureEndpoint: "/api/internal/modes/summary",
    mockSource: "devTenantModeSnapshots",
    schemaPlan: "Future Tenant, BusinessModeConfig, FeatureFlagSnapshot.",
    readiness: "Mock Only",
  },
  {
    id: "api-dev-task",
    domain: "Dev Task Queue",
    method: "GET",
    futureEndpoint: "/api/internal/dev/tasks",
    mockSource: "devTaskQueueMocks",
    schemaPlan: "Future DevTask or read from GitHub issues later.",
    readiness: "Mock Only",
  },
  {
    id: "api-alert-ack",
    domain: "Alert Acknowledge",
    method: "PATCH",
    futureEndpoint: "/api/internal/alerts/:id/ack",
    mockSource: "static alert state",
    schemaPlan: "Future InternalAlert and InternalAlertEvent.",
    readiness: "Critical",
  },
];

export const devSchemaPreparation = [
  {
    model: "InternalSystemProbe",
    fields: "id, service, status, latencyMs, checkedAt, metadataJson",
    reason: "Optional kalau health check ingin disimpan historis, bukan cuma realtime.",
  },
  {
    model: "InternalAlert",
    fields: "id, severity, source, title, status, acknowledgedById, createdAt",
    reason: "Untuk audit internal alert dan approval dev nanti.",
  },
  {
    model: "TenantModeSnapshot",
    fields: "id, tenantId, mode, enabledModulesJson, riskLevel, capturedAt",
    reason: "Untuk monitoring multi-business-mode saat platform mulai punya banyak tenant.",
  },
];

export function getDevMonitoringSummary() {
  return {
    services: devServiceHealthMocks.length,
    warnings: devServiceHealthMocks.filter((item) => item.status === "Warning").length,
    critical: devApiPreparationMocks.filter((item) => item.readiness === "Critical").length,
    mockApis: devApiPreparationMocks.length,
  };
}
