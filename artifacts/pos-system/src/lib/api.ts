export const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

const ABSOLUTE_OR_EMBEDDED_URL_PATTERN = /^(https?:|data:|blob:)/i;

export function resolveApiUrl(endpoint: string) {
  if (ABSOLUTE_OR_EMBEDDED_URL_PATTERN.test(endpoint)) return endpoint;

  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_URL}${normalizedEndpoint}`;
}

export function resolveMediaUrl(imageUrl?: string | null) {
  if (!imageUrl) return "";
  if (ABSOLUTE_OR_EMBEDDED_URL_PATTERN.test(imageUrl)) return imageUrl;
  if (imageUrl.startsWith("/api/")) return resolveApiUrl(imageUrl);
  return imageUrl;
}

export async function apiFetch(
  endpoint: string,
  options?: RequestInit,
) {
  const headers = new Headers(options?.headers);

  if (!(options?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(
    resolveApiUrl(endpoint),
    {
      credentials: "include",
      ...options,
      headers,
    },
  );

  return response;
}
