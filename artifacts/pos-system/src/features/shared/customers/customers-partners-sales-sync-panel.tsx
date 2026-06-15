"use client";

import { useEffect, useState } from "react";
import { RefreshCw, UploadCloud } from "lucide-react";

import { DashboardActionButton, DashboardPanel } from "@/features/shared/dashboard";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import {
  customersPartnersApi,
  type SalesSyncCustomerCandidateDto,
  type SalesSyncResultDto,
} from "@/lib/api/customers-partners-api";

type CustomersPartnersSalesSyncPanelProps = {
  reloadSignal?: number;
  onSynced?: (result: SalesSyncResultDto) => void;
};

function getApiErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function CustomersPartnersSalesSyncPanel({
  reloadSignal = 0,
  onSynced,
}: CustomersPartnersSalesSyncPanelProps) {
  const [candidates, setCandidates] = useState<SalesSyncCustomerCandidateDto[]>([]);
  const [candidateCount, setCandidateCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadPreview() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await customersPartnersApi.getSalesSyncPreview({ limit: 6 });
      setCandidates(response.data.candidates);
      setCandidateCount(response.data.candidateCount);
    } catch (loadError) {
      setCandidates([]);
      setCandidateCount(0);
      setError(getApiErrorMessage(loadError, "Failed to load sales sync preview."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadSignal]);

  async function handleSyncFromSales() {
    setIsSyncing(true);
    setMessage(null);
    setError(null);

    try {
      const response = await customersPartnersApi.syncFromSales();
      const result = response.data;
      setMessage(`Synced ${formatNumber(result.created)} new and ${formatNumber(result.updated)} existing customer profiles from paid invoices.`);
      onSynced?.(result);
      await loadPreview();
    } catch (syncError) {
      setError(getApiErrorMessage(syncError, "Failed to sync customers from sales."));
    } finally {
      setIsSyncing(false);
    }
  }

  const disabled = isLoading || isSyncing || candidateCount === 0;

  return (
    <DashboardPanel
      title="Sales Sync"
      description="Create or update customer profiles from paid invoice customer data. Orders and retail sales without customer identity are intentionally ignored. Revolutionary restraint."
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

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Candidates</p>
            <p className="mt-1 text-2xl font-bold text-neutral-950">
              {isLoading ? "..." : formatNumber(candidateCount)}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Source</p>
            <p className="mt-1 text-sm font-semibold text-neutral-950">Paid invoices</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Guard</p>
            <p className="mt-1 text-sm font-semibold text-neutral-950">Management only</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <DashboardActionButton
            icon={RefreshCw}
            disabled={isLoading || isSyncing}
            onClick={() => void loadPreview()}
          >
            Refresh Preview
          </DashboardActionButton>
          <DashboardActionButton
            icon={UploadCloud}
            variant="primary"
            disabled={disabled}
            title={candidateCount > 0 ? "Sync paid invoice customers" : "No paid invoice customer candidates found"}
            onClick={() => void handleSyncFromSales()}
          >
            {isSyncing ? "Syncing..." : "Sync From Sales"}
          </DashboardActionButton>
        </div>

        <div className="rounded-lg border border-neutral-200">
          <div className="border-b border-neutral-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Preview
          </div>
          {isLoading ? (
            <div className="p-3 text-sm text-neutral-500">Loading candidates...</div>
          ) : candidates.length === 0 ? (
            <div className="p-3 text-sm text-neutral-500">
              No paid invoice customer candidates found yet. Create paid invoices with customer names first, because syncing anonymous money into CRM is how dashboards become fiction.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {candidates.map((candidate) => (
                <article key={candidate.identityKey} className="p-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-neutral-950">{candidate.name}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {candidate.phone ?? "No phone"} · {candidate.address ?? "No address"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-neutral-950">{formatCurrency(candidate.totalSpending)}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {formatNumber(candidate.transactions)} paid invoices
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardPanel>
  );
}
