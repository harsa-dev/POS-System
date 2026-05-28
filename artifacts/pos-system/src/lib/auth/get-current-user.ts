import { authApi } from "@/lib/api";

export async function getCurrentUser() {
  try {
    const data = await authApi.me();
    return data.data ?? null;
  } catch {
    return null;
  }
}
