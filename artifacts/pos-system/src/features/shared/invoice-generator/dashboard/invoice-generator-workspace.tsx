"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

import {
  invoiceApi,
  type InvoiceCapabilitiesDto,
} from "@/lib/api/invoice-api";
import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
  DashboardShell,
} from "@/features/shared/dashboard";
import { InvoiceGeneratorDashboard } from "./invoice-generator-dashboard";

function getGuardMessage(capabilities: InvoiceCapabilitiesDto | null) {
  if (!capabilities) return "Loading invoice permissions...";
  if (capabilities.plannedReason) return capabilities.plannedReason;
  if (!capabilities.canCreate && !capabilities.canUpdate) {
    return "Your role can view shared operations, but invoice creation and editing require a management role.";
  }
  if (!capabilities.canView) {
    return "Your role does not have access to the invoice generator.";
  }
  return null;
}

export function InvoiceGeneratorWorkspace() {
  const [capabilities, setCapabilities] = useState<InvoiceCapabilitiesDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadCapabilities() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await invoiceApi.getCapabilities();
      if (!response.success || !response.data) {
        setErrorMessage(response.message ?? "Failed to load invoice permissions.");
        return;
      }
      setCapabilities(response.data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load invoice permissions.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCapabilities();
  }, []);

  const guardMessage = getGuardMessage(capabilities);
  const canUseDashboard = Boolean(
    capabilities?.canView &&
      capabilities.canCreate &&
      capabilities.canUpdate &&
      !capabilities.isPlannedMode,
  );

  if (canUseDashboard) {
    return <InvoiceGeneratorDashboard />;
  }

  return (
    <DashboardShell
      title="Invoice Generator"
      description="Create, save, and print standalone invoices for this business."
    >
      <DashboardPanel title="Invoice Access Guard">
        <div className="space-y-4 p-4">
          <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-950">
                  {isLoading ? "Checking invoice permissions..." : "Invoice generator is guarded"}
                </p>
                <p className="mt-1 max-w-2xl text-sm text-neutral-600">
                  {errorMessage ?? guardMessage ?? "Invoice generator is not available for this role or business mode."}
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
