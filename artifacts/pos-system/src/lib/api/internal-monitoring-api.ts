import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

export type InternalMonitoringSource = "api" | "mock" | "fallback";

export type InternalMonitoringControlRoomCardDto = {
  id: string;
  label: string;
  value: string;
  note: string;
  tone: "blue" | "green" | "amber" | "rose" | "slate";
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
};

export type InternalMonitoringControlRoomDto = {
  source: InternalMonitoringSource;
  generatedAt: string;
  summary: InternalMonitoringControlRoomSummaryDto;
  cards: InternalMonitoringControlRoomCardDto[];
  signals: InternalMonitoringControlRoomSignalDto[];
  apiImplementationSteps: InternalMonitoringApiImplementationStepDto[];
  schemaDecisionRecords: InternalMonitoringSchemaDecisionRecordDto[];
  devActionItems: InternalMonitoringDevActionItemDto[];
};

type ApiDataEnvelope<T> = ApiEnvelope<T> & {
  data: T;
  meta?: {
    generatedAt?: string;
    source?: InternalMonitoringSource;
    mock?: boolean;
  };
};

export const internalMonitoringApi = {
  getControlRoom() {
    return apiClient.get<ApiDataEnvelope<InternalMonitoringControlRoomDto>>(
      "/api/internal/health/summary",
    );
  },
};
