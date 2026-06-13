import type {
  RetailSaleCancellationInput,
  RetailSaleCancellationResponse,
} from "./api.schemas";

export function getRetailCancelSaleUrl(saleId: string) {
  return `/api/retail/sales/${encodeURIComponent(saleId)}/cancel`;
}

export async function retailCancelSale(
  saleId: string,
  input: RetailSaleCancellationInput = {},
  signal?: AbortSignal,
): Promise<RetailSaleCancellationResponse> {
  const response = await fetch(getRetailCancelSaleUrl(saleId), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    signal,
  });

  const payload = await response.json() as RetailSaleCancellationResponse;

  if (!response.ok) {
    throw new Error(payload.message ?? "Failed to cancel retail sale.");
  }

  return payload;
}
