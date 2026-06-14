import { getApiErrorMessage } from "@/lib/api/api-client";

export function getRawMaterialWorkflowReadErrorMessage(error: unknown) {
  return getApiErrorMessage(error, "Raw Material workflow read API is unavailable. Using mock fallback data.");
}
