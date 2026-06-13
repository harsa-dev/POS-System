export type ProductionStatus = "Ready" | "Watch" | "Gap" | "Blocked" | "Draft";
export type ProductionPriority = "P0" | "P1" | "P2";
export type ProductionRisk = "Low" | "Medium" | "High";

export type SloBudgetItem = {
  id: string;
  service: string;
  sli: string;
  target: string;
  currentMock: string;
  burnRate: string;
  owner: string;
  action: string;
  status: ProductionStatus;
};

export type TelemetryPipelineItem = {
  id: string;
  signal: string;
  currentCoverage: string;
  missing: string;
  futureCollector: string;
  storagePlan: string;
  status: ProductionStatus;
};

export type GuardrailItem = {
  id: string;
  area: string;
  currentControl: string;
  scaleRisk: string;
  futurePolicy: string;
  priority: ProductionPriority;
  status: ProductionStatus;
};

export type TenantIsolationItem = {
  id: string;
  layer: string;
  currentState: string;
  failureMode: string;
  requiredCheck: string;
  futureApi: string;
  risk: ProductionRisk;
};

export type CostBudgetItem = {
  id: string;
  resource: string;
  tenUsers: string;
  hundredUsers: string;
  millionUsers: string;
  costSignal: string;
  action: string;
};

export type LoadTestScenario = {
  id: string;
  scenario: string;
  targetTier: string;
  trafficShape: string;
  passCriteria: string;
  blockedBy: string;
  status: ProductionStatus;
};

export type IncidentRunbookItem = {
  id: string;
  trigger: string;
  firstCheck: string;
  ownerAction: string;
  escalation: string;
  dashboardLink: string;
};

export const sloBudgetItems: SloBudgetItem[] = [
  { id: "slo-auth", service: "Auth Session", sli: "Successful login/session validation", target: "99.5%", currentMock: "99.2%", burnRate: "1.4x", owner: "Core/Auth", action: "Add session error split and expired token counter.", status: "Watch" },
  { id: "slo-orders", service: "Order Flow", sli: "Order create to paid transition", target: "99.0%", currentMock: "98.6%", burnRate: "1.8x", owner: "F&B Core", action: "Track failed transition reason before adding retry logic.", status: "Gap" },
  { id: "slo-dashboard", service: "Shared Dashboards", sli: "Dashboard route render success", target: "99.9%", currentMock: "99.9%", burnRate: "0.2x", owner: "Shared UI", action: "Keep smoke test coverage on each new route.", status: "Ready" },
  { id: "slo-internal", service: "Internal Monitor", sli: "Monitoring data freshness", target: "95.0%", currentMock: "Mock only", burnRate: "n/a", owner: "Platform", action: "Promote read-only health endpoint first.", status: "Draft" },
];

export const telemetryPipelineItems: TelemetryPipelineItem[] = [
  { id: "tel-metrics", signal: "Metrics", currentCoverage: "Mock cards and tables", missing: "No real runtime sampler", futureCollector: "OpenTelemetry metrics SDK", storagePlan: "Time-series table or external metrics backend", status: "Gap" },
  { id: "tel-logs", signal: "Logs", currentCoverage: "Manual audit/dashboard notes", missing: "Structured server logs", futureCollector: "Request logger middleware", storagePlan: "Log stream with correlation id", status: "Gap" },
  { id: "tel-traces", signal: "Traces", currentCoverage: "None", missing: "Request span across API/db", futureCollector: "OpenTelemetry trace exporter", storagePlan: "Trace backend later, not Prisma first", status: "Blocked" },
  { id: "tel-profile", signal: "Profiles", currentCoverage: "None", missing: "CPU/memory profile on heavy route", futureCollector: "Runtime profiler in staging only", storagePlan: "Artifact snapshots, not database rows", status: "Draft" },
];

export const guardrailItems: GuardrailItem[] = [
  { id: "guard-rate", area: "Rate Limit", currentControl: "None on internal mock routes", scaleRisk: "One bad client can flood internal API", futurePolicy: "Role + per-user + per-tenant limits", priority: "P0", status: "Gap" },
  { id: "guard-rbac", area: "Permission Guard", currentControl: "settings.manage in sidebar", scaleRisk: "Internal pages visible to wrong role if route guard is weak", futurePolicy: "SERVER verified super-admin permission", priority: "P0", status: "Watch" },
  { id: "guard-audit", area: "Audit Write", currentControl: "Read-only dashboard only", scaleRisk: "Ack/mutation without audit trail", futurePolicy: "Every internal mutation writes actor/action/scope", priority: "P0", status: "Ready" },
  { id: "guard-secrets", area: "Secret Exposure", currentControl: "No real env rendered", scaleRisk: "Debug panel leaks config", futurePolicy: "Never show token/env value, only presence/status", priority: "P1", status: "Ready" },
];

