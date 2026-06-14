import { getApiErrorMessage } from "@/lib/api/api-client";

import { rawMaterialGeneratedApiData } from "./raw-material.generated-api-client";

export type RawMaterialBatchQualityStatusWrite = "ACCEPTED" | "INSPECTION" | "REJECTED";
export type RawMaterialProcessingStatusWrite = "PLANNED" | "RUNNING" | "COMPLETED";
export type RawMaterialPenHealthStatusWrite = "STABLE" | "MONITORING" | "CRITICAL";

type RawMaterialWorkflowStatusRequestBody = {
  status?: string;
  healthStatus?: RawMaterialPenHealthStatusWrite;
  note?: string;
};

async function requestRawMaterialWorkflowStatus(
  operationId: "rawMaterialSetIntakeStatus" | "rawMaterialSetBatchStatus" | "rawMaterialSetProcessingWorkflowStatus" | "rawMaterialSetPenWorkflowStatus",
  id: string,
  body: RawMaterialWorkflowStatusRequestBody,
) {
  return rawMaterialGeneratedApiData<unknown>(operationId, {
    pathParams: { id },
    json: body,
  });
}

export function getRawMaterialWorkflowStatusErrorMessage(error: unknown) {
  return getApiErrorMessage(error, "Raw Material workflow status update failed. The workflow state was not changed.");
}

export function cancelRawMaterialIntake(id: string) {
  return requestRawMaterialWorkflowStatus("rawMaterialSetIntakeStatus", id, { status: "CANCELLED" });
}

export function setRawMaterialBatchQualityStatus(id: string, qualityStatus: RawMaterialBatchQualityStatusWrite) {
  return requestRawMaterialWorkflowStatus("rawMaterialSetBatchStatus", id, { status: qualityStatus });
}

export function quarantineRawMaterialBatch(id: string) {
  return requestRawMaterialWorkflowStatus("rawMaterialSetBatchStatus", id, { status: "QUARANTINED" });
}

export function setRawMaterialProcessingStatus(id: string, status: RawMaterialProcessingStatusWrite) {
  return requestRawMaterialWorkflowStatus("rawMaterialSetProcessingWorkflowStatus", id, { status });
}

export function cancelRawMaterialProcessingRun(id: string, note?: string) {
  return requestRawMaterialWorkflowStatus("rawMaterialSetProcessingWorkflowStatus", id, {
    status: "CANCELLED",
    note,
  });
}

export function setRawMaterialPenHealthStatus(id: string, healthStatus: RawMaterialPenHealthStatusWrite) {
  return requestRawMaterialWorkflowStatus("rawMaterialSetPenWorkflowStatus", id, { healthStatus });
}

export const rawMaterialWorkflowStatusApiClient = {
  cancelIntake: cancelRawMaterialIntake,
  setBatchQualityStatus: setRawMaterialBatchQualityStatus,
  quarantineBatch: quarantineRawMaterialBatch,
  setProcessingStatus: setRawMaterialProcessingStatus,
  cancelProcessingRun: cancelRawMaterialProcessingRun,
  setPenHealthStatus: setRawMaterialPenHealthStatus,
};
