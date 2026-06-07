import { apiFetch, apiJson, type ApiEnvelope } from "@/lib/api/api-client";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPaymentTransactionBody<T>(
  value: unknown,
): value is PaymentTransactionBody<T> {
  return isRecord(value) && typeof value.success === "boolean";
}

async function readPaymentTransactionBody<T>(
  response: Response,
): Promise<PaymentTransactionBody<T>> {
  const rawText = await response.text();

  if (!rawText.trim()) {
    return {
      success: false,
      message: `Empty payment API response (${response.status})`,
    };
  }

  try {
    const parsed: unknown = JSON.parse(rawText);

    if (isPaymentTransactionBody<T>(parsed)) {
      return parsed;
    }

    return {
      success: false,
      message: `Unexpected payment API response (${response.status})`,
    };
  } catch {
    return {
      success: false,
      message: rawText,
    };
  }
}

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
      body: await readPaymentTransactionBody<T>(response),
    };
  },
};
