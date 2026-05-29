export const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

const ABSOLUTE_OR_EMBEDDED_URL_PATTERN = /^(https?:|data:|blob:)/i;
const isDev = import.meta.env.DEV;

export type ApiEnvelope<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type ApiErrorKind =
  | "network"
  | "invalid_json"
  | "http";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly endpoint: string;
  readonly url: string;
  readonly body?: unknown;
  readonly rawText?: string;

  constructor({
    kind,
    message,
    endpoint,
    url,
    status,
    body,
    rawText,
  }: {
    kind: ApiErrorKind;
    message: string;
    endpoint: string;
    url: string;
    status?: number;
    body?: unknown;
    rawText?: string;
  }) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.endpoint = endpoint;
    this.url = url;
    this.body = body;
    this.rawText = rawText;
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | null;
  json?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractBackendMessage(body: unknown) {
  if (!isRecord(body)) return null;

  const message = body.message ?? body.error;
  return typeof message === "string" && message.trim() ? message : null;
}

function debugRequest(method: string, endpoint: string, url: string) {
  if (!isDev) return;
  console.debug("[api-client] request", { method, endpoint, url });
}

function debugResponse(
  method: string,
  endpoint: string,
  status: number,
  body: unknown,
) {
  if (!isDev) return;
  console.debug("[api-client] response", { method, endpoint, status, body });
}

function debugError(method: string, endpoint: string, error: unknown) {
  if (!isDev) return;
  console.debug("[api-client] error", { method, endpoint, error });
}

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

async function parseJsonResponse<T>(
  response: Response,
  endpoint: string,
  url: string,
) {
  const rawText = await response.text();

  if (!rawText) {
    return undefined as T;
  }

  try {
    return JSON.parse(rawText) as T;
  } catch (error) {
    throw new ApiError({
      kind: "invalid_json",
      message: "Invalid server response",
      endpoint,
      url,
      status: response.status,
      rawText,
      body: error,
    });
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
) {
  const {
    json,
    body: requestBody,
    ...fetchOptions
  } = options;
  const url = resolveApiUrl(endpoint);
  const method = fetchOptions.method ?? "GET";
  const headers = new Headers(fetchOptions.headers);
  const body = json === undefined ? requestBody : JSON.stringify(json);

  if (
    json !== undefined &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  debugRequest(method, endpoint, url);

  try {
    const response = await fetch(url, {
      credentials: "include",
      ...fetchOptions,
      body,
      headers,
    });
    const data = await parseJsonResponse<T>(response, endpoint, url);

    debugResponse(method, endpoint, response.status, data);

    if (!response.ok) {
      throw new ApiError({
        kind: "http",
        message:
          extractBackendMessage(data) ??
          `Request failed with status ${response.status}`,
        endpoint,
        url,
        status: response.status,
        body: data,
      });
    }

    return data;
  } catch (error) {
    debugError(method, endpoint, error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError({
      kind: "network",
      message: error instanceof Error ? error.message : "Network request failed",
      endpoint,
      url,
      body: error,
    });
  }
}

export async function apiFetch(
  endpoint: string,
  options?: RequestInit,
) {
  const url = resolveApiUrl(endpoint);
  const method = options?.method ?? "GET";
  const headers = new Headers(options?.headers);

  if (!(options?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  debugRequest(method, endpoint, url);

  try {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
      headers,
    });

    if (isDev) {
      console.debug("[api-client] legacy response", {
        method,
        endpoint,
        status: response.status,
      });
    }

    return response;
  } catch (error) {
    debugError(method, endpoint, error);
    throw error;
  }
}

export async function apiJson<T>(
  endpoint: string,
  options?: RequestInit,
) {
  const response = await apiFetch(endpoint, options);
  return (await response.json()) as T;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "POST" }),
  patch: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "PATCH" }),
  delete: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};
