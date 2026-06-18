"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
} from "@/features/shared/dashboard";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import { getApiErrorMessage } from "@/lib/api/api-client";
import {
  inventoryCostSnapshotRepairApi,
  type InventoryCostSnapshotRepairPreviewDto,
  type InventoryCostSnapshotRepairResultDto,
  type InventoryCostSnapshotRepairRowDto,
} from "@/lib/api/inventory-cost-snapshot-repair-api";

import {
  consumeInventoryCostSnapshotRepair,
  openFinancialReportsRepairFeedback,
  type FinancialReportInventoryRepairPayload,
  type FinancialReportRepairFeedbackPayload,
} from "@/features/shared/financial-reports/financial-reports-drilldown-bridge";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function hasRepairHash() {
  return (
    typeof window !== "undefined" &&
    window.location.hash === "#inventory-cost-snapshot-repair"
  );
}

function getInitialPayload(): FinancialReportInventoryRepairPayload | null {
  const bridgedPayload = consumeInventoryCostSnapshotRepair();
  if (bridgedPayload) return bridgedPayload;

  if (hasRepairHash()) {
    return {
      sourceIssue: "missing_cost_snapshots",
      message: "Manual inventory cost quality preview.",
    };
  }

  return null;
}

function buildRepairFeedbackPayload(
  payload: FinancialReportInventoryRepairPayload,
  result: InventoryCostSnapshotRepairResultDto,
): FinancialReportRepairFeedbackPayload {
  return {
    sourceIssue: "missing_cost_snapshots",
    from: payload.from,
    to: payload.to,
    repairedCount: result.repairedCount,
    repairedValue: result.repairedValue,
    repairedMovementIds: result.repairedMovementIds,
    completedAt: new Date().toISOString(),
    message: `${formatNumber(result.repairedCount)} movement(s) backfilled from cost snapshot repair.`,
  };
}

