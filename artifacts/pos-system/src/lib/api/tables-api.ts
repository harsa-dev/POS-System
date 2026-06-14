import { apiFetch, apiJson, type ApiEnvelope } from "@/lib/api/api-client";
import { readApiEnvelope } from "@/lib/api/read-api-envelope";

type ApiRecord = Record<string, unknown>;

type TablePayload = {
  name?: string;
  capacity?: number;
  isActive?: boolean;
};

export type TablesApiResult<T = ApiRecord> = {
  ok: boolean;
  status: number;
  body: ApiEnvelope<T>;
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

  async markCleanWithResult<T = ApiRecord>(
    id: string,
  ): Promise<TablesApiResult<T>> {
    const response = await apiFetch(`/api/tables/${id}/mark-clean`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await readApiEnvelope<T>(response, "tables"),
    };
  },
};
