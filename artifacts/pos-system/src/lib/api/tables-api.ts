import { apiFetch, apiJson, type ApiEnvelope } from "@/lib/api/api-client";

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
      message: `Empty tables API response (${response.status})`,
    };
  }

  try {
    const parsed: unknown = JSON.parse(rawText);

    if (isApiEnvelope<T>(parsed)) {
      return parsed;
    }

    return {
      success: false,
      message: `Unexpected tables API response (${response.status})`,
    };
  } catch {
    return {
      success: false,
      message: rawText,
    };
  }
}

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
      body: await readApiEnvelope<T>(response),
    };
  },
};
