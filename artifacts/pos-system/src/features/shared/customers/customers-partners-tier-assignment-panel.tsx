"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Sparkles, Wand2 } from "lucide-react";

import { DashboardActionButton, DashboardPanel } from "@/features/shared/dashboard";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import {
  customersPartnersApi,
  type TierAssignmentPreviewDto,
  type TierAssignmentRowDto,
} from "@/lib/api/customers-partners-api";

type CustomersPartnersTierAssignmentPanelProps = {
  reloadSignal?: number;
  onAssigned?: () => void;
};

function getApiErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function TierBadge({ row }: { row: TierAssignmentRowDto }) {
  if (!row.assignedTierName) {
    return (
      <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-600">
        Unassigned
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-950 px-2 py-1 text-xs font-semibold text-white">
      {row.assignedTierIcon ? <span>{row.assignedTierIcon}</span> : null}
      {row.assignedTierName}
      {row.assignedDiscount ? <span className="text-neutral-300">· {row.assignedDiscount}</span> : null}
    </span>
  );
}

export function CustomersPartnersTierAssignmentPanel({
  reloadSignal = 0,
  onAssigned,
}: CustomersPartnersTierAssignmentPanelProps) {
  const [preview, setPreview] = useState<TierAssignmentPreviewDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const changedRows = useMemo(
    () => preview?.rows.filter((row) => row.changed).slice(0, 8) ?? [],
    [preview?.rows],
  );

  async function loadPreview() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await customersPartnersApi.getTierAssignments();
      setPreview(response.data);
    } catch (loadError) {
      setPreview(null);
      setError(getApiErrorMessage(loadError, "Failed to load customer tier assignment preview."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPreview();
  }, [reloadSignal]);

  async function handleAssign() {
    setIsAssigning(true);
    setError(null);
    setMessage(null);

    try {
      const response = await customersPartnersApi.assignTiers();
      setPreview({
        generatedAt: response.data.assignedAt,
        summary: response.data.summary,
        rows: response.data.rows,
      });
      setMessage(
        `${formatNumber(response.data.summary.assignedCount)} customers assigned. ${formatNumber(response.data.summary.changedCount)} changed.`,
      );
      onAssigned?.();
    } catch (assignError) {
      setError(getApiErrorMessage(assignError, "Failed to assign customer tiers."));
    } finally {
      setIsAssigning(false);
    }
  }

  const summary = preview?.summary;

  return (
    <DashboardPanel
      title="Assign Customer Tiers"
      description="Preview and assign loyalty tiers from backend spending totals. Tiers finally attach to customers, a shocking use for loyalty tiers."
    >
      <div className="space-y-4 p-4">
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
            {message}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {isLoading
              ? "Loading assignment preview..."
              : `${formatNumber(summary?.customerCount ?? 0)} customers evaluated`}
          </div>
          <div className="flex flex-wrap gap-2">
            <DashboardActionButton icon={RefreshCw} disabled={isLoading || isAssigning} onClick={() => void loadPreview()}>
              Refresh
            </DashboardActionButton>
            <DashboardActionButton
              icon={Wand2}
              variant="primary"
              disabled={isLoading || isAssigning || !summary?.customerCount}
              onClick={() => void handleAssign()}
            >
              {isAssigning ? "Assigning..." : "Assign Tiers"}
            </DashboardActionButton>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-neutral-500">Assigned</p>
            <p className="mt-2 text-2xl font-bold text-neutral-950">{formatNumber(summary?.assignedCount ?? 0)}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-neutral-500">Unassigned</p>
            <p className="mt-2 text-2xl font-bold text-neutral-950">{formatNumber(summary?.unassignedCount ?? 0)}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-neutral-500">Would Change</p>
            <p className="mt-2 text-2xl font-bold text-neutral-950">{formatNumber(summary?.changedCount ?? 0)}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-neutral-500">Last Preview</p>
            <p className="mt-2 text-sm font-semibold text-neutral-950">
              {preview?.generatedAt ? new Date(preview.generatedAt).toLocaleString() : "Not loaded"}
            </p>
          </div>
        </div>

        {summary ? (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-sm font-semibold text-neutral-950">Tier distribution</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(summary.byTier).map(([tier, count]) => (
                <span key={tier} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200">
                  {tier}: {formatNumber(count)}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-4 py-3">
            <p className="text-sm font-semibold text-neutral-950">Changed customers preview</p>
            <p className="mt-1 text-xs text-neutral-500">Showing up to 8 customers whose assigned tier differs from the current saved tier.</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {changedRows.length ? changedRows.map((row) => (
              <div key={row.customerId} className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_160px_180px] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-neutral-950">{row.customerName}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {formatCurrency(row.totalSpending)} · {formatNumber(row.transactions)} transactions
                  </p>
                </div>
                <div className="text-xs text-neutral-500">
                  Current: {row.currentTierName ?? "Unassigned"}
                </div>
                <div className="text-left md:text-right">
                  <TierBadge row={row} />
                </div>
              </div>
            )) : (
              <div className="px-4 py-6 text-sm text-neutral-500">
                {isLoading ? "Loading changed customers..." : "No tier changes in the current preview."}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}
