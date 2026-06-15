import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

import type {
  InternalMonitoringApiImplementationStepDto,
  InternalMonitoringApiMetaDto,
  InternalMonitoringControlRoomDto,
  InternalMonitoringDataIntegrityCheckDto,
  InternalMonitoringMutationReadinessContractDto,
  InternalMonitoringRouteInventoryItemDto,
} from "./internal-monitoring.dto";

export type {
  InternalMonitoringApiImplementationStepDto,
  InternalMonitoringApiMetaDto,
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

type ApiDataEnvelope<T> = ApiEnvelope<T> & {
  data: T;
  meta?: InternalMonitoringApiMetaDto;
};

export const internalMonitoringApi = {
  getControlRoom() {
    return apiClient.get<ApiDataEnvelope<InternalMonitoringControlRoomDto>>(
      "/api/internal/health/summary",
    );
  },

  getRouteInventory() {
    return apiClient.get<ApiDataEnvelope<InternalMonitoringRouteInventoryItemDto[]>>(
      "/api/internal/routes/inventory",
    );
  },

  getContractReadiness() {
    return apiClient.get<ApiDataEnvelope<InternalMonitoringApiImplementationStepDto[]>>(
      "/api/internal/contracts/readiness",
    );
  },

  getDataIntegrityChecks() {
    return apiClient.get<ApiDataEnvelope<InternalMonitoringDataIntegrityCheckDto[]>>(
      "/api/internal/data-integrity/checks",
    );
  },

  getMutationReadinessContracts() {
    return apiClient.get<ApiDataEnvelope<InternalMonitoringMutationReadinessContractDto[]>>(
      "/api/internal/mutation-readiness/contracts",
    );
  },
};
