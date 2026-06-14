import type { ApiEnvelope } from "@/lib/api/api-client";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return isRecord(value) && typeof value.success === "boolean";
}

export async function readApiEnvelope<T>(
  response: Response,
  context: string,
): Promise<ApiEnvelope<T>> {
  const rawText = await response.text();

  if (!rawText.trim()) {
    return {
      success: false,
      message: `Empty ${context} API response (${response.status})`,
    };
  }

  try {
    const parsed: unknown = JSON.parse(rawText);

    if (isApiEnvelope<T>(parsed)) {
      return parsed;
    }

    return {
      success: false,
      message: `Unexpected ${context} API response (${response.status})`,
    };
  } catch {
    return {
      success: false,
      message: rawText,
    };
  }
}
