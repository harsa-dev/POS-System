"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
} from "@/features/shared/dashboard";
import { formatCurrency } from "@/features/shared/format";
import { getApiErrorMessage } from "@/lib/api/api-client";
import {
  cashflowApi,
  type CashflowCapabilitiesDto,
  type CashflowSyncOrderSourceDto,
  type CashflowSyncShiftSourceDto,
  type CashflowSyncSourceKind,
  type CashflowSyncSourcesDto,
} from "@/lib/api/cashflow-api";

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

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getOrderLabel(order: CashflowSyncOrderSourceDto) {
  return `Order #${order.orderNumber} · ${formatCurrency(order.total)}`;
}

function getShiftLabel(shift: CashflowSyncShiftSourceDto) {
  return `${shift.cashierName ?? "Closed shift"} · ${formatCurrency(shift.cashDifference ?? 0)}`;
}

export function CashflowSourceSyncPanel({ onSynced }: CashflowSourceSyncPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sourceKind, setSourceKind] = useState<CashflowSyncSourceKind>("ORDER");
  const [sourceId, setSourceId] = useState("");
  const [capabilities, setCapabilities] = useState<CashflowCapabilitiesDto | null>(null);
  const [syncSources, setSyncSources] = useState<CashflowSyncSourcesDto | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const selectedSource = syncSourceOptions.find((option) => option.value === sourceKind);
  const canSync = capabilities?.canSync ?? false;
  const guardMessage = capabilities
    ? capabilities.plannedReason ??
      (!capabilities.canSync
        ? "Your role can view cashflow, but cannot sync operational sources."
        : null)
    : null;

  const sourceCandidates = useMemo(() => {
    if (!syncSources) return [];
    return sourceKind === "ORDER" ? syncSources.unsyncedOrders : syncSources.unsyncedShifts;
  }, [sourceKind, syncSources]);

  const loadSyncContext = useCallback(async () => {
    setIsLoadingContext(true);
    setSyncError(null);

    try {
      const capabilityResponse = await cashflowApi.getCapabilities();
      setCapabilities(capabilityResponse.data);

      if (!capabilityResponse.data.canSync) {
        setSyncSources(null);
        return;
      }

      const sourceResponse = await cashflowApi.getSyncSources(12);
      setSyncSources(sourceResponse.data);
    } catch (error) {
      setSyncError(getApiErrorMessage(error, "Failed to load sync source candidates."));
    } finally {
      setIsLoadingContext(false);
    }
  }, []);

  useEffect(() => {
    void loadSyncContext();
  }, [loadSyncContext]);

  async function handleSyncSource() {
    const trimmedSourceId = sourceId.trim();

    setSyncError(null);
    setSyncMessage(null);

    if (!canSync) {
      setSyncError(guardMessage ?? "Cashflow source sync is not available for this user or mode.");
      return;
    }

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
      await loadSyncContext();
      await onSynced?.();
    } catch (error) {
      setSyncError(getApiErrorMessage(error, "Failed to sync source into cashflow ledger."));
    } finally {
      setIsSyncing(false);
    }
  }

  function handleCandidateSelect(value: string) {
    setSourceId(value);
    setSyncError(null);
    setSyncMessage(null);
  }

  function renderCandidateList() {
    if (!canSync) return null;

    if (isLoadingContext) {
      return <p className="text-sm text-neutral-500">Loading eligible sync sources...</p>;
    }

    if (sourceCandidates.length === 0) {
      return (
        <p className="text-sm text-neutral-500">
          No eligible {sourceKind === "ORDER" ? "paid orders" : "closed shifts"} found. You can still paste a
          source ID manually if you know one exists.
        </p>
      );
    }

    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Eligible unsynced sources
        </p>
        <div className="grid gap-2">
          {sourceCandidates.slice(0, 5).map((candidate) => {
            const label = sourceKind === "ORDER"
              ? getOrderLabel(candidate as CashflowSyncOrderSourceDto)
              : getShiftLabel(candidate as CashflowSyncShiftSourceDto);
            const note = sourceKind === "ORDER"
              ? `Paid at ${formatDateTime((candidate as CashflowSyncOrderSourceDto).paidAt ?? (candidate as CashflowSyncOrderSourceDto).createdAt)}`
              : `Closed at ${formatDateTime((candidate as CashflowSyncShiftSourceDto).closedAt)}`;

            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => handleCandidateSelect(candidate.id)}
                className={`rounded-xl border px-3 py-2 text-left transition hover:bg-neutral-50 ${
                  sourceId === candidate.id ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"
                }`}
              >
                <span className="block text-sm font-semibold text-neutral-800">{label}</span>
                <span className="block text-xs font-medium text-neutral-500">{note}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
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
            Use backend-picked eligible sources first. Manual ID input stays as an escape hatch, not the main workflow.
          </p>
        </div>
        <DashboardActions>
          <DashboardActionButton
            icon={RefreshCw}
            onClick={() => {
              setSyncError(null);
              setSyncMessage(null);
              setIsOpen((current) => !current);
              if (!isOpen) void loadSyncContext();
            }}
            disabled={isSyncing}
          >
            {isOpen ? "Close Sync" : "Sync Source"}
          </DashboardActionButton>
        </DashboardActions>
      </div>

      {guardMessage && (
        <div className="border-t border-amber-100 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          {guardMessage}
        </div>
      )}

      {isOpen && (
        <div className="grid gap-4 border-t border-neutral-200 p-4">
          <div className="grid gap-4 lg:grid-cols-[220px_1fr_auto] lg:items-end">
            <label className="space-y-2 text-sm font-semibold text-neutral-700">
              Source Type
              <select
                value={sourceKind}
                onChange={(event) => {
                  setSourceKind(event.target.value as CashflowSyncSourceKind);
                  setSourceId("");
                  setSyncError(null);
                  setSyncMessage(null);
                }}
                disabled={!canSync || isSyncing}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 outline-none transition focus:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
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
                onChange={(event) => handleCandidateSelect(event.target.value)}
                placeholder={sourceKind === "ORDER" ? "Order ID" : "Shift ID"}
                disabled={!canSync || isSyncing}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-800 outline-none transition focus:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <span className="block text-xs font-medium text-neutral-500">
                {selectedSource?.helper}
              </span>
            </label>

            <button
              type="button"
              disabled={!canSync || isSyncing}
              onClick={() => void handleSyncSource()}
              className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSyncing ? "Syncing..." : "Sync"}
            </button>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            {renderCandidateList()}
          </div>

          <button
            type="button"
            onClick={() => void loadSyncContext()}
            disabled={isLoadingContext || isSyncing}
            className="w-fit rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoadingContext ? "Refreshing sources..." : "Refresh candidates"}
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
