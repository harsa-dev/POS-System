import { apiClient } from "@/lib/api/api-client";

import type {
  InternalMonitoringApiEnvelopeDto,
  InternalMonitoringApiImplementationStepDto,
  InternalMonitoringControlRoomDto,
  InternalMonitoringDataIntegrityCheckDto,
  InternalMonitoringMutationReadinessContractDto,
  InternalMonitoringRouteInventoryItemDto,
  InternalSystemProbeHistoryDto,
} from "./internal-monitoring.dto";

export type {
  InternalMonitoringApiEnvelopeDto,
  InternalMonitoringApiErrorEnvelopeDto,
  InternalMonitoringApiImplementationStepDto,
  InternalMonitoringApiMetaDto,
  InternalMonitoringApiSuccessEnvelopeDto,
  InternalMonitoringControlRoomCardDto,
  InternalMonitoringControlRoomDto,
  InternalMonitoringControlRoomSignalDto,
  InternalMonitoringControlRoomSummaryDto,
  InternalMonitoringDataIntegrityCheckDto,
  InternalMonitoringDevActionItemDto,
  InternalMonitoringMutationReadinessContractDto,
  InternalMonitoringMutationReadinessStatus,
  InternalMonitoringRouteInventoryItemDto,
  InternalMonitoringRuntimeProbeDto,
  InternalMonitoringSchemaDecisionRecordDto,
  InternalMonitoringSource,
  InternalMonitoringTone,
  InternalSystemProbeHistoryDto,
  InternalSystemProbeHistoryItemDto,
  InternalSystemProbeHistorySummaryDto,
  InternalSystemProbeStatus,
} from "./internal-monitoring.dto";

export const internalMonitoringApi = {
  getControlRoom() {
    return apiClient.get<InternalMonitoringApiEnvelopeDto<InternalMonitoringControlRoomDto>>(
      "/api/internal/health/summary",
    );
  },

  getRouteInventory() {
    return apiClient.get<InternalMonitoringApiEnvelopeDto<InternalMonitoringRouteInventoryItemDto[]>>(
      "/api/internal/routes/inventory",
    );
  },

  getContractReadiness() {
    return apiClient.get<InternalMonitoringApiEnvelopeDto<InternalMonitoringApiImplementationStepDto[]>>(
      "/api/internal/contracts/readiness",
    );
  },

  getDataIntegrityChecks() {
    return apiClient.get<InternalMonitoringApiEnvelopeDto<InternalMonitoringDataIntegrityCheckDto[]>>(
      "/api/internal/data-integrity/checks",
    );
  },

  getMutationReadinessContracts() {
    return apiClient.get<InternalMonitoringApiEnvelopeDto<InternalMonitoringMutationReadinessContractDto[]>>(
      "/api/internal/mutation-readiness/contracts",
    );
  },

  getProbeHistory(params: {
    probeId?: string;
    status?: "pass" | "watch" | "fail";
    area?: string;
    from?: string;
    to?: string;
    limit?: number;
  } = {}) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && `${value}`.length > 0) {
        searchParams.set(key, `${value}`);
      }
    });

    const query = searchParams.toString();

    return apiClient.get<InternalMonitoringApiEnvelopeDto<InternalSystemProbeHistoryDto>>(
      `/api/internal/probes/history${query ? `?${query}` : ""}`,
    );
  },
};