export function InventoryCostSnapshotRepairPanel() {
  const [payload, setPayload] =
    useState<FinancialReportInventoryRepairPayload | null>(null);
  const [preview, setPreview] =
    useState<InventoryCostSnapshotRepairPreviewDto | null>(null);
  const [lastRepairFeedback, setLastRepairFeedback] =
    useState<FinancialReportRepairFeedbackPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setPayload(getInitialPayload());
  }, []);

  const repairableRows = useMemo(
    () => preview?.rows.filter((row) => row.repairStatus === "REPAIRABLE") ?? [],
    [preview],
  );

  const needsItemCostRows = useMemo(
    () => preview?.rows.filter((row) => row.repairStatus === "NEEDS_ITEM_COST") ?? [],
    [preview],
  );

  const loadPreview = useCallback(async () => {
    if (!payload) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await inventoryCostSnapshotRepairApi.preview({
        from: payload.from,
        to: payload.to,
        limit: 100,
      });
      setPreview(response.data);
    } catch (error) {
      setPreview(null);
      setErrorMessage(
        getApiErrorMessage(error, "Unable to load inventory cost quality preview."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [payload]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  const handleBackfill = useCallback(async () => {
    if (!payload || repairableRows.length === 0) return;

    setIsRepairing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setLastRepairFeedback(null);

    try {
      const response = await inventoryCostSnapshotRepairApi.backfill({
        from: payload.from,
        to: payload.to,
        limit: 100,
        movementIds: repairableRows.map((row) => row.movementId),
      });

      const feedbackPayload = buildRepairFeedbackPayload(payload, response.data);
      setLastRepairFeedback(feedbackPayload);
      setSuccessMessage(
        `${formatNumber(response.data.repairedCount)} movement(s) backfilled with current item cost as snapshot · ${formatCurrency(response.data.repairedValue)} COGS value restored. Review Financial Reports reconciliation to confirm.`,
      );
      await loadPreview();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to backfill cost snapshots."),
      );
    } finally {
      setIsRepairing(false);
    }
  }, [loadPreview, payload, repairableRows]);

  const handleReviewReconciliation = useCallback(() => {
    if (!lastRepairFeedback) return;
    openFinancialReportsRepairFeedback(lastRepairFeedback);
  }, [lastRepairFeedback]);

  const columns = useMemo<
    DataTableColumn<InventoryCostSnapshotRepairRowDto>[]
  >(
    () => [
      {
        key: "createdAt",
        header: "Movement Date",
        cell: (row) => formatDateTime(row.createdAt),
      },
      {
        key: "itemName",
        header: "Inventory Item",
        cell: (row) => (
          <div>
            <p className="font-semibold text-foreground">{row.itemName}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {row.inventoryItemId ?? "Missing item id"}
            </p>
          </div>
        ),
      },
      { key: "quantity", header: "Qty", cell: (row) => formatNumber(row.quantity) },
      {
        key: "sourceType",
        header: "Source",
        cell: (row) => (
          <div>
            <p className="font-medium text-foreground">{row.sourceType}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {row.sourceId ?? "No source id"}
            </p>
          </div>
        ),
      },
      { key: "reason", header: "Reason", cell: (row) => row.reason },
      {
        key: "itemCost",
        header: "Item Cost",
        className: "text-right",
        cell: (row) => formatCurrency(row.itemCost),
      },
      {
        key: "estimatedCost",
        header: "Estimated COGS",
        className: "text-right",
        cell: (row) => (
          <span className="font-semibold">{formatCurrency(row.estimatedCost)}</span>
        ),
      },
      {
        key: "repairStatus",
        header: "Cost Status",
        cell: (row) => (
          <StatusPill tone={row.repairStatus === "REPAIRABLE" ? "green" : "amber"}>
            {row.repairStatus === "REPAIRABLE" ? "Has item cost" : "Needs item cost"}
          </StatusPill>
        ),
      },
    ],
    [],
  );

  if (!payload) return null;

  return (
    <div id="inventory-cost-snapshot-repair">
      <DashboardPanel
        title="Financial Report Inventory Cost Review"
        description="Find COGS stock movements whose linked inventory items do not have usable costs for the financial reporting period."
        action={
          <DashboardActions>
            {lastRepairFeedback && (
              <DashboardActionButton
                icon={BarChart3}
                onClick={handleReviewReconciliation}
                disabled={isLoading || isRepairing}
              >
                Review Reconciliation
              </DashboardActionButton>
            )}
            <DashboardActionButton
              icon={RefreshCw}
              onClick={() => void loadPreview()}
              disabled={isLoading || isRepairing}
            >
              {isLoading ? "Refreshing..." : "Refresh Preview"}
            </DashboardActionButton>
            <DashboardActionButton
              icon={Wrench}
              variant="primary"
              onClick={() => void handleBackfill()}
              disabled={isLoading || isRepairing || repairableRows.length === 0}
            >
              {isRepairing ? "Backfilling..." : "Backfill Snapshots"}
            </DashboardActionButton>
          </DashboardActions>
        }
      >
        <div className="space-y-4 p-4">
          {payload.message && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
              {payload.message}
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4" aria-hidden="true" />
              <p>{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4" aria-hidden="true" />
              <div>
                <p>{successMessage}</p>
                {lastRepairFeedback && (
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold underline underline-offset-4"
                    onClick={handleReviewReconciliation}
                  >
                    Review updated reconciliation in Financial Reports
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-4">
            <StatCard
              label="Missing Costs"
              value={isLoading ? "..." : formatNumber(preview?.summary.totalRows ?? 0)}
              note="Rows detected in selected period"
              icon={AlertTriangle}
              tone="amber"
            />
            <StatCard
              label="Has Item Cost"
              value={isLoading ? "..." : formatNumber(preview?.summary.repairableRows ?? 0)}
              note="Inventory item has cost"
              icon={Wrench}
              tone="green"
            />
            <StatCard
              label="Needs Item Cost"
              value={isLoading ? "..." : formatNumber(preview?.summary.needsItemCostRows ?? 0)}
              note="Set item cost first"
              icon={AlertTriangle}
              tone="rose"
            />
            <StatCard
              label="Estimated Cost"
              value={isLoading ? "..." : formatCurrency(preview?.summary.estimatedRepairValue ?? 0)}
              note="Estimated COGS restored"
              icon={ShieldCheck}
              tone="blue"
            />
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Period: {preview?.period.from ? formatDateTime(preview.period.from) : payload.from ? formatDateTime(payload.from) : "All available"} → {preview?.period.to ? formatDateTime(preview.period.to) : payload.to ? formatDateTime(payload.to) : "Now"}. Update inventory item costs for rows marked "Needs item cost", then rerun the report.
          </div>

          <DataTable
            columns={columns}
            data={preview?.rows ?? []}
            getRowKey={(row) => row.movementId}
            minWidth={1080}
            emptyMessage={isLoading ? "Loading cost quality preview..." : "No missing inventory cost rows found for this period."}
          />

          {needsItemCostRows.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {formatNumber(needsItemCostRows.length)} row(s) need inventory item cost set above zero. Update the item cost in the inventory table, then refresh this preview.
            </div>
          )}
        </div>
      </DashboardPanel>
    </div>
  );
}
