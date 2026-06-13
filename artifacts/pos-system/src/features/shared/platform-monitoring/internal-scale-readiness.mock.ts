export type ScaleTier = "10 users" | "100 users" | "1M users";
export type ScaleStatus = "Ready" | "Watch" | "Gap" | "Blocked";
export type Priority = "P0" | "P1" | "P2";

export type ScaleReadinessItem = {
  id: string;
  tier: ScaleTier;
  area: string;
  currentNeed: string;
  dashboardSignal: string;
  missingFeature: string;
  nextUpgrade: string;
  status: ScaleStatus;
};

export type GoldenSignalItem = {
  id: string;
  signal: "Latency" | "Traffic" | "Errors" | "Saturation";
  tenUsers: string;
  hundredUsers: string;
  millionUsers: string;
  futureEndpoint: string;
  status: ScaleStatus;
};

export type CapacityItem = {
  id: string;
  component: string;
  tenUsers: string;
  hundredUsers: string;
  millionUsers: string;
  risk: string;
  action: string;
};

export type MissingFeatureItem = {
  id: string;
  feature: string;
  whyNeeded: string;
  priority: Priority;
  mockOnlyNow: string;
  futureApiContract: string;
};

export type ScaleApiContract = {
  id: string;
  method: "GET" | "POST";
  endpoint: string;
  purpose: string;
  request: string;
  response: string;
  auth: string;
  readiness: "Draft" | "Mock Ready" | "Needs Backend" | "Blocked";
};

export type ScaleSchemaCandidate = {
  id: string;
  model: string;
  purpose: string;
  fields: string;
  promoteWhen: string;
  risk: "Low" | "Medium" | "High";
};

export const scaleReadinessItems: ScaleReadinessItem[] = [
  { id: "scale-10-runtime", tier: "10 users", area: "Runtime Health", currentNeed: "Manual checks, build pass, route works, no blocking UI errors.", dashboardSignal: "Route wired, mock fallback active, release gates visible.", missingFeature: "None urgent. Keep it simple.", nextUpgrade: "Add one-click smoke checklist later.", status: "Ready" },
  { id: "scale-10-data", tier: "10 users", area: "Data Safety", currentNeed: "Avoid schema drift and accidental destructive mutation.", dashboardSignal: "Schema decision records and git diff gate.", missingFeature: "Backup visibility is still only planned.", nextUpgrade: "Add backup freshness mock panel.", status: "Watch" },
  { id: "scale-100-api", tier: "100 users", area: "API Reliability", currentNeed: "Read-only health endpoints, error rate visibility, slow request visibility.", dashboardSignal: "API rollout and contract matrix exist.", missingFeature: "No request latency percentile board yet.", nextUpgrade: "Add golden signals board with p95/p99 placeholders.", status: "Gap" },
  { id: "scale-100-ops", tier: "100 users", area: "Operational Support", currentNeed: "Incident owner, impact, action queue, low-noise alerts.", dashboardSignal: "Incident mock and dev action queue exist.", missingFeature: "No escalation matrix yet.", nextUpgrade: "Add escalation and alert policy mock.", status: "Gap" },
  { id: "scale-1m-o11y", tier: "1M users", area: "Observability", currentNeed: "Metrics, logs, traces, SLO, sampling, alert routing, and capacity forecast.", dashboardSignal: "Contract readiness exists, but no telemetry coverage board yet.", missingFeature: "No telemetry coverage, SLO budget, or capacity forecast dashboard.", nextUpgrade: "Add scale readiness panels before real API.", status: "Blocked" },
  { id: "scale-1m-security", tier: "1M users", area: "Security and Abuse Guard", currentNeed: "Rate limits, audit retention, suspicious access, permission drift, tenant isolation.", dashboardSignal: "Audit and permission planning exists in shared dashboards.", missingFeature: "No rate limit or tenant isolation monitor yet.", nextUpgrade: "Add security guardrail board as mock.", status: "Blocked" }
];

