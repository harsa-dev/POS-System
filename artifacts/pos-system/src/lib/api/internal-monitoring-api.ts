import { apiClient } from "@/lib/api/api-client";

import type {
  InternalMonitoringApiEnvelopeDto,
  InternalMonitoringApiImplementationStepDto,
  InternalMonitoringControlRoomDto,
  InternalMonitoringDataIntegrityCheckDto,
  InternalMonitoringMutationReadinessContractDto,
  InternalMonitoringRouteInventoryItemDto,
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
  InternalMonitoringSchemaDecisionRecordDto,
  InternalMonitoringSource,
  InternalMonitoringTone,
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
};
