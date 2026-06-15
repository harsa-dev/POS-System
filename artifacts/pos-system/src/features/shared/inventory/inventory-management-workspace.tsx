"use client";

import { useCallback, useEffect, useState } from "react";
import { PackageSearch, RefreshCw, ShieldAlert, Warehouse } from "lucide-react";

import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
  DashboardShell,
} from "@/features/shared/dashboard";
import { getApiErrorMessage } from "@/lib/api/api-client";
import {
  inventoryApi,
  type InventoryManagementCapabilitiesDto,
} from "@/lib/api/inventory-api";

import { InventoryBackendReportPanel } from "./inventory-backend-report-panel";
import { InventoryCostSnapshotRepairPanel } from "./inventory-cost-snapshot-repair-panel";
import { InventoryManagementDashboard } from "./inventory-management-dashboard";
import { InventoryMovementReportPanel } from "./inventory-movement-report-panel";

function InventoryAccessGuard({
  capabilities,
  errorMessage,
  isLoading,
  onRetry,
}: {
  capabilities: InventoryManagementCapabilitiesDto | null;
  errorMessage: string | null;
  isLoading: boolean;
  onRetry: () => void;
}) {
  const plannedReason = capabilities?.plannedReason;
  const message = errorMessage ?? plannedReason ?? "Inventory management requires a management role.";

  return (
    <DashboardShell
      title="Inventory Management"
      description="Stock control, COGS repair, item catalog, and movement operations are guarded before the dashboard loads. Astonishingly, warehouses need doors."
    >
      <DashboardPanel
        title="Inventory Access Guard"
        description="Inventory data and mutation tools are management-only until read-only inventory roles are split from stock adjustment workflows."
        icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />}
        actions={
          <DashboardActions>
            <DashboardActionButton icon={RefreshCw} onClick={onRetry} disabled={isLoading}>
              {isLoading ? "Checking..." : "Recheck"}
            </DashboardActionButton>
          </DashboardActions>
        }
      >
        <div className="grid gap-4 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-600 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-base font-semibold text-neutral-950">
              {isLoading ? "Checking inventory access..." : "Inventory dashboard is locked."}
            </p>
            <p className="mt-2 max-w-3xl leading-6">{message}</p>
            {capabilities && (
              <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-neutral-200 bg-white p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Business Mode</dt>
                  <dd className="mt-1 font-semibold text-neutral-950">{capabilities.businessMode}</dd>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">View</dt>
                  <dd className="mt-1 font-semibold text-neutral-950">{capabilities.canView ? "Allowed" : "Blocked"}</dd>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Stock Movement</dt>
                  <dd className="mt-1 font-semibold text-neutral-950">{capabilities.canMoveStock ? "Allowed" : "Blocked"}</dd>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Cost Repair</dt>
                  <dd className="mt-1 font-semibold text-neutral-950">{capabilities.canRepairCostSnapshots ? "Allowed" : "Blocked"}</dd>
                </div>
              </dl>
            )}
          </div>
          <div className="rounded-2xl bg-white p-5 text-neutral-400 shadow-sm">
            <Warehouse className="h-16 w-16" aria-hidden="true" />
          </div>
        </div>
      </DashboardPanel>
    </DashboardShell>
  );
}

export function InventoryManagementWorkspace() {
  const [capabilities, setCapabilities] = useState<InventoryManagementCapabilitiesDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCapabilities = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await inventoryApi.getInventoryManagementCapabilities();
      setCapabilities(response.data);
    } catch (error) {
      setCapabilities(null);
      setErrorMessage(getApiErrorMessage(error, "Failed to load inventory access policy."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCapabilities();
  }, [loadCapabilities]);

  const canUseDashboard = Boolean(
    capabilities?.canView &&
      capabilities.canCreateItem &&
      capabilities.canUpdateItem &&
      capabilities.canDeleteItem &&
      capabilities.canMoveStock &&
      capabilities.canRepairCostSnapshots &&
      !capabilities.isPlannedMode,
  );

  if (!canUseDashboard) {
    return (
      <InventoryAccessGuard
        capabilities={capabilities}
        errorMessage={errorMessage}
        isLoading={isLoading}
        onRetry={loadCapabilities}
      />
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPanel
        title="Inventory Access Policy"
        description="Management access confirmed before loading stock catalog, movements, imports, and cost snapshot repair tools. Yes, the dashboard now checks the lock before opening the warehouse."
        icon={<PackageSearch className="h-4 w-4" aria-hidden="true" />}
        actions={
          <DashboardActions>
            <DashboardActionButton icon={RefreshCw} onClick={loadCapabilities} disabled={isLoading}>
              {isLoading ? "Checking..." : "Recheck"}
            </DashboardActionButton>
          </DashboardActions>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Business Mode</p>
            <p className="mt-1 font-semibold text-neutral-950">{capabilities?.businessMode}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Item CRUD</p>
            <p className="mt-1 font-semibold text-neutral-950">Allowed</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Stock Movement</p>
            <p className="mt-1 font-semibold text-neutral-950">Allowed</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Cost Repair</p>
            <p className="mt-1 font-semibold text-neutral-950">Allowed</p>
          </div>
        </div>
      </DashboardPanel>

      <InventoryBackendReportPanel />
      <InventoryMovementReportPanel />
      <InventoryCostSnapshotRepairPanel />
      <InventoryManagementDashboard />
    </div>
  );
}
