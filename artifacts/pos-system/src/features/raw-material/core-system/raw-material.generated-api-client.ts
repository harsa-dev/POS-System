import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

export const RAW_MATERIAL_GENERATED_API_OPERATIONS = {
  rawMaterialGetSummary: { method: "GET", path: "/raw-material/summary" },
  rawMaterialListSuppliers: { method: "GET", path: "/raw-material/suppliers" },
  rawMaterialListStorageLocations: { method: "GET", path: "/raw-material/storage-locations" },
  rawMaterialListIntakes: { method: "GET", path: "/raw-material/intakes" },
  rawMaterialListWeighings: { method: "GET", path: "/raw-material/weighings" },
  rawMaterialListBatches: { method: "GET", path: "/raw-material/batches" },
  rawMaterialListProcessingRuns: { method: "GET", path: "/raw-material/processing-runs" },
  rawMaterialListPens: { method: "GET", path: "/raw-material/pens" },
  rawMaterialListStockMovements: { method: "GET", path: "/raw-material/stock-movements" },

  rawMaterialPreviewIntake: { method: "POST", path: "/raw-material/previews/intake" },
  rawMaterialPreviewBatch: { method: "POST", path: "/raw-material/previews/batch" },
  rawMaterialPreviewProcessingRun: { method: "POST", path: "/raw-material/previews/processing-run" },

  rawMaterialCreateIntake: { method: "POST", path: "/raw-material/intakes" },
  rawMaterialCancelIntake: { method: "DELETE", path: "/raw-material/intakes/{id}" },
  rawMaterialSetIntakeStatus: { method: "POST", path: "/raw-material/status/intakes/{id}" },
  rawMaterialCreateWeighing: { method: "POST", path: "/raw-material/weighings" },
  rawMaterialSetBatchQualityStatus: { method: "PATCH", path: "/raw-material/batches/{id}" },
  rawMaterialQuarantineBatch: { method: "DELETE", path: "/raw-material/batches/{id}" },
  rawMaterialSetBatchStatus: { method: "POST", path: "/raw-material/status/batches/{id}" },

  rawMaterialAdjustStock: { method: "POST", path: "/raw-material/stock-movements/adjust" },
  rawMaterialReverseStockAdjustment: { method: "POST", path: "/raw-material/stock-movements/{id}/reverse-adjustment" },
  rawMaterialTransferStock: { method: "POST", path: "/raw-material/stock-movements/transfer" },
  rawMaterialConsumeProcessingStock: { method: "POST", path: "/raw-material/stock-movements/consume-processing" },

  rawMaterialCreateProcessingRun: { method: "POST", path: "/raw-material/processing-runs" },
  rawMaterialSetProcessingStatus: { method: "PATCH", path: "/raw-material/processing-runs/{id}" },
  rawMaterialCancelProcessingRun: { method: "POST", path: "/raw-material/processing-runs/{id}/cancel" },
  rawMaterialSetProcessingWorkflowStatus: { method: "POST", path: "/raw-material/status/processing-runs/{id}" },
  rawMaterialSetPenHealthStatus: { method: "PATCH", path: "/raw-material/pens/{id}" },
  rawMaterialSetPenWorkflowStatus: { method: "POST", path: "/raw-material/status/pens/{id}" },
} as const satisfies Record<string, { method: "GET" | "POST" | "PATCH" | "DELETE"; path: string }>;

export type RawMaterialGeneratedApiOperationId = keyof typeof RAW_MATERIAL_GENERATED_API_OPERATIONS;

export type RawMaterialGeneratedApiRequestOptions = Readonly<{
  pathParams?: Record<string, string | number>;
  query?: Record<string, string | number | boolean | null | undefined>;
  json?: unknown;
  signal?: AbortSignal;
}>;

function buildRawMaterialGeneratedPath(
  pathTemplate: string,
  pathParams: RawMaterialGeneratedApiRequestOptions["pathParams"] = {},
) {
  return pathTemplate.replace(/\{([A-Za-z0-9_]+)\}/g, (_match, key: string) => {
    const value = pathParams[key];

    if (value === undefined || value === null || value === "") {
      throw new Error(`Missing Raw Material API path parameter: ${key}`);
    }

    return encodeURIComponent(String(value));
  });
}

function withQueryString(
  path: string,
  query: RawMaterialGeneratedApiRequestOptions["query"],
) {
  if (!query) return path;

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export function getRawMaterialGeneratedApiOperation(operationId: RawMaterialGeneratedApiOperationId) {
  return RAW_MATERIAL_GENERATED_API_OPERATIONS[operationId];
}

export function resolveRawMaterialGeneratedApiPath(
  operationId: RawMaterialGeneratedApiOperationId,
  options: Pick<RawMaterialGeneratedApiRequestOptions, "pathParams" | "query"> = {},
) {
  const operation = getRawMaterialGeneratedApiOperation(operationId);
  return withQueryString(buildRawMaterialGeneratedPath(operation.path, options.pathParams), options.query);
}

export async function rawMaterialGeneratedApiRequest<TResponse>(
  operationId: RawMaterialGeneratedApiOperationId,
  options: RawMaterialGeneratedApiRequestOptions = {},
) {
  const operation = getRawMaterialGeneratedApiOperation(operationId);
  const endpoint = resolveRawMaterialGeneratedApiPath(operationId, options);

  if (operation.method === "GET") {
    return apiClient.get<TResponse>(endpoint, { signal: options.signal });
  }

  if (operation.method === "PATCH") {
    return apiClient.patch<TResponse>(endpoint, { json: options.json, signal: options.signal });
  }

  if (operation.method === "DELETE") {
    return apiClient.delete<TResponse>(endpoint, { signal: options.signal });
  }

  return apiClient.post<TResponse>(endpoint, { json: options.json, signal: options.signal });
}

export async function rawMaterialGeneratedApiData<TData>(
  operationId: RawMaterialGeneratedApiOperationId,
  options: RawMaterialGeneratedApiRequestOptions = {},
) {
  const payload = await rawMaterialGeneratedApiRequest<ApiEnvelope<TData>>(operationId, options);

  if (!payload.success || payload.data === undefined || payload.data === null) {
    throw new Error(`Raw Material generated API returned an empty response for ${operationId}.`);
  }

  return payload.data;
}
