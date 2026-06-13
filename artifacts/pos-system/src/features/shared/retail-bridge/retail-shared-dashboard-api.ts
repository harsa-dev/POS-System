import type {
  RetailSharedDashboardContext,
  RetailSharedDashboardId,
} from "@/features/retail/core-system";

type ApiSuccessResponse<TData> = {
  success: true;
  data: TData;
  message?: string;
};

export async function fetchRetailSharedDashboardContext(
  dashboardId: RetailSharedDashboardId,
  signal?: AbortSignal,
): Promise<RetailSharedDashboardContext> {
  const response = await fetch(`/api/retail/shared-dashboard/${dashboardId}`, {
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Retail shared dashboard API failed with ${response.status}`);
  }

  const payload = (await response.json()) as ApiSuccessResponse<RetailSharedDashboardContext>;

  return payload.data;
}
