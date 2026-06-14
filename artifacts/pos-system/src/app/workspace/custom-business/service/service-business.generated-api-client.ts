import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

import {
  buildServiceBusinessApiPath,
  getServiceBusinessOpenApiOperation,
  SERVICE_BUSINESS_OPENAPI_OPERATIONS,
  type ServiceBusinessOpenApiOperationId,
} from "./service-business-api-operations";

export { SERVICE_BUSINESS_OPENAPI_OPERATIONS };
export type { ServiceBusinessOpenApiOperationId };

export type ServiceBusinessGeneratedEnvelope<TData> = ApiEnvelope<TData> & {
  data: TData;
};

type ServiceBusinessGeneratedApiPathParams = Record<
  string,
  string | number | boolean | null | undefined
>;

type ServiceBusinessGeneratedApiQueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export type ServiceBusinessGeneratedApiRequestOptions = {
  pathParams?: ServiceBusinessGeneratedApiPathParams;
  query?: ServiceBusinessGeneratedApiQueryParams;
  json?: unknown;
  signal?: AbortSignal;
};

export function getServiceBusinessGeneratedApiOperation(
  operationId: ServiceBusinessOpenApiOperationId,
) {
  return getServiceBusinessOpenApiOperation(operationId);
}

export function resolveServiceBusinessGeneratedApiPath(
  operationId: ServiceBusinessOpenApiOperationId,
  options?: Pick<ServiceBusinessGeneratedApiRequestOptions, "pathParams" | "query">,
) {
  return buildServiceBusinessApiPath(operationId, options);
}

export async function serviceBusinessGeneratedApiRequest<TResponse>(
  operationId: ServiceBusinessOpenApiOperationId,
  options: ServiceBusinessGeneratedApiRequestOptions = {},
) {
  const operation = getServiceBusinessGeneratedApiOperation(operationId);
  const endpoint = resolveServiceBusinessGeneratedApiPath(operationId, {
    pathParams: options.pathParams,
    query: options.query,
  });

  if (operation.method === "GET") {
    return apiClient.get<TResponse>(endpoint, { signal: options.signal });
  }

  if (operation.method === "PATCH") {
    return apiClient.patch<TResponse>(endpoint, {
      json: options.json,
      signal: options.signal,
    });
  }

  return apiClient.post<TResponse>(endpoint, {
    json: options.json,
    signal: options.signal,
  });
}

export async function serviceBusinessGeneratedApiData<TData>(
  operationId: ServiceBusinessOpenApiOperationId,
  options?: ServiceBusinessGeneratedApiRequestOptions,
) {
  const response = await serviceBusinessGeneratedApiRequest<
    ServiceBusinessGeneratedEnvelope<TData>
  >(operationId, options);

  if (response.data === undefined) {
    throw new Error(
      `Service Business API operation ${operationId} returned an empty data envelope.`,
    );
  }

  return response.data;
}
