import { apiClient, getApiErrorMessage, type ApiEnvelope } from "@/lib/api/api-client";

export type RawMaterialPreviewKind = "intake" | "batch" | "processing-run";

export type RawMaterialPreviewResult<TEstimates extends Record<string, unknown> = Record<string, unknown>> = Readonly<{
  kind: RawMaterialPreviewKind;
  canProceed: boolean;
  blockingIssues: string[];
  warnings: string[];
  estimates: TEstimates;
  previewedAt: string;
  source: "api-server-prisma-raw-material-preview";
}>;

export type RawMaterialIntakePreviewEstimates = Readonly<{
  materialName: string;
  supplierId: string;
  supplierName: string | null;
  targetStorageLocationId: string;
  targetStorageCode: string | null;
  targetStorageName: string | null;
  unit: string;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  acceptanceRate: number;
  storageUsedBefore: number | null;
  storageUsedAfterAcceptance: number | null;
  storageAvailableAfterAcceptance: number | null;
}>;

export type RawMaterialBatchPreviewEstimates = Readonly<{
  lotCode: string | null;
  intakeId: string;
  intakeReferenceNumber: string | null;
  materialName: string | null;
  unit: string | null;
  storageLocationId: string;
  storageCode: string | null;
  storageName: string | null;
  quantity: number;
  remainingQuantity: number;
  qualityStatus: string;
  existingBatchQuantity: number;
  nextIntakeBatchQuantity: number;
  acceptedQuantity: number | null;
  intakeRemainingAcceptedQuantity: number | null;
}>;

export type RawMaterialProcessingPreviewEstimates = Readonly<{
  inputBatchId: string;
  inputBatchLotCode: string | null;
  materialName: string | null;
  sourceStorageLocationId: string | null;
  sourceStorageCode: string | null;
  outputName: string;
  inputQuantity: number;
  outputQuantity: number;
  byproductQuantity: number;
  wasteQuantity: number;
  totalOutputQuantity: number;
  yieldPercent: number;
  lossQuantity: number;
  remainingBeforeProcessing: number | null;
  remainingAfterProcessing: number | null;
  storageUsedBeforeProcessing: number | null;
  storageUsedAfterProcessing: number | null;
  status: string;
}>;

async function postPreview<TData extends Record<string, unknown>>(
  path: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
) {
  const payload = await apiClient.post<ApiEnvelope<RawMaterialPreviewResult<TData>>>(path, {
    json: body,
    signal,
  });

  if (!payload.success || !payload.data) {
    throw new Error(`Raw Material preview API returned an empty response for ${path}.`);
  }

  return payload.data;
}

export function getRawMaterialPreviewErrorMessage(error: unknown) {
  return getApiErrorMessage(error, "Raw Material preview API is unavailable. Falling back to local preview.");
}

export function previewRawMaterialIntake(
  body: Record<string, unknown>,
  signal?: AbortSignal,
) {
  return postPreview<RawMaterialIntakePreviewEstimates>("/raw-material/previews/intake", body, signal);
}

export function previewRawMaterialBatch(
  body: Record<string, unknown>,
  signal?: AbortSignal,
) {
  return postPreview<RawMaterialBatchPreviewEstimates>("/raw-material/previews/batch", body, signal);
}

export function previewRawMaterialProcessingRun(
  body: Record<string, unknown>,
  signal?: AbortSignal,
) {
  return postPreview<RawMaterialProcessingPreviewEstimates>("/raw-material/previews/processing-run", body, signal);
}

export const rawMaterialPreviewApiClient = {
  previewIntake: previewRawMaterialIntake,
  previewBatch: previewRawMaterialBatch,
  previewProcessingRun: previewRawMaterialProcessingRun,
};