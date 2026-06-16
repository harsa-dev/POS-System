"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, FileInput, FileText, ListFilter, MessageSquareText, RefreshCw, Send, TimerReset, WalletCards, XCircle } from "lucide-react";

import { invoiceApi, type InvoiceBackendStatus, type InvoiceOverdueSampleDto, type InvoiceSummaryDto } from "@/lib/api/invoice-api";
import { formatCurrency } from "@/features/shared/format";
import { StatCard } from "@/features/shared/cards";
import { DashboardActionButton, DashboardActions, DashboardPanel } from "@/features/shared/dashboard";
import {
  INVOICE_GENERATOR_FILTER_HISTORY_EVENT,
  INVOICE_GENERATOR_LOAD_INVOICE_EVENT,
  INVOICE_GENERATOR_OPEN_FOLLOW_UP_EVENT,
  INVOICE_GENERATOR_REFRESH_SUMMARY_EVENT,
  type InvoiceGeneratorFilterHistoryEventDetail,
  type InvoiceGeneratorLoadInvoiceEventDetail,
  type InvoiceGeneratorOpenFollowUpEventDetail,
} from "./invoice-generator-events";

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

function formatDate(value: string | null | undefined) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function showOverdueInHistory() {
  const detail: InvoiceGeneratorFilterHistoryEventDetail = {
    overdue: true,
    status: "ALL",
    message: "Showing overdue open invoices from backend history.",
  };
  window.dispatchEvent(new CustomEvent(INVOICE_GENERATOR_FILTER_HISTORY_EVENT, { detail }));
  document.getElementById("invoice-history-operations")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function loadSampleToEditor(invoice: InvoiceOverdueSampleDto) {
  const detail: InvoiceGeneratorLoadInvoiceEventDetail = {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
  };
  window.dispatchEvent(new CustomEvent(INVOICE_GENERATOR_LOAD_INVOICE_EVENT, { detail }));
  document.getElementById("invoice-generator-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openSampleFollowUp(invoice: InvoiceOverdueSampleDto) {
  const detail: InvoiceGeneratorOpenFollowUpEventDetail = {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
  };
  window.dispatchEvent(new CustomEvent(INVOICE_GENERATOR_OPEN_FOLLOW_UP_EVENT, { detail }));
  document.getElementById("invoice-follow-up-tracker")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function InvoiceSummaryPanel({ reloadSignal = 0 }: InvoiceSummaryPanelProps) {
  const [summary, setSummary] = useState<InvoiceSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const buckets = useMemo(() => buildBucketMap(summary), [summary]);
  const agingBuckets = summary?.aging.buckets ?? [];
  const overdueSamples = summary?.aging.samples ?? [];
  const hasOverdue = (summary?.aging.overdueCount ?? 0) > 0;

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

  useEffect(() => {
    function handleRefreshSummary() {
      void loadSummary();
    }

    window.addEventListener(INVOICE_GENERATOR_REFRESH_SUMMARY_EVENT, handleRefreshSummary);
    return () => window.removeEventListener(INVOICE_GENERATOR_REFRESH_SUMMARY_EVENT, handleRefreshSummary);
  }, []);

  const lastUpdated = summary?.lastUpdatedAt ? new Date(summary.lastUpdatedAt).toLocaleString("id-ID") : "No invoices yet";
  const agingAsOf = summary?.aging.asOf ? new Date(summary.aging.asOf).toLocaleString("id-ID") : "Not calculated";

  return (
    <DashboardPanel
      title="Invoice Lifecycle Summary"
      description="Backend-backed status totals, receivables, and overdue aging for the current business. Finally, unpaid invoices can no longer hide politely."
      actions={
        <DashboardActions>
          <DashboardActionButton icon={ListFilter} onClick={showOverdueInHistory} disabled={!hasOverdue}>
            Show Overdue
          </DashboardActionButton>
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
            description={`${formatCurrency(summary?.totals.currentReceivable ?? 0)} current, ${formatCurrency(summary?.totals.overdueValue ?? 0)} overdue`}
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
            icon={AlertTriangle}
            label="Overdue Receivable"
            value={formatCurrency(summary?.aging.overdueValue ?? 0)}
            description={`${summary?.aging.overdueCount ?? 0} overdue invoice(s)`}
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
            <p className="mt-1 text-xs text-neutral-500">
              {summary?.aging.draftOverdueCount ?? 0} overdue, {formatCurrency(summary?.aging.draftOverdueValue ?? 0)}
            </p>
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
            <p className="mt-1 text-xs text-blue-600">
              {summary?.aging.sentOverdueCount ?? 0} overdue, {formatCurrency(summary?.aging.sentOverdueValue ?? 0)}
            </p>
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
              <XCircle className="h-5 w-5 text-rose-600" />
            </div>
            <p className="mt-3 text-sm font-semibold text-rose-700">{formatCurrency(buckets.CANCELLED.total)}</p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-950">Receivable Aging</p>
              <p className="text-xs text-amber-700">
                Overdue open invoices as of {agingAsOf}. Oldest overdue: {summary?.aging.oldestOverdueDays ?? 0} day(s).
              </p>
            </div>
            <TimerReset className="h-5 w-5 text-amber-700" />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {agingBuckets.map((bucket) => (
              <div key={bucket.id} className="rounded-lg border border-amber-200 bg-white/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">{bucket.label}</p>
                <p className="mt-1 text-xl font-bold text-amber-950">{bucket.count}</p>
                <p className="text-sm font-semibold text-amber-800">{formatCurrency(bucket.total)}</p>
              </div>
            ))}
          </div>

          {overdueSamples.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-lg border border-amber-200 bg-white">
              <table className="min-w-full divide-y divide-amber-100 text-sm">
                <thead className="bg-amber-100/70 text-left text-xs font-semibold uppercase tracking-wide text-amber-800">
                  <tr>
                    <th className="px-3 py-2">Invoice</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Due Date</th>
                    <th className="px-3 py-2">Overdue</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {overdueSamples.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-3 py-2 font-semibold text-neutral-900">{invoice.invoiceNumber}</td>
                      <td className="px-3 py-2 text-neutral-700">{invoice.customerName}</td>
                      <td className="px-3 py-2 text-neutral-700">{formatDate(invoice.dueDate)}</td>
                      <td className="px-3 py-2 text-rose-700">{invoice.daysOverdue} day(s)</td>
                      <td className="px-3 py-2 text-right font-semibold text-neutral-900">{formatCurrency(invoice.grandTotal)}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={showOverdueInHistory}
                            className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                          >
                            <ListFilter className="h-3.5 w-3.5" />
                            History
                          </button>
                          <button
                            type="button"
                            onClick={() => openSampleFollowUp(invoice)}
                            className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            <MessageSquareText className="h-3.5 w-3.5" />
                            Follow Up
                          </button>
                          <button
                            type="button"
                            onClick={() => loadSampleToEditor(invoice)}
                            className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            <FileInput className="h-3.5 w-3.5" />
                            Load
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
              No overdue open invoices in the current summary scope.
            </p>
          )}
        </div>

        <p className="text-xs text-neutral-500">Last invoice activity: {lastUpdated}</p>
      </div>
    </DashboardPanel>
  );
}
