import { apiJson, type ApiEnvelope } from "@/lib/api/api-client";

type EmployeePayload = {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
};

export const employeesApi = {
  list() {
    return apiJson<ApiEnvelope<unknown[]>>("/api/employees", {
      credentials: "include",
    });
  },

  create(payload: Required<Pick<EmployeePayload, "name" | "email" | "password" | "role">>) {
    return apiJson<ApiEnvelope>("/api/employees", {
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  update(id: string, payload: EmployeePayload) {
    return apiJson<ApiEnvelope>(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  deactivate(id: string) {
    return apiJson<ApiEnvelope>(`/api/employees/${id}`, { method: "DELETE" });
  },

  resetPassword(id: string, password: string) {
    return apiJson<ApiEnvelope>(`/api/employees/${id}/reset-password`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
  },
};
