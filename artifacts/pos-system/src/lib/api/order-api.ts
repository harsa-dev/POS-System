import { apiFetch, apiJson, type ApiEnvelope } from "@/lib/api/api-client";

type ApiRecord = Record<string, unknown>;

export type CreateOrderPayload = ApiRecord;
export type OrderApiResult<T = ApiRecord> = {
  ok: boolean;
  status: number;
  body: ApiEnvelope<T>;
};
export type UpdateOrderStatusPayload = {
  status: string;
  cancelReason?: string;
};
export type MoveTablePayload = {
  tableId: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return isRecord(value) && typeof value.success === "boolean";
}

async function readApiEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const rawText = await response.text();

  if (!rawText.trim()) {
    return {
      success: false,
      message: `Empty order API response (${response.status})`,
    };
  }

  try {
    const parsed: unknown = JSON.parse(rawText);

    if (isApiEnvelope<T>(parsed)) {
      return parsed;
    }

    return {
      success: false,
      message: `Unexpected order API response (${response.status})`,
    };
  } catch {
    return {
      success: false,
      message: rawText,
    };
  }
}

export const orderApi = {
  listOrdersResponse() {
    return apiFetch("/api/orders", { credentials: "include" });
  },

  listOrders<T = ApiRecord[]>() {
    return apiJson<ApiEnvelope<T>>("/api/orders", {
      credentials: "include",
    });
  },

  getOrderResponse(id: string) {
    return apiFetch(`/api/orders/${id}`, { credentials: "include" });
  },

  getOrder<T = ApiRecord>(id: string) {
    return apiJson<ApiEnvelope<T>>(`/api/orders/${id}`, {
      credentials: "include",
    });
  },

  createOrder<T = ApiRecord>(payload: CreateOrderPayload) {
    return apiJson<ApiEnvelope<T>>("/api/orders", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async createOrderWithResult<T = ApiRecord>(
    payload: CreateOrderPayload,
  ): Promise<OrderApiResult<T>> {
    const response = await apiFetch("/api/orders", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await readApiEnvelope<T>(response),
    };
  },

  updateStatus<T = ApiRecord>(id: string, payload: UpdateOrderStatusPayload) {
    return apiJson<ApiEnvelope<T>>(`/api/orders/${id}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async updateStatusWithResult<T = ApiRecord>(
    id: string,
    payload: UpdateOrderStatusPayload,
  ): Promise<OrderApiResult<T>> {
    const response = await apiFetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await readApiEnvelope<T>(response),
    };
  },

  moveTable<T = ApiRecord>(id: string, payload: MoveTablePayload) {
    return apiJson<ApiEnvelope<T>>(`/api/orders/${id}/move-table`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
};
