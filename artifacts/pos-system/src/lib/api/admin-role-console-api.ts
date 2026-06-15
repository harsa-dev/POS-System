import { apiClient } from "@/lib/api/api-client";

import type { AdminRoleConsoleDataSourceResult } from "@/features/shared/platform-monitoring/admin-role-console-data-source";

export type AdminRoleConsoleApiEnvelopeDto<TData> = {
  success: boolean;
  data?: TData;
  meta?: {
    generatedAt: string;
    source: "api" | "mock-registry" | "section-fallback" | "fallback";
    mock: boolean;
    mode: "read-only";
    capability: string;
    readOnly: true;
  };
  message?: string;
};

export const adminRoleConsoleApi = {
  getOverview() {
    return apiClient.get<AdminRoleConsoleApiEnvelopeDto<AdminRoleConsoleDataSourceResult>>(
      "/api/internal/admin-console/roles",
    );
  },
};
