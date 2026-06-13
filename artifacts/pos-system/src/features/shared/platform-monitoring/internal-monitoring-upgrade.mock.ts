export type InternalReadinessTone = "green" | "amber" | "rose" | "blue" | "slate";

export type ApiRolloutPlan = {
  id: string;
  endpoint: string;
  phase: "Mock" | "Read-only API" | "Persisted" | "Automated";
  currentState: string;
  nextStep: string;
  risk: "Low" | "Medium" | "High";
  owner: string;
};

export type ApiEnvelopeExample = {
  id: string;
  state: "Success" | "Error";
  title: string;
  sample: string;
  note: string;
};

export type SchemaPromotionBacklog = {
  id: string;
  model: string;
  promoteWhen: string;
  blockedBy: string;
  acceptance: string;
  risk: "Low" | "Medium" | "High";
};

export type AccessPolicyRule = {
  id: string;
  role: string;
  canView: string;
  canAct: string;
  blockedActions: string;
  reason: string;
};

export type ObservabilityTarget = {
  id: string;
  metric: string;
  source: string;
  threshold: string;
  futureEndpoint: string;
  action: string;
};

export type InternalRunbookStep = {
  id: string;
  step: string;
  trigger: string;
  action: string;
  owner: string;
  doneWhen: string;
};

export const apiRolloutPlans: ApiRolloutPlan[] = [
  {
    id: "rollout-health",
    endpoint: "/api/internal/health/summary",
    phase: "Mock",
    currentState: "Rendered from devServiceHealthMocks and contract mocks.",
    nextStep: "Create read-only route handler that returns the same envelope shape.",
    risk: "Low",
    owner: "Core Platform",
  },
  {
    id: "rollout-routes",
    endpoint: "/api/internal/routes/inventory",
    phase: "Mock",
    currentState: "Route inventory is manually maintained in mock data.",
    nextStep: "Generate route inventory from ROUTES constant and sidebar registry at runtime.",
    risk: "Medium",
    owner: "Frontend Architecture",
  },
  {
    id: "rollout-integrity",
    endpoint: "/api/internal/data-integrity/checks",
    phase: "Mock",
    currentState: "Manual checklist only. No server-side checker yet.",
    nextStep: "Add read-only checks for route constant, registry entry, and schema diff command output.",
    risk: "Medium",
    owner: "Quality Gate",
  },
  {
    id: "rollout-alerts",
    endpoint: "/api/internal/alerts/:alertId/acknowledge",
    phase: "Mock",
    currentState: "Action is intentionally blocked because audit/auth are not stable enough.",
    nextStep: "Keep disabled until audit log write path and permission guard exist.",
    risk: "High",
    owner: "Internal Ops",
  },
];

export const apiEnvelopeExamples: ApiEnvelopeExample[] = [
  {
    id: "envelope-success",
    state: "Success",
    title: "Read-only success response",
    sample: `{
  "success": true,
  "data": {
    "summary": { "status": "Warning", "critical": 1 },
    "generatedAt": "mock-iso-date"
  },
  "meta": { "mock": true, "source": "internal-monitoring" }
}`,
    note: "Use this shape for every GET endpoint before real persistence exists.",
  },
  {
    id: "envelope-error",
    state: "Error",
    title: "Permission or validation failure",
    sample: `{
  "success": false,
  "error": {
    "code": "INTERNAL_MONITOR_FORBIDDEN",
    "message": "You do not have access to internal monitoring."
  },
  "meta": { "mock": false }
}`,
    note: "Keep error codes stable so UI can map them without parsing human text.",
  },
];

