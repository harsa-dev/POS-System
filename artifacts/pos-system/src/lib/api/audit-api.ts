import { apiJson, type ApiEnvelope } from "@/lib/api/api-client";

export const auditApi = {
  list() {
    return apiJson<ApiEnvelope<unknown[]>>("/api/audit-logs", {
      credentials: "include",
    });
  },
};
