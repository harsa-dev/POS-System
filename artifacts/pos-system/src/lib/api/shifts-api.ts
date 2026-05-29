import { apiJson, type ApiEnvelope } from "@/lib/api/api-client";

type ShiftPayload = Record<string, unknown>;

export const shiftsApi = {
  current() {
    return apiJson<ApiEnvelope<any>>("/api/shifts/current", {
      credentials: "include",
    });
  },

  list() {
    return apiJson<ApiEnvelope<any[]>>("/api/shifts", {
      credentials: "include",
    });
  },

  open(payload: ShiftPayload) {
    return apiJson<ApiEnvelope<any>>("/api/shifts/open", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  close(id: string, payload: ShiftPayload) {
    return apiJson<ApiEnvelope<any>>(`/api/shifts/${id}/close`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
};
