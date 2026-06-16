import type {
  RetailSharedDashboardContext,
  RetailSharedDashboardId,
} from "@/features/retail/core-system";
import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

export async function fetchRetailSharedDashboardContext(
  dashboardId: RetailSharedDashboardId,
  signal?: AbortSignal,
): Promise<RetailSharedDashboardContext> {
  const payload = await apiClient.get<ApiEnvelope<RetailSharedDashboardContext>>(
    `/api/retail/shared-dashboard/${dashboardId}`,
    { signal },
  );

  if (!payload.success || !payload.data) {
    throw new Error(payload.message ?? "Retail shared dashboard data is unavailable.");
  }

  return payload.data;
}
