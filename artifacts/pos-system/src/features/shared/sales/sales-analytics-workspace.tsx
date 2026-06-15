"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, ShieldCheck } from "lucide-react";

import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
  DashboardShell,
} from "@/features/shared/dashboard";
import {
  salesAnalyticsApi,
  type SalesAnalyticsCapabilitiesDto,
} from "@/lib/api/sales-analytics-api";

import { SalesAnalyticsDashboard } from "./sales-analytics-dashboard";
import { SalesAnalyticsReconciliationDrilldownPanel } from "./sales-analytics-reconciliation-drilldown-panel";

function getGuardMessage(capabilities: SalesAnalyticsCapabilitiesDto | null) {
  if (!capabilities) return "Loading sales analytics permissions...";
  if (capabilities.plannedReason) return capabilities.plannedReason;
  if (!capabilities.canView) {
    return "Sales analytics requires a management role for this business.";
  }
  if (!capabilities.canExport) {
    return "Sales analytics export requires a management role.";
  }
  if (!capabilities.canReconcile) {
    return "Sales analytics reconciliation requires a management role.";
  }

  return null;
}

export function SalesAnalyticsWorkspace() {
  const [capabilities, setCapabilities] =
    useState<SalesAnalyticsCapabilitiesDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCapabilities = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await salesAnalyticsApi.getCapabilities();
      if (!response.success || !response.data) {
        setErrorMessage(response.message ?? "Failed to load sales analytics permissions.");
        return;
      }

      setCapabilities(response.data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load sales analytics permissions.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCapabilities();
  }, [loadCapabilities]);

  const guardMessage = getGuardMessage(capabilities);
  const canOpenDashboard = Boolean(
    capabilities?.canView &&
      capabilities.canExport &&
      capabilities.canReconcile &&
      capabilities.canInspectSources &&
      !capabilities.isPlannedMode,
  );

  if (capabilities && canOpenDashboard) {
    return (
      <div className="grid gap-4">
        <SalesAnalyticsReconciliationDrilldownPanel />
        <SalesAnalyticsDashboard />
      </div>
    );
  }

  return (
    <DashboardShell
      title="Sales Analytics"
      description="Guarded revenue, product performance, source health, and reconciliation workspace."
      icon={BarChart3}
    >
      <DashboardPanel title="Sales Analytics Access Guard">
        <div className="space-y-4 p-4">
          <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-950">
                  {isLoading
                    ? "Checking sales analytics permissions..."
                    : "Sales analytics is guarded"}
                </p>
                <p className="mt-1 max-w-2xl text-sm text-neutral-600">
                  {errorMessage ??
                    guardMessage ??
                    "Sales analytics is not available for this role or business mode."}
                </p>
                {capabilities && (
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                    Mode: {capabilities.businessMode} · Business: {capabilities.businessId}
                  </p>
                )}
              </div>
            </div>

            <DashboardActions>
              <DashboardActionButton
                icon={ShieldCheck}
                onClick={() => void loadCapabilities()}
                disabled={isLoading}
              >
                {isLoading ? "Checking..." : "Recheck"}
              </DashboardActionButton>
            </DashboardActions>
          </div>
        </div>
      </DashboardPanel>
    </DashboardShell>
  );
}
