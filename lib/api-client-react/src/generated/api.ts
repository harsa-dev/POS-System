import { useMutation, useQuery } from "@tanstack/react-query";
import type { QueryFunction, QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";

import type {
  HealthStatus,
  RetailBarcodeLookupResponse,
  RetailCheckoutResponse,
  RetailDashboardResponse,
  RetailInventoryRisksResponse,
  RetailProductListResponse,
  RetailReceivingQueueResponse,
  RetailReceivingStatusUpdateInput,
  RetailReceivingStatusUpdateResponse,
  RetailReturnInput,
  RetailReturnResponse,
  RetailSaleCancellationInput,
  RetailSaleCancellationResponse,
  RetailSaleCheckoutInput,
  RetailSalePreviewInput,
  RetailSalePreviewResponse,
  RetailSharedDashboardId,
  RetailSharedDashboardResponse,
  RetailStockStatus,
} from "./api.schemas";

import { customFetch } from "../custom-fetch";
import type { ErrorType } from "../custom-fetch";

type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const getHealthCheckUrl = () => `/api/healthz`;

export const healthCheck = async (options?: RequestInit): Promise<HealthStatus> => {
  return customFetch<HealthStatus>(getHealthCheckUrl(), { ...options, method: "GET" });
};

export const getHealthCheckQueryKey = () => [`/api/healthz`] as const;

export const getHealthCheckQueryOptions = <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getHealthCheckQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof healthCheck>>> = ({ signal }) => healthCheck({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & { queryKey: QueryKey };
};

export function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getHealthCheckQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return { ...query, queryKey: queryOptions.queryKey };
}

export type RetailListProductsParams = {
  search?: string;
  category?: string;
  stockStatus?: RetailStockStatus;
};

function appendQuery(url: string, params?: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `${url}?${query}` : url;
}

export const getRetailGetDashboardUrl = () => `/api/retail/dashboard`;

export const retailGetDashboard = async (options?: RequestInit): Promise<RetailDashboardResponse> => {
  return customFetch<RetailDashboardResponse>(getRetailGetDashboardUrl(), { ...options, method: "GET" });
};

export const getRetailListProductsUrl = (params?: RetailListProductsParams) => appendQuery(`/api/retail/products`, params);

export const retailListProducts = async (params?: RetailListProductsParams, options?: RequestInit): Promise<RetailProductListResponse> => {
  return customFetch<RetailProductListResponse>(getRetailListProductsUrl(params), { ...options, method: "GET" });
};

export const getRetailListProductsQueryKey = (params?: RetailListProductsParams) => [`/api/retail/products`, params] as const;

export const getRetailListProductsQueryOptions = <TData = Awaited<ReturnType<typeof retailListProducts>>, TError = ErrorType<unknown>>(params?: RetailListProductsParams, options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof retailListProducts>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getRetailListProductsQueryKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof retailListProducts>>> = ({ signal }) => retailListProducts(params, { signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<Awaited<ReturnType<typeof retailListProducts>>, TError, TData> & { queryKey: QueryKey };
};

export function useRetailListProducts<TData = Awaited<ReturnType<typeof retailListProducts>>, TError = ErrorType<unknown>>(params?: RetailListProductsParams, options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof retailListProducts>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getRetailListProductsQueryOptions(params, options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const getRetailLookupBarcodeUrl = (code: string) => `/api/retail/barcode/${encodeURIComponent(code)}`;

export const retailLookupBarcode = async (code: string, options?: RequestInit): Promise<RetailBarcodeLookupResponse> => {
  return customFetch<RetailBarcodeLookupResponse>(getRetailLookupBarcodeUrl(code), { ...options, method: "GET" });
};

export const getRetailGetInventoryRisksUrl = () => `/api/retail/inventory/risks`;

export const retailGetInventoryRisks = async (options?: RequestInit): Promise<RetailInventoryRisksResponse> => {
  return customFetch<RetailInventoryRisksResponse>(getRetailGetInventoryRisksUrl(), { ...options, method: "GET" });
};

export const getRetailGetReceivingQueueUrl = () => `/api/retail/receiving`;

export const retailGetReceivingQueue = async (options?: RequestInit): Promise<RetailReceivingQueueResponse> => {
  return customFetch<RetailReceivingQueueResponse>(getRetailGetReceivingQueueUrl(), { ...options, method: "GET" });
};

export const getRetailUpdateReceivingStatusUrl = (id: string) => `/api/retail/receiving/${encodeURIComponent(id)}/status`;

export const retailUpdateReceivingStatus = async (
  id: string,
  retailReceivingStatusUpdateInput: RetailReceivingStatusUpdateInput,
  options?: RequestInit,
): Promise<RetailReceivingStatusUpdateResponse> => {
  return customFetch<RetailReceivingStatusUpdateResponse>(getRetailUpdateReceivingStatusUrl(id), {
    ...options,
    method: "PATCH",
    body: JSON.stringify(retailReceivingStatusUpdateInput),
  });
};

export const getRetailUpdateReceivingStatusMutationOptions = <TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<Awaited<ReturnType<typeof retailUpdateReceivingStatus>>, TError, { id: string; data: RetailReceivingStatusUpdateInput }, TContext>;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn = (props: { id: string; data: RetailReceivingStatusUpdateInput }) => retailUpdateReceivingStatus(props.id, props.data, requestOptions);
  return { mutationFn, ...mutationOptions } as UseMutationOptions<Awaited<ReturnType<typeof retailUpdateReceivingStatus>>, TError, { id: string; data: RetailReceivingStatusUpdateInput }, TContext>;
};

export function useRetailUpdateReceivingStatus<TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<Awaited<ReturnType<typeof retailUpdateReceivingStatus>>, TError, { id: string; data: RetailReceivingStatusUpdateInput }, TContext>;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<Awaited<ReturnType<typeof retailUpdateReceivingStatus>>, TError, { id: string; data: RetailReceivingStatusUpdateInput }, TContext> {
  const mutationOptions = getRetailUpdateReceivingStatusMutationOptions(options);
  return useMutation(mutationOptions);
}

export const getRetailGetSharedDashboardUrl = (dashboardId: RetailSharedDashboardId) => `/api/retail/shared-dashboard/${dashboardId}`;

export const retailGetSharedDashboard = async (dashboardId: RetailSharedDashboardId, options?: RequestInit): Promise<RetailSharedDashboardResponse> => {
  return customFetch<RetailSharedDashboardResponse>(getRetailGetSharedDashboardUrl(dashboardId), { ...options, method: "GET" });
};

export const getRetailGetSharedDashboardQueryKey = (dashboardId: RetailSharedDashboardId) => [`/api/retail/shared-dashboard`, dashboardId] as const;

export const getRetailGetSharedDashboardQueryOptions = <TData = Awaited<ReturnType<typeof retailGetSharedDashboard>>, TError = ErrorType<unknown>>(dashboardId: RetailSharedDashboardId, options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof retailGetSharedDashboard>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getRetailGetSharedDashboardQueryKey(dashboardId);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof retailGetSharedDashboard>>> = ({ signal }) => retailGetSharedDashboard(dashboardId, { signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<Awaited<ReturnType<typeof retailGetSharedDashboard>>, TError, TData> & { queryKey: QueryKey };
};

export function useRetailGetSharedDashboard<TData = Awaited<ReturnType<typeof retailGetSharedDashboard>>, TError = ErrorType<unknown>>(dashboardId: RetailSharedDashboardId, options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof retailGetSharedDashboard>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getRetailGetSharedDashboardQueryOptions(dashboardId, options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const getRetailPreviewSaleUrl = () => `/api/retail/sales/preview`;

export const retailPreviewSale = async (retailSalePreviewInput: RetailSalePreviewInput, options?: RequestInit): Promise<RetailSalePreviewResponse> => {
  return customFetch<RetailSalePreviewResponse>(getRetailPreviewSaleUrl(), {
    ...options,
    method: "POST",
    body: JSON.stringify(retailSalePreviewInput),
  });
};

export const getRetailCheckoutSaleUrl = () => `/api/retail/sales/checkout`;

export const retailCheckoutSale = async (retailSaleCheckoutInput: RetailSaleCheckoutInput, options?: RequestInit): Promise<RetailCheckoutResponse> => {
  return customFetch<RetailCheckoutResponse>(getRetailCheckoutSaleUrl(), {
    ...options,
    method: "POST",
    body: JSON.stringify(retailSaleCheckoutInput),
  });
};

export const getRetailCheckoutSaleMutationOptions = <TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<Awaited<ReturnType<typeof retailCheckoutSale>>, TError, { data: RetailSaleCheckoutInput }, TContext>;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn = (props: { data: RetailSaleCheckoutInput }) => retailCheckoutSale(props.data, requestOptions);
  return { mutationFn, ...mutationOptions } as UseMutationOptions<Awaited<ReturnType<typeof retailCheckoutSale>>, TError, { data: RetailSaleCheckoutInput }, TContext>;
};

export function useRetailCheckoutSale<TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<Awaited<ReturnType<typeof retailCheckoutSale>>, TError, { data: RetailSaleCheckoutInput }, TContext>;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<Awaited<ReturnType<typeof retailCheckoutSale>>, TError, { data: RetailSaleCheckoutInput }, TContext> {
  const mutationOptions = getRetailCheckoutSaleMutationOptions(options);
  return useMutation(mutationOptions);
}

export const getRetailPreviewReturnUrl = () => `/api/retail/returns/preview`;

export const retailPreviewReturn = async (
  retailReturnInput: RetailReturnInput,
  options?: RequestInit,
): Promise<RetailReturnResponse> => {
  return customFetch<RetailReturnResponse>(getRetailPreviewReturnUrl(), {
    ...options,
    method: "POST",
    body: JSON.stringify(retailReturnInput),
  });
};

export const getRetailPreviewReturnMutationOptions = <TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<Awaited<ReturnType<typeof retailPreviewReturn>>, TError, { data: RetailReturnInput }, TContext>;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn = (props: { data: RetailReturnInput }) => retailPreviewReturn(props.data, requestOptions);
  return { mutationFn, ...mutationOptions } as UseMutationOptions<Awaited<ReturnType<typeof retailPreviewReturn>>, TError, { data: RetailReturnInput }, TContext>;
};

export function useRetailPreviewReturn<TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<Awaited<ReturnType<typeof retailPreviewReturn>>, TError, { data: RetailReturnInput }, TContext>;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<Awaited<ReturnType<typeof retailPreviewReturn>>, TError, { data: RetailReturnInput }, TContext> {
  const mutationOptions = getRetailPreviewReturnMutationOptions(options);
  return useMutation(mutationOptions);
}

export const getRetailPersistReturnUrl = () => `/api/retail/returns`;

export const retailPersistReturn = async (
  retailReturnInput: RetailReturnInput,
  options?: RequestInit,
): Promise<RetailReturnResponse> => {
  return customFetch<RetailReturnResponse>(getRetailPersistReturnUrl(), {
    ...options,
    method: "POST",
    body: JSON.stringify(retailReturnInput),
  });
};

export const getRetailPersistReturnMutationOptions = <TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<Awaited<ReturnType<typeof retailPersistReturn>>, TError, { data: RetailReturnInput }, TContext>;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn = (props: { data: RetailReturnInput }) => retailPersistReturn(props.data, requestOptions);
  return { mutationFn, ...mutationOptions } as UseMutationOptions<Awaited<ReturnType<typeof retailPersistReturn>>, TError, { data: RetailReturnInput }, TContext>;
};

export function useRetailPersistReturn<TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<Awaited<ReturnType<typeof retailPersistReturn>>, TError, { data: RetailReturnInput }, TContext>;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<Awaited<ReturnType<typeof retailPersistReturn>>, TError, { data: RetailReturnInput }, TContext> {
  const mutationOptions = getRetailPersistReturnMutationOptions(options);
  return useMutation(mutationOptions);
}

export const getRetailCancelSaleUrl = (saleId: string) => `/api/retail/sales/${encodeURIComponent(saleId)}/cancel`;

export const retailCancelSale = async (
  saleId: string,
  retailSaleCancellationInput: RetailSaleCancellationInput = {},
  options?: RequestInit,
): Promise<RetailSaleCancellationResponse> => {
  return customFetch<RetailSaleCancellationResponse>(getRetailCancelSaleUrl(saleId), {
    ...options,
    method: "POST",
    body: JSON.stringify(retailSaleCancellationInput),
  });
};

export const getRetailCancelSaleMutationOptions = <TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<Awaited<ReturnType<typeof retailCancelSale>>, TError, { saleId: string; data?: RetailSaleCancellationInput }, TContext>;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};
  const mutationFn = (props: { saleId: string; data?: RetailSaleCancellationInput }) => retailCancelSale(props.saleId, props.data ?? {}, requestOptions);
  return { mutationFn, ...mutationOptions } as UseMutationOptions<Awaited<ReturnType<typeof retailCancelSale>>, TError, { saleId: string; data?: RetailSaleCancellationInput }, TContext>;
};

export function useRetailCancelSale<TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<Awaited<ReturnType<typeof retailCancelSale>>, TError, { saleId: string; data?: RetailSaleCancellationInput }, TContext>;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<Awaited<ReturnType<typeof retailCancelSale>>, TError, { saleId: string; data?: RetailSaleCancellationInput }, TContext> {
  const mutationOptions = getRetailCancelSaleMutationOptions(options);
  return useMutation(mutationOptions);
}
