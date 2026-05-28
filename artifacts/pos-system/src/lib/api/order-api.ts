import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

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
  listOrders() {
    return apiClient.get<ApiEnvelope<ApiRecord[]>>("/api/orders");
  },

  getOrder(id: string) {
    return apiClient.get<ApiEnvelope<ApiRecord>>(`/api/orders/${id}`);
  },

  createOrder(payload: CreateOrderPayload) {
    return apiClient.post<ApiEnvelope<ApiRecord>>("/api/orders", {
      json: payload,
    });
  },

  updateStatus(id: string, payload: UpdateOrderStatusPayload) {
    return apiClient.patch<ApiEnvelope<ApiRecord>>(`/api/orders/${id}/status`, {
      json: payload,
    });
  },

  moveTable(id: string, payload: MoveTablePayload) {
    return apiClient.patch<ApiEnvelope<ApiRecord>>(`/api/orders/${id}/move-table`, {
      json: payload,
    });
  },
};
