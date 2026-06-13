export type ControlRoomCard = {
  id: string;
  label: string;
  value: string;
  note: string;
  tone: "blue" | "green" | "amber" | "rose" | "slate";
};

export type ControlRoomSignal = {
  id: string;
  area: string;
  signal: string;
  source: string;
  state: "Healthy" | "Watch" | "Blocked";
  nextAction: string;
};

export type ApiImplementationStep = {
  id: string;
  phase: string;
  endpoint: string;
  mockSource: string;
  contractStatus: "Draft" | "Ready" | "Blocked";
  implementationRule: string;
  testPlan: string;
};

export type SchemaDecisionRecord = {
  id: string;
  candidate: string;
  decision: "Hold" | "Prepare" | "Promote Later";
  reason: string;
  requiredProof: string;
};

export type DevActionItem = {
  id: string;
  priority: "P0" | "P1" | "P2";
  title: string;
  owner: string;
  status: "Todo" | "Doing" | "Waiting";
  doneWhen: string;
};

export const controlRoomCards: ControlRoomCard[] = [
  { id: "mock", label: "Mock Coverage", value: "82%", note: "internal panels have typed demo data", tone: "blue" },
  { id: "api", label: "API Readiness", value: "54%", note: "GET contracts drafted, mutations locked", tone: "amber" },
  { id: "schema", label: "Schema Drift", value: "0", note: "Prisma schema must stay untouched", tone: "green" },
  { id: "release", label: "Release Gate", value: "Manual", note: "typecheck/build required after pull", tone: "slate" },
];

export const controlRoomSignals: ControlRoomSignal[] = [
  { id: "route", area: "Routing", signal: "Internal route constant exists", source: "constants/routes.ts", state: "Watch", nextAction: "Confirm App.tsx route registration and sidebar entry." },
  { id: "mock", area: "Mock Data", signal: "Monitoring panels use typed mock arrays", source: "platform-monitoring/*.mock.ts", state: "Healthy", nextAction: "Keep dummy data outside JSX." },
  { id: "api", area: "API Contract", signal: "Read-only endpoints are planned", source: "internal monitoring docs", state: "Watch", nextAction: "Promote GET endpoints before mutation endpoints." },
  { id: "schema", area: "Schema", signal: "No persistence change approved", source: "Prisma guard", state: "Blocked", nextAction: "Do not add models until API usage proves persistence need." },
];

export const apiImplementationSteps: ApiImplementationStep[] = [
  { id: "health", phase: "Phase 1", endpoint: "GET /api/internal/health/summary", mockSource: "dev-monitoring.mock.ts", contractStatus: "Ready", implementationRule: "Return read-only aggregate from runtime checks only.", testPlan: "Render dashboard with API fallback to mock if request fails." },
  { id: "contracts", phase: "Phase 1", endpoint: "GET /api/internal/contracts/readiness", mockSource: "dev-monitoring-contracts.mock.ts", contractStatus: "Ready", implementationRule: "Expose contract status, no write access.", testPlan: "Validate response envelope and table row count." },
  { id: "integrity", phase: "Phase 2", endpoint: "GET /api/internal/data-integrity/checks", mockSource: "dev-monitoring-contracts.mock.ts", contractStatus: "Draft", implementationRule: "Run cheap checks only; avoid slow DB scans.", testPlan: "Check schema drift, route coverage, and mock-to-contract mapping." },
  { id: "ack", phase: "Phase 3", endpoint: "PATCH /api/internal/alerts/:alertId/acknowledge", mockSource: "internal-monitoring-upgrade.mock.ts", contractStatus: "Blocked", implementationRule: "Requires permission guard and audit append before implementation.", testPlan: "Mutation blocked for non-owner and creates audit event for owner." },
];

export const schemaDecisionRecords: SchemaDecisionRecord[] = [
  { id: "probe", candidate: "InternalSystemProbe", decision: "Prepare", reason: "Useful if health checks need history.", requiredProof: "At least 2 releases need historical uptime trends." },
  { id: "alert", candidate: "InternalAlert", decision: "Hold", reason: "Alert acknowledgement is not implemented yet.", requiredProof: "Acknowledge flow has auth guard, audit trail, and UI confirmation." },
  { id: "feature", candidate: "FeatureFlagSnapshot", decision: "Promote Later", reason: "Feature flags can stay static until real rollout toggles exist.", requiredProof: "At least 3 flags are read from API and shown in dashboard." },
];

export const devActionItems: DevActionItem[] = [
  { id: "wire", priority: "P0", title: "Wire internal monitoring route in App.tsx", owner: "Dev", status: "Doing", doneWhen: "/dashboard/internal-monitoring renders page instead of 404." },
  { id: "sidebar", priority: "P1", title: "Expose Internal Monitor from sidebar registry", owner: "Dev", status: "Todo", doneWhen: "Sidebar shows Internal Monitor under Core Systems or Shared Business." },
  { id: "api", priority: "P1", title: "Create first read-only health endpoint", owner: "Backend", status: "Waiting", doneWhen: "Dashboard can consume GET health summary with mock fallback." },
  { id: "docs", priority: "P2", title: "Keep API contract doc synced", owner: "Docs", status: "Todo", doneWhen: "Docs match route, endpoint, and schema decisions." },
];

export function getControlRoomSummary() {
  return {
    totalSignals: controlRoomSignals.length,
    blockedSignals: controlRoomSignals.filter((item) => item.state === "Blocked").length,
    readyContracts: apiImplementationSteps.filter((item) => item.contractStatus === "Ready").length,
    p0Actions: devActionItems.filter((item) => item.priority === "P0").length,
  };
}
