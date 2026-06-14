import { apiClient, getApiErrorMessage, type ApiEnvelope } from "@/lib/api/api-client";

export type RawMaterialBatchQualityStatusWrite = "ACCEPTED" | "INSPECTION" | "REJECTED";
export type RawMaterialProcessingStatusWrite = "PLANNED" | "RUNNING" | "COMPLETED";
export type RawMaterialPenHealthStatusWrite = "STABLE" | "MONITORING" | "CRITICAL";

async function requestRawMaterialWorkflowStatus(path: string, method: "PATCH" | "POST" | "DELETE", body?: Record<string, unknown>) {
  const request = method === "PATCH"
    ? apiClient.patch<ApiEnvelope<unknown>>(path, body === undefined ? undefined : { json: body })
    : method === "POST"
      ? apiClient.post<ApiEnvelope<unknown>>(path, body === undefined ? undefined : { json: body })
      : apiClient.delete<ApiEnvelope<unknown>>(path);

  const payload = await request;

  if (!payload.success) {
    throw new Error(`Raw Material workflow status API returned an unsuccessful response for ${path}.`);
  }

  return payload.data ?? null;
}

export function getRawMaterialWorkflowStatusErrorMessage(error: unknown) {
  return getApiErrorMessage(error, "Raw Material workflow status update failed. The workflow state was not changed.");
}

export function cancelRawMaterialIntake(id: string) {
  return requestRawMaterialWorkflowStatus(`/raw-material/intakes/${id}`, "DELETE");
}

export function setRawMaterialBatchQualityStatus(id: string, qualityStatus: RawMaterialBatchQualityStatusWrite) {
  return requestRawMaterialWorkflowStatus(`/raw-material/batches/${id}`, "PATCH", { qualityStatus });
}

export function quarantineRawMaterialBatch(id: string) {
  return requestRawMaterialWorkflowStatus(`/raw-material/batches/${id}`, "DELETE");
}

export function setRawMaterialProcessingStatus(id: string, status: RawMaterialProcessingStatusWrite) {
  return requestRawMaterialWorkflowStatus(`/raw-material/processing-runs/${id}`, "PATCH", { status });
}

export function cancelRawMaterialProcessingRun(id: string) {
  return requestRawMaterialWorkflowStatus(`/raw-material/processing-runs/${id}/cancel`, "POST");
}

export function setRawMaterialPenHealthStatus(id: string, healthStatus: RawMaterialPenHealthStatusWrite) {
  return requestRawMaterialWorkflowStatus(`/raw-material/pens/${id}`, "PATCH", { healthStatus });
}

export const rawMaterialWorkflowStatusApiClient = {
  cancelIntake: cancelRawMaterialIntake,
  setBatchQualityStatus: setRawMaterialBatchQualityStatus,
  quarantineBatch: quarantineRawMaterialBatch,
  setProcessingStatus: setRawMaterialProcessingStatus,
  cancelProcessingRun: cancelRawMaterialProcessingRun,
  setPenHealthStatus: setRawMaterialPenHealthStatus,
};