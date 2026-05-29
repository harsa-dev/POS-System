import { apiJson, type ApiEnvelope } from "@/lib/api/api-client";

type AttendancePayload = Record<string, unknown>;

export const attendanceApi = {
  list() {
    return apiJson<ApiEnvelope<unknown[]>>("/api/attendance", {
      credentials: "include",
    });
  },

  clockIn(payload?: AttendancePayload) {
    return apiJson<ApiEnvelope>("/api/attendance/clock-in", {
      method: "POST",
      credentials: "include",
      ...(payload
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        : {}),
    });
  },

  clockOut(payload?: AttendancePayload) {
    return apiJson<ApiEnvelope>("/api/attendance/clock-out", {
      method: "POST",
      credentials: "include",
      ...(payload
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        : {}),
    });
  },

  update(id: string, payload: AttendancePayload) {
    return apiJson<ApiEnvelope>(`/api/attendance/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  delete(id: string) {
    return apiJson<ApiEnvelope>(`/api/attendance/${id}`, {
      credentials: "include",
      method: "DELETE",
    });
  },

  getSettings() {
    return apiJson<ApiEnvelope>("/api/attendance-settings", {
      credentials: "include",
    });
  },

  updateSettings(payload: AttendancePayload) {
    return apiJson<ApiEnvelope>("/api/attendance-settings", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
};
