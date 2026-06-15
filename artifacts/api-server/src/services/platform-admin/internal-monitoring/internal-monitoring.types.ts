export type InternalMonitoringSource = "api" | "mock" | "fallback";

export type InternalMonitoringTone = "blue" | "green" | "amber" | "rose" | "slate";

export type InternalMonitoringApiMetaDto = {
  generatedAt: string;
  source: InternalMonitoringSource;
  mock: boolean;
  mode: "read-only";
  capability: "platform-admin.internal-monitoring.read";
  readOnly: true;
  mutationMode?: "design-only" | "disabled";
};

export type InternalMonitoringApiSuccessEnvelopeDto<TData> = {
  success: true;
  data: TData;
  meta: InternalMonitoringApiMetaDto;
};

export type InternalMonitoringApiErrorEnvelopeDto = {
  success: false;
  message: string;
  code: string;
  details?: unknown;
  requestId?: string;
};

export type InternalMonitoringApiEnvelopeDto<TData> =
  | InternalMonitoringApiSuccessEnvelopeDto<TData>
  | InternalMonitoringApiErrorEnvelopeDto;

export type InternalMonitoringRuntimeProbeDto = {
  id: string;
  label: string;
  status: "pass" | "watch" | "fail";
  latencyMs: number | null;
  checkedAt: string;
  source: string;
  detail: string;
};

export type InternalMonitoringControlRoomCardDto = {
  id: string;
  label: string;
  value: string;
  note: string;
  tone: InternalMonitoringTone;
};

export type InternalMonitoringControlRoomSignalDto = {
  id: string;
  area: string;
  signal: string;
  source: string;
  state: "Healthy" | "Watch" | "Blocked";
  nextAction: string;
};

export type InternalMonitoringApiImplementationStepDto = {
  id: string;
  phase: string;
  endpoint: string;
  mockSource: string;
  contractStatus: "Draft" | "Ready" | "Blocked";
  implementationRule: string;
  testPlan: string;
};

export type InternalMonitoringSchemaDecisionRecordDto = {
  id: string;
  candidate: string;
  decision: "Hold" | "Prepare" | "Promote Later";
  reason: string;
  requiredProof: string;
};

export type InternalMonitoringDevActionItemDto = {
  id: string;
  priority: "P0" | "P1" | "P2";
  title: string;
  owner: string;
  status: "Todo" | "Doing" | "Waiting";
  doneWhen: string;
};

export type InternalMonitoringControlRoomSummaryDto = {
  totalSignals: number;
  blockedSignals: number;
  readyContracts: number;
  p0Actions: number;
  runtimeProbes: number;
  failingRuntimeProbes: number;
};

export type InternalMonitoringControlRoomDto = {
  source: InternalMonitoringSource;
  generatedAt: string;
  summary: InternalMonitoringControlRoomSummaryDto;
  cards: InternalMonitoringControlRoomCardDto[];
  runtimeProbes: InternalMonitoringRuntimeProbeDto[];
  signals: InternalMonitoringControlRoomSignalDto[];
  apiImplementationSteps: InternalMonitoringApiImplementationStepDto[];
  schemaDecisionRecords: InternalMonitoringSchemaDecisionRecordDto[];
  devActionItems: InternalMonitoringDevActionItemDto[];
};

export type InternalMonitoringRouteInventoryItemDto = {
  id: string;
  route: string;
  owner: string;
  guard: "auth" | "platform-admin" | "planned";
  status: "active" | "planned" | "blocked";
  notes: string;
};

export type InternalMonitoringDataIntegrityCheckDto = {
  id: string;
  check: string;
  status: "pass" | "watch" | "blocked";
  severity: "info" | "warning" | "critical";
  detail: string;
};

export type InternalMonitoringMutationReadinessStatus =
  | "Blocked"
  | "Design Ready"
  | "Dry-run Only";

export type InternalMonitoringMutationReadinessContractDto = {
  id: string;
  action: string;
  targetSurface: string;
  proposedEndpoint: string;
  proposedMethod: "POST" | "PATCH" | "DELETE";
  status: InternalMonitoringMutationReadinessStatus;
  dryRunMode: "Required" | "Not Ready";
  requiredCapability: string;
  requiredAuditEvent: string;
  requiredApproval: string;
  rollbackPlan: string;
  rateLimit: string;
  blockedReason: string;
  requiredProof: string[];
};

export type InternalSystemProbeStatus = "pass" | "watch" | "fail";

export type InternalSystemProbeHistoryItemDto = {
  id: string;
  probeId: string;
  label: string;
  area: string;
  status: InternalSystemProbeStatus;
  latencyMs: number | null;
  message: string;
  observedAt: string;
  source: string;
  metadataJson: unknown | null;
  createdAt: string;
};

export type InternalSystemProbeHistorySummaryDto = {
  total: number;
  pass: number;
  watch: number;
  fail: number;
  retentionDays: number;
  persistenceStatus: "ready" | "schema-missing" | "database-unavailable" | "not-configured";
  detail: string;
};

export type InternalSystemProbeHistoryDto = {
  generatedAt: string;
  items: InternalSystemProbeHistoryItemDto[];
  summary: InternalSystemProbeHistorySummaryDto;
  filters: {
    probeId?: string;
    status?: InternalSystemProbeStatus;
    area?: string;
    from?: string;
    to?: string;
    limit: number;
  };
};
