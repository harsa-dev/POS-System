import { apiFetch, apiJson, type ApiEnvelope } from "@/lib/api/api-client";
import { readApiEnvelope } from "@/lib/api/read-api-envelope";

export type PaymentTransactionPayload = {
  orderId: string;
  total: number;
  customerName: string;
};

export type PaymentTransactionBody<T = unknown> = ApiEnvelope<T> & {
  redirectUrl?: string;
};

export type PaymentTransactionResult<T = unknown> = {
  ok: boolean;
  status: number;
  body: PaymentTransactionBody<T>;
};

export const paymentsApi = {
  list<T = unknown[]>() {
    return apiJson<ApiEnvelope<T>>("/api/payments", {
      credentials: "include",
    });
  },

  createTransaction<T = unknown>(payload: PaymentTransactionPayload) {
    return apiJson<ApiEnvelope<T> & { redirectUrl?: string }>("/api/payments/create-transaction", {
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async createTransactionWithResult<T = unknown>(
    payload: PaymentTransactionPayload,
  ): Promise<PaymentTransactionResult<T>> {
    const response = await apiFetch("/api/payments/create-transaction", {
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await readApiEnvelope<T>(response, "payment"),
    };
  },
};
