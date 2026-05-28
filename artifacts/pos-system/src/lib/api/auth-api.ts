import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  restaurantId?: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export const authApi = {
  login(payload: LoginRequest) {
    return apiClient.post<ApiEnvelope<AuthUser>>("/api/auth/login", {
      json: payload,
    });
  },

  register(payload: RegisterRequest) {
    return apiClient.post<ApiEnvelope<AuthUser>>("/api/auth/register", {
      json: payload,
    });
  },

  me() {
    return apiClient.get<ApiEnvelope<AuthUser>>("/api/auth/me");
  },

  logout() {
    return apiClient.post<ApiEnvelope>("/api/auth/logout");
  },
};