export const tenantIsolationItems: TenantIsolationItem[] = [
  { id: "tenant-route", layer: "Route Guard", currentState: "Business mode guard exists", failureMode: "Wrong mode sees dashboard entry", requiredCheck: "Route inventory by mode and role", futureApi: "GET /api/internal/routes/inventory", risk: "Medium" },
  { id: "tenant-db", layer: "Database Query", currentState: "Existing restaurant scoping varies by module", failureMode: "Cross-tenant data leak", requiredCheck: "All queries require restaurantId/tenantId scope", futureApi: "GET /api/internal/data-integrity/checks", risk: "High" },
  { id: "tenant-cache", layer: "Cache / localStorage", currentState: "Mode saved in localStorage", failureMode: "Stale mode after logout/login", requiredCheck: "Clear mode on auth boundary", futureApi: "GET /api/internal/session/scope-check", risk: "Medium" },
  { id: "tenant-report", layer: "Reports", currentState: "Shared dashboard uses dummy data", failureMode: "Future real reports aggregate tenants", requiredCheck: "Report query contract must include tenant filter", futureApi: "GET /api/internal/contracts/readiness", risk: "High" },
];

export const costBudgetItems: CostBudgetItem[] = [
  { id: "cost-app", resource: "App Runtime", tenUsers: "Local/Vercel preview is enough", hundredUsers: "Watch cold start and bundle size", millionUsers: "Autoscale + CDN + queue required", costSignal: "Request/min + p95 render", action: "Add runtime usage endpoint later." },
  { id: "cost-db", resource: "Database", tenUsers: "Single Postgres fine", hundredUsers: "Connection limit becomes visible", millionUsers: "Pooling, read replicas, partitioning review", costSignal: "Connections + slow queries", action: "Add DB health/read-only stats later." },
  { id: "cost-storage", resource: "Storage", tenUsers: "Receipts/logos negligible", hundredUsers: "Invoice/assets need quota", millionUsers: "Object storage lifecycle and CDN", costSignal: "GB used + egress", action: "Track storage budget by tenant." },
  { id: "cost-observability", resource: "Observability", tenUsers: "Manual logs okay", hundredUsers: "Basic metric sampling", millionUsers: "Sampling policy required or cost explodes", costSignal: "Events/sec + retention", action: "Define telemetry retention plan." },
];

export const loadTestScenarios: LoadTestScenario[] = [
  { id: "load-smoke", scenario: "Route Smoke Test", targetTier: "10 users", trafficShape: "Manual navigation + refresh", passCriteria: "No 404, no blank page, no schema diff", blockedBy: "None", status: "Ready" },
  { id: "load-checkout", scenario: "Checkout Burst", targetTier: "100 users", trafficShape: "50 order creates in 5 minutes", passCriteria: "p95 below 800ms and no failed transition", blockedBy: "Need read-only metrics endpoint first", status: "Draft" },
  { id: "load-dashboard", scenario: "Dashboard Fanout", targetTier: "100 users", trafficShape: "100 dashboard opens per minute", passCriteria: "No API thundering herd", blockedBy: "Need caching and request dedupe plan", status: "Gap" },
  { id: "load-million", scenario: "Million User Simulation", targetTier: "1M users", trafficShape: "Synthetic staged load only", passCriteria: "SLO/error budget tracked before/after test", blockedBy: "Need telemetry, queue, rate limit, and safe staging", status: "Blocked" },
];

export const incidentRunbookItems: IncidentRunbookItem[] = [
  { id: "runbook-latency", trigger: "p95 latency above threshold", firstCheck: "Check Golden Signals Board and DB slow query candidate", ownerAction: "Freeze new dashboard features and inspect latest route change", escalation: "Platform owner + module owner", dashboardLink: "/dashboard/internal-monitoring#golden-signals" },
  { id: "runbook-error", trigger: "Error rate spike", firstCheck: "Split auth/order/payment/dashboard errors", ownerAction: "Disable unsafe mutation path, keep read-only pages alive", escalation: "Core owner", dashboardLink: "/dashboard/internal-monitoring#slo-budget" },
  { id: "runbook-tenant", trigger: "Possible cross-tenant data exposure", firstCheck: "Check tenant isolation matrix and latest report query", ownerAction: "Block affected report/API, audit access scope", escalation: "Owner only", dashboardLink: "/dashboard/internal-monitoring#tenant-isolation" },
  { id: "runbook-cost", trigger: "Cost budget spike", firstCheck: "Check resource usage and telemetry sampling", ownerAction: "Reduce retention/sampling before scaling infra", escalation: "Owner + platform", dashboardLink: "/dashboard/internal-monitoring#cost-budget" },
];

export function getProductionReadinessSummary() {
  return {
    sloWatch: sloBudgetItems.filter((item) => item.status === "Watch" || item.status === "Gap").length,
    blockedTelemetry: telemetryPipelineItems.filter((item) => item.status === "Blocked").length,
    p0Guardrails: guardrailItems.filter((item) => item.priority === "P0").length,
    highTenantRisk: tenantIsolationItems.filter((item) => item.risk === "High").length,
  };
}
