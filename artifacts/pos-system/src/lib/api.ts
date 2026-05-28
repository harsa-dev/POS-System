const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(
  endpoint: string,
  options?: RequestInit,
) {
  const headers = new Headers(options?.headers);

  if (!(options?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      credentials: "include",
      ...options,
      headers,
    },
  );

  return response;
}
