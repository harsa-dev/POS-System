"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
} from "@/features/shared/dashboard";
import { getApiErrorMessage } from "@/lib/api/api-client";
import { cashflowApi } from "@/lib/api/cashflow-api";

type CashflowSyncSourceKind = "ORDER" | "SHIFT";

type CashflowSourceSyncPanelProps = {
  onSynced?: () => void | Promise<void>;
};

const syncSourceOptions: Array<{ value: CashflowSyncSourceKind; label: string; helper: string }> = [
  {
    value: "ORDER",
    label: "Paid Order",
    helper: "Sync a paid order payment into the cashflow ledger.",
  },
  {
    value: "SHIFT",
    label: "Closed Shift",
    helper: "Sync a closed cashier shift difference into the cashflow ledger.",
  },
];

export function CashflowSourceSyncPanel({ onSynced }: CashflowSourceSyncPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sourceKind, setSourceKind] = useState<CashflowSyncSourceKind>("ORDER");
  const [sourceId, setSourceId] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const selectedSource = syncSourceOptions.find((option) => option.value === sourceKind);

  async function handleSyncSource() {
    const trimmedSourceId = sourceId.trim();

    setSyncError(null);
    setSyncMessage(null);

    if (!trimmedSourceId) {
      setSyncError("Source ID is required before syncing.");
      return;
    }

    setIsSyncing(true);

    try {
      const response =
        sourceKind === "ORDER"
          ? await cashflowApi.syncOrder(trimmedSourceId)
          : await cashflowApi.syncShift(trimmedSourceId);

      setSourceId("");
      setSyncMessage(
        `${selectedSource?.label ?? sourceKind} synced into cashflow ledger · entry ${response.data.id}`,
      );
      await onSynced?.();
    } catch (error) {
      setSyncError(getApiErrorMessage(error, "Failed to sync source into cashflow ledger."));
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <DashboardPanel
      title="Source Sync"
      description="Sync existing paid orders or closed shifts into the backend cashflow ledger without creating manual duplicate rows."
    >
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-neutral-800">
            Bring operational sources into cashflow.
          </p>
          <p className="text-sm text-neutral-500">
            Use this for source-backed ledger rows only. Manual records still belong in Add Entry.
          </p>
        </div>
        <DashboardActions>
          <DashboardActionButton
            icon={RefreshCw}
            onClick={() => {
              setSyncError(null);
              setSyncMessage(null);
              setIsOpen((current) => !current);
            }}
            disabled={isSyncing}
          >
            {isOpen ? "Close Sync" : "Sync Source"}
          </DashboardActionButton>
        </DashboardActions>
      </div>

      {isOpen && (
        <div className="grid gap-4 border-t border-neutral-200 p-4 lg:grid-cols-[220px_1fr_auto] lg:items-end">
          <label className="space-y-2 text-sm font-semibold text-neutral-700">
            Source Type
            <select
              value={sourceKind}
              onChange={(event) => setSourceKind(event.target.value as CashflowSyncSourceKind)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 outline-none transition focus:border-neutral-400"
            >
              {syncSourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-neutral-700">
            Source ID
            <input
              value={sourceId}
              onChange={(event) => setSourceId(event.target.value)}
              placeholder={sourceKind === "ORDER" ? "Order ID" : "Shift ID"}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-800 outline-none transition focus:border-neutral-400"
            />
            <span className="block text-xs font-medium text-neutral-500">
              {selectedSource?.helper}
            </span>
          </label>

          <button
            type="button"
            disabled={isSyncing}
            onClick={() => void handleSyncSource()}
            className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSyncing ? "Syncing..." : "Sync"}
          </button>
        </div>
      )}

      {(syncError || syncMessage) && (
        <div
          className={`border-t p-4 text-sm font-semibold ${
            syncError
              ? "border-rose-100 bg-rose-50 text-rose-700"
              : "border-emerald-100 bg-emerald-50 text-emerald-700"
          }`}
        >
          {syncError ?? syncMessage}
        </div>
      )}
    </DashboardPanel>
  );
}
