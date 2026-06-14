import {
  internalMonitoringApi,
  type InternalMonitoringControlRoomDto,
  type InternalMonitoringSource,
} from "@/lib/api/internal-monitoring-api";

import {
  apiImplementationSteps,
  controlRoomCards,
  controlRoomSignals,
  devActionItems,
  getControlRoomSummary,
  schemaDecisionRecords,
} from "./internal-monitoring-control-room.mock";

export type InternalMonitoringDataSourceResult = InternalMonitoringControlRoomDto & {
  source: InternalMonitoringSource;
  fallbackReason: string | null;
};

export function getInternalMonitoringMockControlRoomData(
  source: InternalMonitoringSource = "mock",
  fallbackReason: string | null = null,
): InternalMonitoringDataSourceResult {
  return {
    source,
    generatedAt: new Date().toISOString(),
    summary: getControlRoomSummary(),
    cards: controlRoomCards,
    signals: controlRoomSignals,
    apiImplementationSteps,
    schemaDecisionRecords,
    devActionItems,
    fallbackReason,
  };
}

export async function loadInternalMonitoringControlRoomData(): Promise<InternalMonitoringDataSourceResult> {
  try {
    const response = await internalMonitoringApi.getControlRoom();

    return {
      ...response.data,
      source: response.meta?.source ?? response.data.source ?? "api",
      generatedAt: response.meta?.generatedAt ?? response.data.generatedAt,
      fallbackReason: null,
    };
  } catch (error) {
    return getInternalMonitoringMockControlRoomData(
      "fallback",
      error instanceof Error ? error.message : "Internal monitoring API is unavailable.",
    );
  }
}
