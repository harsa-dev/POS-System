import { apiFetch, apiJson, type ApiEnvelope } from "@/lib/api/api-client";

type TablePayload = {
  name?: string;
  capacity?: number;
  isActive?: boolean;
};

export const tablesApi = {
  listResponse() {
    return apiFetch("/api/tables", { credentials: "include" });
  },

  list<T = unknown[]>() {
    return apiJson<ApiEnvelope<T>>("/api/tables", {
      credentials: "include",
    });
  },

  create(payload: Required<Pick<TablePayload, "name" | "capacity">>) {
    return apiJson<ApiEnvelope>("/api/tables", {
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  update(id: string, payload: TablePayload) {
    return apiJson<ApiEnvelope>(`/api/tables/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  markClean(id: string) {
    return apiJson<ApiEnvelope>(`/api/tables/${id}/mark-clean`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
  },
};
