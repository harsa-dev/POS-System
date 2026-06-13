import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions, UseMutationResult } from "@tanstack/react-query";

import type {
  RetailReceivingStatusUpdateInput,
  RetailReceivingStatusUpdateResponse,
} from "./api.schemas";

import { customFetch } from "../custom-fetch";
import type { ErrorType } from "../custom-fetch";

type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const getRetailUpdateReceivingStatusUrl = (id: string) => `/api/retail/receiving/${id}/status`;

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
