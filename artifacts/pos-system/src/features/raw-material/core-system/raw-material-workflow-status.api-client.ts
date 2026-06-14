import { apiClient, getApiErrorMessage, type ApiEnvelope } from "@/lib/api/api-client";

export type RawMaterialBatchQualityStatusWrite = "ACCEPTED" | "INSPECTION" | "REJECTED";
export type RawMaterialProcessingStatusWrite = "PLANNED" | "RUNNING" | "COMPLETED";
export type RawMaterialPenHealthStatusWrite = "STABLE" | "MONITORING" | "CRITICAL";

type RawMaterialWorkflowStatusRequestBody = {
  status?: string;
  healthStatus?: RawMaterialPenHealthStatusWrite;
};

async function requestRawMaterialWorkflowStatus(path: string, body: RawMaterialWorkflowStatusRequestBody) {
  const payload = await apiClient.post<ApiEnvelope<unknown>>(path, { json: body });

  if (!payload.success) {
    throw new Error(`Raw Material workflow status API returned an unsuccessful response for ${path}.`);
  }

  return payload.data ?? null;
}

export function getRawMaterialWorkflowStatusErrorMessage(error: unknown) {
  return getApiErrorMessage(error, "Raw Material workflow status update failed. The workflow state was not changed.");
}

export function cancelRawMaterialIntake(id: string) {
  return requestRawMaterialWorkflowStatus(`/raw-material/status/intakes/${id}`, { status: "CANCELLED" });
}

export function setRawMaterialBatchQualityStatus(id: string, qualityStatus: RawMaterialBatchQualityStatusWrite) {
  return requestRawMaterialWorkflowStatus(`/raw-material/status/batches/${id}`, { status: qualityStatus });
}

export function quarantineRawMaterialBatch(id: string) {
  return requestRawMaterialWorkflowStatus(`/raw-material/status/batches/${id}`, { status: "QUARANTINED" });
}

export function setRawMaterialProcessingStatus(id: string, status: RawMaterialProcessingStatusWrite) {
  return requestRawMaterialWorkflowStatus(`/raw-material/status/processing-runs/${id}`, { status });
}

export function cancelRawMaterialProcessingRun(id: string) {
  return requestRawMaterialWorkflowStatus(`/raw-material/status/processing-runs/${id}`, { status: "CANCELLED" });
}

export function setRawMaterialPenHealthStatus(id: string, healthStatus: RawMaterialPenHealthStatusWrite) {
  return requestRawMaterialWorkflowStatus(`/raw-material/status/pens/${id}`, { healthStatus });
}

export const rawMaterialWorkflowStatusApiClient = {
  cancelIntake: cancelRawMaterialIntake,
  setBatchQualityStatus: setRawMaterialBatchQualityStatus,
  quarantineBatch: quarantineRawMaterialBatch,
  setProcessingStatus: setRawMaterialProcessingStatus,
  cancelProcessingRun: cancelRawMaterialProcessingRun,
  setPenHealthStatus: setRawMaterialPenHealthStatus,
};
