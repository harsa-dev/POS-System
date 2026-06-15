"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, FileText, RefreshCw, Send, WalletCards, XCircle } from "lucide-react";

import { invoiceApi, type InvoiceBackendStatus, type InvoiceSummaryDto } from "@/lib/api/invoice-api";
import { formatCurrency } from "@/features/shared/format";
import { DashboardActionButton, DashboardActions, DashboardPanel, StatCard } from "@/features/shared/dashboard";

type InvoiceSummaryPanelProps = {
  reloadSignal?: number;
};

type SummaryBucketMap = Record<InvoiceBackendStatus, { count: number; total: number }>;

const EMPTY_BUCKETS: SummaryBucketMap = {
  DRAFT: { count: 0, total: 0 },
  SENT: { count: 0, total: 0 },
  PAID: { count: 0, total: 0 },
  CANCELLED: { count: 0, total: 0 },
};

function buildBucketMap(summary: InvoiceSummaryDto | null): SummaryBucketMap {
  if (!summary) return EMPTY_BUCKETS;

  return summary.buckets.reduce<SummaryBucketMap>((acc, bucket) => {
    acc[bucket.status] = { count: bucket.count, total: bucket.total };
    return acc;
  }, { ...EMPTY_BUCKETS });
}

export function InvoiceSummaryPanel({ reloadSignal = 0 }: InvoiceSummaryPanelProps) {
  const [summary, setSummary] = useState<InvoiceSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const buckets = useMemo(() => buildBucketMap(summary), [summary]);

  async function loadSummary() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await invoiceApi.getSummary();
      if (!response.success || !response.data) {
        setErrorMessage(response.message ?? "Failed to load invoice summary.");
        return;
      }
      setSummary(response.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load invoice summary.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSummary();
  }, [reloadSignal]);

  const lastUpdated = summary?.lastUpdatedAt ? new Date(summary.lastUpdatedAt).toLocaleString("id-ID") : "No invoices yet";

  return (
    <DashboardPanel
      title="Invoice Lifecycle Summary"
      description="Backend-backed status totals for the current business. Use this before drowning yourself in table rows."
      actions={
        <DashboardActions>
          <DashboardActionButton icon={RefreshCw} onClick={() => void loadSummary()} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </DashboardActionButton>
        </DashboardActions>
      }
    >
      <div className="space-y-4 p-4">
        {errorMessage && <p className="text-sm font-medium text-rose-700">{errorMessage}</p>}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={FileText}
            label="Total Invoices"
            value={String(summary?.totals.totalCount ?? 0)}
            description={`${formatCurrency(summary?.totals.totalValue ?? 0)} total value`}
            tone="slate"
          />
          <StatCard
            icon={WalletCards}
            label="Receivable"
            value={formatCurrency(summary?.totals.receivable ?? 0)}
            description="Draft + sent invoices"
            tone="amber"
          />
          <StatCard
            icon={CheckCircle2}
            label="Paid Revenue"
            value={formatCurrency(summary?.totals.paidRevenue ?? 0)}
            description={`${buckets.PAID.count} paid invoice(s)`}
            tone="green"
          />
          <StatCard
            icon={XCircle}
            label="Cancelled Value"
            value={formatCurrency(summary?.totals.cancelledValue ?? 0)}
            description={`${buckets.CANCELLED.count} cancelled invoice(s)`}
            tone="rose"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Draft</p>
                <p className="mt-1 text-2xl font-bold text-neutral-950">{buckets.DRAFT.count}</p>
              </div>
              <Clock3 className="h-5 w-5 text-neutral-500" />
            </div>
            <p className="mt-3 text-sm font-semibold text-neutral-700">{formatCurrency(buckets.DRAFT.total)}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Sent</p>
                <p className="mt-1 text-2xl font-bold text-blue-900">{buckets.SENT.count}</p>
              </div>
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            <p className="mt-3 text-sm font-semibold text-blue-700">{formatCurrency(buckets.SENT.total)}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Paid</p>
                <p className="mt-1 text-2xl font-bold text-emerald-900">{buckets.PAID.count}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="mt-3 text-sm font-semibold text-emerald-700">{formatCurrency(buckets.PAID.total)}</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Cancelled</p>
                <p className="mt-1 text-2xl font-bold text-rose-900">{buckets.CANCELLED.count}</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <p className="mt-3 text-sm font-semibold text-rose-700">{formatCurrency(buckets.CANCELLED.total)}</p>
          </div>
        </div>

        <p className="text-xs text-neutral-500">Last invoice activity: {lastUpdated}</p>
      </div>
    </DashboardPanel>
  );
}
