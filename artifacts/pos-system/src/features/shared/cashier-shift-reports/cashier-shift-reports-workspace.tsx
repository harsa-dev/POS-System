"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, ShieldCheck } from "lucide-react";

import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
  DashboardShell,
} from "@/features/shared/dashboard";
import {
  shiftsApi,
  type CashierShiftReportsCapabilitiesDto,
} from "@/lib/api/shifts-api";

import { CashierShiftReportsDashboard } from "./cashier-shift-reports-dashboard";

function getGuardMessage(capabilities: CashierShiftReportsCapabilitiesDto | null) {
  if (!capabilities) return "Loading cashier shift report permissions...";
  if (capabilities.plannedReason) return capabilities.plannedReason;
  if (!capabilities.canView) {
    return "Cashier shift reports require a management role for this business.";
  }
  if (!capabilities.canSyncToCashflow) {
    return "Cashier shift cashflow sync requires a management role.";
  }

  return null;
}

export function CashierShiftReportsWorkspace() {
  const [capabilities, setCapabilities] =
    useState<CashierShiftReportsCapabilitiesDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCapabilities = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await shiftsApi.getCapabilities();
      if (!response.success || !response.data) {
        setErrorMessage(
          response.message ?? "Failed to load cashier shift report permissions.",
        );
        return;
      }

      setCapabilities(response.data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load cashier shift report permissions.",
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
      capabilities.canSyncToCashflow &&
      !capabilities.isPlannedMode,
  );

  if (capabilities && canOpenDashboard) {
    return <CashierShiftReportsDashboard />;
  }

  return (
    <DashboardShell
      title="Cashier Shift Reports"
      description="Guarded cashier shift reports, cash discrepancy tracking, and cashflow sync workspace."
      icon={CalendarClock}
    >
      <DashboardPanel title="Cashier Shift Reports Access Guard">
        <div className="space-y-4 p-4">
          <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-950">
                  {isLoading
                    ? "Checking cashier shift report permissions..."
                    : "Cashier shift reports are guarded"}
                </p>
                <p className="mt-1 max-w-2xl text-sm text-neutral-600">
                  {errorMessage ??
                    guardMessage ??
                    "Cashier shift reports are not available for this role or business mode."}
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
