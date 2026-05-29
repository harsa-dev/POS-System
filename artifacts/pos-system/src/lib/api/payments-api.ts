import { apiJson, type ApiEnvelope } from "@/lib/api/api-client";

type PaymentTransactionPayload = {
  orderId: string;
  total: number;
  customerName: string;
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
};