export const goldenSignals: GoldenSignalItem[] = [
  { id: "golden-latency", signal: "Latency", tenUsers: "Manual UX check.", hundredUsers: "Track p95 route/API latency.", millionUsers: "Track p50/p95/p99 by endpoint, tenant, region, and dependency.", futureEndpoint: "GET /api/internal/scale/golden-signals", status: "Gap" },
  { id: "golden-traffic", signal: "Traffic", tenUsers: "Daily active user count and route hits.", hundredUsers: "Requests per minute by dashboard/API.", millionUsers: "RPS, concurrent sessions, queue depth, cache hit rate, anomaly detection.", futureEndpoint: "GET /api/internal/traffic/summary", status: "Gap" },
  { id: "golden-errors", signal: "Errors", tenUsers: "Visible UI error list.", hundredUsers: "4xx/5xx split and failed action count.", millionUsers: "Error budget burn, dependency errors, retry storm, partial failure detection.", futureEndpoint: "GET /api/internal/errors/summary", status: "Gap" },
  { id: "golden-saturation", signal: "Saturation", tenUsers: "Storage and build size warning.", hundredUsers: "DB pool, CPU/memory, slow query count.", millionUsers: "Capacity forecast, autoscale headroom, queue lag, DB pressure.", futureEndpoint: "GET /api/internal/capacity/saturation", status: "Blocked" }
];

export const capacityPlan: CapacityItem[] = [
  { id: "capacity-app", component: "App Runtime", tenUsers: "Single deployment, manual monitoring.", hundredUsers: "Basic metrics, uptime checks, rollback plan.", millionUsers: "Multi-region or edge strategy, autoscaling, CDN, canary deploy.", risk: "Cold start and slow route rendering under peak traffic.", action: "Prepare route timing and build size panels." },
  { id: "capacity-db", component: "Database", tenUsers: "Local/dev DB is fine for demo.", hundredUsers: "Managed Postgres, indexes, connection pooling.", millionUsers: "Read replicas, query budget, backup/restore drill, partition strategy.", risk: "DB pool exhaustion and unindexed dashboard queries.", action: "Add DB readiness and query budget mock." },
  { id: "capacity-api", component: "API Layer", tenUsers: "Few read endpoints can be manual.", hundredUsers: "Read-only health endpoints and error envelope standard.", millionUsers: "Rate limit, caching, idempotency, async jobs, circuit breakers.", risk: "One slow dependency can drag the whole dashboard.", action: "Add API dependency map and timeout policy." },
  { id: "capacity-ops", component: "Operations", tenUsers: "Owner checks issues manually.", hundredUsers: "Incident owner, priority, action queue.", millionUsers: "On-call, escalation, postmortem, status page, SLO review.", risk: "Alert noise and no clear owner during incidents.", action: "Add escalation and SLO budget mock." }
];

export const missingMonitorFeatures: MissingFeatureItem[] = [
  { id: "missing-slo", feature: "SLO and Error Budget Board", whyNeeded: "At 100+ users, uptime and error budget matter more than decorative status badges.", priority: "P1", mockOnlyNow: "Show target availability, burn rate, and action threshold.", futureApiContract: "GET /api/internal/slo/summary" },
  { id: "missing-telemetry", feature: "Telemetry Coverage Map", whyNeeded: "At 1M users, metrics without logs/traces make debugging feel like reading smoke signals.", priority: "P0", mockOnlyNow: "Show metrics, logs, traces, RUM, and synthetic check coverage.", futureApiContract: "GET /api/internal/telemetry/coverage" },
  { id: "missing-capacity", feature: "Capacity Forecast Board", whyNeeded: "Scaling needs headroom visibility before users discover your app has knees.", priority: "P0", mockOnlyNow: "Show app, DB, API, storage, and queue headroom by tier.", futureApiContract: "GET /api/internal/capacity/forecast" },
  { id: "missing-security", feature: "Security Guardrail Monitor", whyNeeded: "More users means more weird traffic, permission mistakes, and login anomalies.", priority: "P1", mockOnlyNow: "Show rate limit plan, tenant isolation checks, suspicious access, audit retention.", futureApiContract: "GET /api/internal/security/guardrails" },
  { id: "missing-cost", feature: "Cost and Resource Budget Monitor", whyNeeded: "At scale, cost can become the outage. Cloud billing is basically a horror genre with invoices.", priority: "P2", mockOnlyNow: "Show projected monthly cost by scale tier and expensive subsystem.", futureApiContract: "GET /api/internal/cost/forecast" }
];

