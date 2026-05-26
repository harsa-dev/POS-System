const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(
  endpoint: string,
  options?: RequestInit,
) {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      ...options,
    },
  );

  return response;
}