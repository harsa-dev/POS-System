import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

type ApiRecord = any;
type ApiDataEnvelope<T> = ApiEnvelope<T> & { data: T };

export type InventoryItemPayload = ApiRecord;
export type StockMovementPayload = ApiRecord;

export const inventoryApi = {
  listInventoryItems() {
    return apiClient.get<ApiDataEnvelope<ApiRecord[]>>("/api/inventory-items");
  },

  createInventoryItem(payload: InventoryItemPayload) {
    return apiClient.post<ApiEnvelope<ApiRecord>>("/api/inventory-items", {
      json: payload,
    });
  },

  updateInventoryItem(id: string, payload: Partial<InventoryItemPayload>) {
    return apiClient.patch<ApiEnvelope<ApiRecord>>(`/api/inventory-items/${id}`, {
      json: payload,
    });
  },

  deleteInventoryItem(id: string) {
    return apiClient.delete<ApiEnvelope>(`/api/inventory-items/${id}`);
  },

  listStockMovements() {
    return apiClient.get<ApiDataEnvelope<ApiRecord[]>>("/api/inventory");
  },

  createStockMovement(payload: StockMovementPayload) {
    return apiClient.post<ApiEnvelope<ApiRecord>>("/api/inventory", {
      json: payload,
    });
  },
};
