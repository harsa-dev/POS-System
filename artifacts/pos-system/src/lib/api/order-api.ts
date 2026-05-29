import { apiFetch, apiJson, type ApiEnvelope } from "@/lib/api/api-client";

type ApiRecord = Record<string, unknown>;

export type CreateOrderPayload = ApiRecord;
export type UpdateOrderStatusPayload = {
  status: string;
  cancelReason?: string;
};
export type MoveTablePayload = {
  tableId: string;
};

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

  updateStatus<T = ApiRecord>(id: string, payload: UpdateOrderStatusPayload) {
    return apiJson<ApiEnvelope<T>>(`/api/orders/${id}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
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
