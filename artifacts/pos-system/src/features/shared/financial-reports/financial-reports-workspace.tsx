"use client";

import { useEffect, useState } from "react";
import { BarChart3, ShieldCheck } from "lucide-react";

import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
  DashboardShell,
} from "@/features/shared/dashboard";
import {
  financialReportsApi,
  type FinancialReportsCapabilitiesDto,
} from "@/lib/api/financial-reports-api";

import { FinancialReportsDashboard } from "./financial-reports-dashboard";
import { FinancialReportsDrilldownPanel } from "./financial-reports-drilldown-panel";

function getGuardMessage(capabilities: FinancialReportsCapabilitiesDto | null) {
  if (!capabilities) return "Loading financial report permissions...";
  if (capabilities.plannedReason) return capabilities.plannedReason;
  if (!capabilities.canView) {
    return "Financial reports require a management role for this business.";
  }

  return null;
}

export function FinancialReportsWorkspace() {
  const [capabilities, setCapabilities] =
    useState<FinancialReportsCapabilitiesDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadCapabilities() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await financialReportsApi.getCapabilities();
      if (!response.success || !response.data) {
        setErrorMessage(
          response.message ?? "Failed to load financial report permissions.",
        );
        return;
      }

      setCapabilities(response.data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load financial report permissions.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCapabilities();
  }, []);

  const guardMessage = getGuardMessage(capabilities);
  const canOpenDashboard = Boolean(
    capabilities?.canView &&
      capabilities.canExport &&
      capabilities.canReconcile &&
      !capabilities.isPlannedMode,
  );

  if (capabilities && canOpenDashboard) {
    return (
      <div className="space-y-5">
        <FinancialReportsDrilldownPanel />
        <FinancialReportsDashboard />
      </div>
    );
  }

  return (
    <DashboardShell
      title="Financial Reports"
      description="Guarded financial reports, reconciliation, source health, and export dashboard."
      icon={BarChart3}
    >
      <DashboardPanel title="Financial Reports Access Guard">
        <div className="space-y-4 p-4">
          <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-950">
                  {isLoading
                    ? "Checking financial report permissions..."
                    : "Financial reports are guarded"}
                </p>
                <p className="mt-1 max-w-2xl text-sm text-neutral-600">
                  {errorMessage ??
                    guardMessage ??
                    "Financial reports are not available for this role or business mode."}
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
