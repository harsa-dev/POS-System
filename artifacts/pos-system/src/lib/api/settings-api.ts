import { apiJson, type ApiEnvelope } from "@/lib/api/api-client";

type SettingsPayload = Record<string, unknown>;

export const settingsApi = {
  get<T = unknown>() {
    return apiJson<ApiEnvelope<T>>("/api/settings", { credentials: "include" });
  },

  update(payload: SettingsPayload) {
    return apiJson<ApiEnvelope>("/api/settings", {
      credentials: "include",
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
};