export const schemaPromotionBacklog: SchemaPromotionBacklog[] = [
  {
    id: "promote-probe",
    model: "InternalSystemProbe",
    promoteWhen: "Health summary needs history, trends, or incident correlation.",
    blockedBy: "No read-only health handler yet.",
    acceptance: "GET health endpoint exists, build passes, and probe payload is validated.",
    risk: "Low",
  },
  {
    id: "promote-alert",
    model: "InternalAlert",
    promoteWhen: "Internal warnings need acknowledgement and ownership history.",
    blockedBy: "Audit log write path and permission guard must be stable first.",
    acceptance: "Acknowledge action writes audit event and cannot touch POS operational data.",
    risk: "Medium",
  },
  {
    id: "promote-feature-flag",
    model: "FeatureFlagSnapshot",
    promoteWhen: "Business modes need per-tenant feature rollout tracking.",
    blockedBy: "Tenant model and business mode registry are not final enough.",
    acceptance: "Feature flags have a clear owner, rollback strategy, and tenant boundary.",
    risk: "High",
  },
];

export const accessPolicyRules: AccessPolicyRule[] = [
  {
    id: "access-owner",
    role: "OWNER",
    canView: "Yes, for own tenant/project workspace.",
    canAct: "Read-only during UI phase.",
    blockedActions: "Alert acknowledgement, schema mutation, operational data mutation.",
    reason: "Owner needs visibility but not unsafe internal writes yet.",
  },
  {
    id: "access-manager",
    role: "MANAGER",
    canView: "Optional later, disabled by default.",
    canAct: "No.",
    blockedActions: "All internal actions.",
    reason: "Manager should not see dev-only controls unless explicitly allowed.",
  },
  {
    id: "access-super-admin",
    role: "SUPER_ADMIN future",
    canView: "Yes, across tenants when role exists.",
    canAct: "Later: acknowledge internal alerts only.",
    blockedActions: "Schema changes, data repair mutation, payment/order mutation.",
    reason: "Separate platform administration from restaurant operations.",
  },
];

export const observabilityTargets: ObservabilityTarget[] = [
  {
    id: "obs-route-wiring",
    metric: "Route Wiring Coverage",
    source: "ROUTES constant + App router + sidebar registry",
    threshold: "100% active internal routes must render without console crash.",
    futureEndpoint: "/api/internal/routes/inventory",
    action: "Mark route as Needs Wiring when constant exists but page is not mounted.",
  },
  {
    id: "obs-schema-drift",
    metric: "Schema Drift",
    source: "git diff -- prisma/schema.prisma",
    threshold: "0 Prisma diff during UI-only phases.",
    futureEndpoint: "/api/internal/data-integrity/checks",
    action: "Block merge if schema changed without schema promotion checklist.",
  },
  {
    id: "obs-contract-readiness",
    metric: "Contract Readiness",
    source: "internalApiContracts",
    threshold: "Every endpoint must define auth, request, response, and errors.",
    futureEndpoint: "/api/internal/contracts/readiness",
    action: "Keep endpoint in Draft until all fields are complete.",
  },
];

export const internalRunbookSteps: InternalRunbookStep[] = [
  {
    id: "runbook-route",
    step: "Route smoke test",
    trigger: "After adding a dashboard route or sidebar entry.",
    action: "Open direct URL, refresh page, then navigate from sidebar.",
    owner: "Frontend",
    doneWhen: "Route renders same page from direct URL and sidebar click.",
  },
  {
    id: "runbook-contract",
    step: "Contract freeze",
    trigger: "Before implementing the first real API handler.",
    action: "Lock request/response shape in docs and mock file first.",
    owner: "Backend Planning",
    doneWhen: "UI mock and docs use the same endpoint envelope.",
  },
  {
    id: "runbook-schema",
    step: "Schema promotion review",
    trigger: "When mock data needs persistence.",
    action: "Write model purpose, indexes, rollback notes, and migration risk before editing Prisma.",
    owner: "Backend",
    doneWhen: "Schema change has a real use case and rollback path.",
  },
];

export function getInternalUpgradeSummary() {
  return {
    rolloutItems: apiRolloutPlans.length,
    highRiskItems: apiRolloutPlans.filter((item) => item.risk === "High").length + schemaPromotionBacklog.filter((item) => item.risk === "High").length,
    schemaBacklog: schemaPromotionBacklog.length,
    accessRules: accessPolicyRules.length,
    observabilityTargets: observabilityTargets.length,
    runbookSteps: internalRunbookSteps.length,
  };
}