export const scaleApiContracts: ScaleApiContract[] = [
  { id: "api-scale-readiness", method: "GET", endpoint: "/api/internal/scale/readiness", purpose: "Return readiness by user tier, gap, and next upgrade.", request: "Query: tier?, area?, status?", response: "{ tiers[], gaps[], generatedAt }", auth: "settings.manage or future internal.monitor.read", readiness: "Mock Ready" },
  { id: "api-golden-signals", method: "GET", endpoint: "/api/internal/scale/golden-signals", purpose: "Return latency, traffic, errors, and saturation summary.", request: "Query: window=15m|1h|24h, mode?, tenantId?", response: "{ latency, traffic, errors, saturation, warnings[] }", auth: "settings.manage or future internal.monitor.read", readiness: "Draft" },
  { id: "api-telemetry-coverage", method: "GET", endpoint: "/api/internal/telemetry/coverage", purpose: "Return coverage map for metrics, logs, traces, RUM, and synthetic checks.", request: "Query: service?, mode?", response: "{ services[], coverageScore, missingSignals[] }", auth: "settings.manage or future internal.monitor.read", readiness: "Needs Backend" },
  { id: "api-capacity-forecast", method: "GET", endpoint: "/api/internal/capacity/forecast", purpose: "Return capacity forecast and headroom estimate by subsystem.", request: "Query: tier=10|100|1000000, horizon=7d|30d|90d", response: "{ forecast[], bottlenecks[], recommendedActions[] }", auth: "settings.manage or future internal.monitor.read", readiness: "Needs Backend" },
  { id: "api-scale-test-plan", method: "POST", endpoint: "/api/internal/scale/test-plan", purpose: "Future action for starting safe load-test planning. Blocked until safeguards exist.", request: "Body: { tier, scenario, maxRps, dryRunOnly }", response: "{ planId, status, dryRunReport }", auth: "SUPER_ADMIN only later. Never expose to normal owner role.", readiness: "Blocked" }
];

export const scaleSchemaCandidates: ScaleSchemaCandidate[] = [
  { id: "schema-scale-snapshot", model: "ScaleReadinessSnapshot", purpose: "Persist periodic tier readiness scores after real API exists.", fields: "id, tier, score, gapsJson, generatedAt, createdById?", promoteWhen: "Read-only scale readiness API is used for at least two dashboard releases.", risk: "Low" },
  { id: "schema-telemetry-coverage", model: "TelemetryCoverageSnapshot", purpose: "Track coverage of metrics, logs, traces, RUM, and synthetic checks.", fields: "id, service, signalType, coveragePercent, missingFieldsJson, capturedAt", promoteWhen: "At least three services report coverage from a real collector.", risk: "Medium" },
  { id: "schema-slo-budget", model: "ServiceLevelBudget", purpose: "Store SLO target, current burn, and review window for key services.", fields: "id, service, targetPercent, windowDays, burnRate, status, reviewedAt", promoteWhen: "SLO board becomes part of release gate.", risk: "Medium" },
  { id: "schema-security-event", model: "SecurityGuardrailEvent", purpose: "Persist suspicious access, rate-limit breaches, and tenant isolation warnings.", fields: "id, tenantId?, actorId?, eventType, severity, metadataJson, createdAt", promoteWhen: "Security guardrail API produces real events and needs retention.", risk: "High" }
];

export function getScaleReadinessSummary() {
  return {
    ready: scaleReadinessItems.filter((item) => item.status === "Ready").length,
    gaps: scaleReadinessItems.filter((item) => item.status === "Gap").length,
    blocked: scaleReadinessItems.filter((item) => item.status === "Blocked").length,
    p0Missing: missingMonitorFeatures.filter((item) => item.priority === "P0").length,
  };
}
