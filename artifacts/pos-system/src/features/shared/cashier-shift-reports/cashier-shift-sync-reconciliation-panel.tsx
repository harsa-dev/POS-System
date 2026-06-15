"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, ShieldAlert, WalletCards } from "lucide-react";

import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
  StatCard,
  StatusPill,
} from "@/features/shared/dashboard";
import { formatCurrency, formatNumber } from "@/features/shared/utils";
import { cashflowApi } from "@/lib/api/cashflow-api";
import { getApiErrorMessage } from "@/lib/api/api-client";
import {
  shiftsApi,
  type CashierShiftReconciliationDto,
  type CashierShiftReconciliationRowDto,
  type CashierShiftSyncState,
} from "@/lib/api/shifts-api";

type CashierShiftSyncReconciliationPanelProps = {
  onSynced?: () => void | Promise<void>;
};

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getSyncTone(syncState: CashierShiftSyncState) {
  if (syncState === "SYNCED") return "green";
  if (syncState === "READY_TO_SYNC") return "blue";
  if (syncState === "NEEDS_REVIEW") return "amber";
  return "slate";
}

function getSyncLabel(syncState: CashierShiftSyncState) {
  if (syncState === "SYNCED") return "Synced";
  if (syncState === "READY_TO_SYNC") return "Ready To Sync";
  if (syncState === "NEEDS_REVIEW") return "Needs Review";
  return "Open Shift";
}

function isSyncEligible(row: CashierShiftReconciliationRowDto) {
  return row.syncState === "READY_TO_SYNC" || row.syncState === "NEEDS_REVIEW";
}

export function CashierShiftSyncReconciliationPanel({
  onSynced,
}: CashierShiftSyncReconciliationPanelProps) {
  const [reconciliation, setReconciliation] = useState<CashierShiftReconciliationDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncingShiftId, setSyncingShiftId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReconciliation = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await shiftsApi.getReconciliation({ limit: 100 });
      if (!response.success || !response.data) {
        setErrorMessage(response.message ?? "Failed to load cashier shift sync reconciliation.");
        return;
      }

      setReconciliation(response.data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to load cashier shift sync reconciliation."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReconciliation();
  }, [loadReconciliation]);

  const actionableRows = useMemo(
    () => reconciliation?.rows.filter(isSyncEligible) ?? [],
    [reconciliation?.rows],
  );

  async function handleSync(row: CashierShiftReconciliationRowDto) {
    if (!isSyncEligible(row)) return;

    setSyncingShiftId(row.shiftId);
    setMessage(null);
    setErrorMessage(null);

    try {
      await cashflowApi.syncShift(row.shiftId);
      setMessage(`Shift ${row.shiftId.slice(0, 8)} synced to cashflow.`);
      await loadReconciliation();
      await onSynced?.();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to sync shift to cashflow."));
    } finally {
      setSyncingShiftId(null);
    }
  }

  const summary = reconciliation?.summary;

  return (
    <DashboardPanel
      title="Shift Sync Reconciliation"
      description="Reconcile closed cashier shifts against Cashflow sync status before reports are treated as final. Sync failures are not persisted yet, so cash variance rows are marked as Needs Review rather than fake failed logs. Revolutionary: not inventing data."
    >
      <div className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={CheckCircle2}
            label="Synced"
            value={formatNumber(summary?.syncedCount ?? 0)}
            tone="green"
          />
          <StatCard
            icon={WalletCards}
            label="Ready To Sync"
            value={formatNumber(summary?.readyToSyncCount ?? 0)}
            tone="blue"
          />
          <StatCard
            icon={ShieldAlert}
            label="Needs Review"
            value={formatNumber(summary?.needsReviewCount ?? 0)}
            helperText="Closed unsynced shifts with cash variance."
            tone="amber"
          />
          <StatCard
            icon={Clock3}
            label="Open / Blocked"
            value={formatNumber(summary?.blockedOpenCount ?? 0)}
            helperText="Close shift before cashflow sync."
            tone="slate"
          />
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1 text-sm text-neutral-600">
            <p className="font-semibold text-neutral-950">Cashflow Sync Health</p>
            <p>
              Unsynced closed shifts: {formatNumber(summary?.unsyncedClosedCount ?? 0)} · Absolute cash variance: {formatCurrency(summary?.absoluteCashVariance ?? 0)}
            </p>
            {message && <p className="text-blue-700">{message}</p>}
            {errorMessage && <p className="text-rose-700">{errorMessage}</p>}
          </div>
          <DashboardActions>
            <DashboardActionButton
              icon={RefreshCw}
              onClick={() => void loadReconciliation()}
              disabled={isLoading || Boolean(syncingShiftId)}
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </DashboardActionButton>
          </DashboardActions>
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="min-w-[1040px] divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Shift</th>
                <th className="px-4 py-3">Cashier</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sales</th>
                <th className="px-4 py-3">Cash Difference</th>
                <th className="px-4 py-3">Recommended Action</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    Loading shift sync reconciliation...
                  </td>
                </tr>
              ) : reconciliation && reconciliation.rows.length > 0 ? (
                reconciliation.rows.map((row) => (
                  <tr key={row.shiftId}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-neutral-950">{row.shiftId.slice(0, 8)}</div>
                      <div className="text-xs text-neutral-500">
                        {formatDateTime(row.openedAt)} → {formatDateTime(row.closedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900">{row.cashierName}</div>
                      <div className="text-xs text-neutral-500">{row.cashierEmail ?? "No email"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <StatusPill tone={getSyncTone(row.syncState)}>{getSyncLabel(row.syncState)}</StatusPill>
                        <div className="text-xs text-neutral-500">Shift: {row.status}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900">{formatCurrency(row.totalSales)}</div>
                      <div className="text-xs text-neutral-500">
                        {formatNumber(row.transactionCount)} tx · Cash {formatCurrency(row.cashSales)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900">{formatCurrency(row.cashDifference)}</div>
                      <div className="text-xs text-neutral-500">{row.cashStatus}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{row.recommendedAction}</td>
                    <td className="px-4 py-3 text-right">
                      {isSyncEligible(row) ? (
                        <DashboardActionButton
                          icon={RefreshCw}
                          onClick={() => void handleSync(row)}
                          disabled={Boolean(syncingShiftId)}
                        >
                          {syncingShiftId === row.shiftId ? "Syncing..." : "Sync"}
                        </DashboardActionButton>
                      ) : row.syncState === "BLOCKED_OPEN" ? (
                        <StatusPill tone="slate">Close First</StatusPill>
                      ) : (
                        <StatusPill tone="green">Done</StatusPill>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    No cashier shifts found for reconciliation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {actionableRows.length > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              {formatNumber(actionableRows.length)} closed shift(s) can still affect Cashflow. Review cash variance rows before syncing if the difference is not expected.
            </p>
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}
