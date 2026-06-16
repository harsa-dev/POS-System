"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Download,
  FileInput,
  FileText,
  ListFilter,
  RefreshCw,
} from "lucide-react";

import {
  invoiceFollowUpAnalyticsApi,
  type InvoiceFollowUpAnalyticsActivityDto,
  type InvoiceFollowUpAnalyticsDto,
} from "@/lib/api/invoice-follow-up-analytics-api";
import { formatCurrency } from "@/features/shared/format";
import { StatCard } from "@/features/shared/cards";
import { DashboardActionButton, DashboardActions, DashboardPanel } from "@/features/shared/dashboard";
import {
  INVOICE_GENERATOR_FILTER_FOLLOW_UP_EVENT,
  INVOICE_GENERATOR_LOAD_INVOICE_EVENT,
  INVOICE_GENERATOR_OPEN_FOLLOW_UP_EVENT,
  INVOICE_GENERATOR_REFRESH_SUMMARY_EVENT,
  type InvoiceGeneratorFilterFollowUpEventDetail,
  type InvoiceGeneratorLoadInvoiceEventDetail,
  type InvoiceGeneratorOpenFollowUpEventDetail,
} from "./invoice-generator-events";

const STATUS_TONES: Record<string, "slate" | "blue" | "amber" | "green" | "rose"> = {
  CONTACTED: "blue",
  WAITING_RESPONSE: "amber",
  PROMISED_PAYMENT: "green",
  RESOLVED: "slate",
  ESCALATED: "rose",
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "No activity";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function downloadJson(payload: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  downloadBlob(blob, filename);
}

function openFollowUp(activity: InvoiceFollowUpAnalyticsActivityDto) {
  const detail: InvoiceGeneratorOpenFollowUpEventDetail = {
    invoiceId: activity.invoiceId,
    invoiceNumber: activity.invoiceNumber,
  };
  window.dispatchEvent(new CustomEvent(INVOICE_GENERATOR_OPEN_FOLLOW_UP_EVENT, { detail }));
  document.getElementById("invoice-follow-up-tracker")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function loadInvoice(activity: InvoiceFollowUpAnalyticsActivityDto) {
  const detail: InvoiceGeneratorLoadInvoiceEventDetail = {
    invoiceId: activity.invoiceId,
    invoiceNumber: activity.invoiceNumber,
  };
  window.dispatchEvent(new CustomEvent(INVOICE_GENERATOR_LOAD_INVOICE_EVENT, { detail }));
  document.getElementById("invoice-generator-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function filterFollowUpStatus(status: InvoiceFollowUpAnalyticsActivityDto["status"], label: string) {
  const detail: InvoiceGeneratorFilterFollowUpEventDetail = {
    status,
    message: `Showing ${label.toLowerCase()} follow-ups from analytics drilldown.`,
  };
  window.dispatchEvent(new CustomEvent(INVOICE_GENERATOR_FILTER_FOLLOW_UP_EVENT, { detail }));
  document.getElementById("invoice-follow-up-tracker")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function InvoiceFollowUpAnalyticsPanel() {
  const [analytics, setAnalytics] = useState<InvoiceFollowUpAnalyticsDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState<"csv" | "json" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await invoiceFollowUpAnalyticsApi.getAnalytics();
      if (!response.success || !response.data) {
        setErrorMessage(response.message ?? "Failed to load follow-up analytics.");
        return;
      }
      setAnalytics(response.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load follow-up analytics.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    function handleRefresh() {
      void loadAnalytics();
    }

    window.addEventListener(INVOICE_GENERATOR_REFRESH_SUMMARY_EVENT, handleRefresh);
    return () => window.removeEventListener(INVOICE_GENERATOR_REFRESH_SUMMARY_EVENT, handleRefresh);
  }, [loadAnalytics]);

  async function handleExportCsv() {
    setIsExporting("csv");
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const download = await invoiceFollowUpAnalyticsApi.downloadCsv();
      downloadBlob(download.blob, download.filename);
      setSuccessMessage(`Exported ${download.rowCount ?? "all"} follow-up rows to CSV.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to export follow-up CSV.");
    } finally {
      setIsExporting(null);
    }
  }

  async function handleExportJson() {
    setIsExporting("json");
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await invoiceFollowUpAnalyticsApi.exportJson();
      if (!response.success || !response.data) {
        setErrorMessage(response.message ?? "Failed to export follow-up JSON.");
        return;
      }
      const filename = `invoice-follow-ups-${new Date().toISOString().slice(0, 10)}.json`;
      downloadJson(response.data, filename);
      setSuccessMessage(`Exported ${response.data.meta.rowCount} follow-up rows to JSON.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to export follow-up JSON.");
    } finally {
      setIsExporting(null);
    }
  }

  const summary = analytics?.summary;
  const statusBuckets = analytics?.statusBuckets ?? [];
  const recentActivity = analytics?.recentActivity ?? [];

  return (
    <div id="invoice-follow-up-analytics">
      <DashboardPanel
        title="Follow-Up Analytics & Export"
        description="Measure follow-up health, status distribution, export the tracker, and drill into the messy parts. Analytics that cannot open the workflow is just decorative anxiety."
        actions={
          <DashboardActions>
            <DashboardActionButton icon={RefreshCw} onClick={() => void loadAnalytics()} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </DashboardActionButton>
            <DashboardActionButton icon={Download} onClick={() => void handleExportCsv()} disabled={Boolean(isExporting)}>
              {isExporting === "csv" ? "Exporting..." : "Export CSV"}
            </DashboardActionButton>
            <DashboardActionButton icon={FileText} onClick={() => void handleExportJson()} disabled={Boolean(isExporting)}>
              {isExporting === "json" ? "Exporting..." : "Export JSON"}
            </DashboardActionButton>
          </DashboardActions>
        }
      >
        <div className="space-y-4 p-4">
          {errorMessage && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
              {successMessage}
            </p>
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={BarChart3}
              label="Tracked Invoices"
              value={String(summary?.trackedInvoicesCount ?? 0)}
              description={`${summary?.totalFollowUps ?? 0} total notes`}
              tone="blue"
            />
            <StatCard
              icon={AlertTriangle}
              label="Unresolved Value"
              value={formatCurrency(summary?.unresolvedValue ?? 0)}
              description={`${summary?.unresolvedCount ?? 0} unresolved invoice(s)`}
              tone="rose"
            />
            <StatCard
              icon={Clock3}
              label="Due Follow-Ups"
              value={String(summary?.dueReminderCount ?? 0)}
              description={formatCurrency(summary?.dueValue ?? 0)}
              tone="amber"
            />
            <StatCard
              icon={CheckCircle2}
              label="Resolved"
              value={String(summary?.resolvedCount ?? 0)}
              description={`Last activity: ${formatDateTime(summary?.lastUpdatedAt)}`}
              tone="green"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {statusBuckets.map((bucket) => (
              <button
                key={bucket.status}
                type="button"
                onClick={() => filterFollowUpStatus(bucket.status, bucket.label)}
                disabled={bucket.count === 0}
                className="rounded-xl border border-neutral-200 bg-white p-3 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                title={bucket.count > 0 ? `Filter tracker by ${bucket.label}` : `No ${bucket.label.toLowerCase()} follow-ups`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{bucket.label}</p>
                  <ListFilter className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
                </div>
                <p className="mt-2 text-2xl font-bold text-neutral-950">{bucket.count}</p>
                <p className="mt-1 text-xs text-neutral-500">{formatCurrency(bucket.invoiceValue)} tracked value</p>
                <div
                  className={`mt-3 h-1.5 rounded-full ${
                    STATUS_TONES[bucket.status] === "rose"
                      ? "bg-rose-200"
                      : STATUS_TONES[bucket.status] === "amber"
                        ? "bg-amber-200"
                        : STATUS_TONES[bucket.status] === "green"
                          ? "bg-emerald-200"
                          : STATUS_TONES[bucket.status] === "blue"
                            ? "bg-blue-200"
                            : "bg-neutral-200"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-100 bg-neutral-50 px-3 py-2">
              <p className="text-sm font-semibold text-neutral-900">Recent Follow-Up Activity</p>
              <p className="text-xs text-neutral-500">Latest notes across all tracked invoices with direct workflow actions.</p>
            </div>
            <table className="min-w-full divide-y divide-neutral-100 text-sm">
              <thead className="bg-white text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-3 py-2">Invoice</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Note</th>
                  <th className="px-3 py-2">Next Follow-Up</th>
                  <th className="px-3 py-2 text-right">Value</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentActivity.map((activity) => (
                  <tr key={activity.id} className="hover:bg-neutral-50">
                    <td className="px-3 py-2">
                      <p className="font-semibold text-neutral-950">{activity.invoiceNumber}</p>
                      <p className="text-xs text-neutral-500">{activity.customerName}</p>
                    </td>
                    <td className="px-3 py-2 font-semibold text-neutral-800">{activity.status.replace(/_/g, " ")}</td>
                    <td className="px-3 py-2">
                      <p className="line-clamp-2 max-w-xs text-neutral-600">{activity.note}</p>
                      <p className="mt-1 text-xs text-neutral-400">Updated {formatDateTime(activity.updatedAt)}</p>
                    </td>
                    <td className="px-3 py-2 text-neutral-600">{formatDateTime(activity.nextFollowUpAt)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-neutral-900">
                      {formatCurrency(activity.grandTotal)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <DashboardActionButton icon={ClipboardList} onClick={() => openFollowUp(activity)}>
                          Follow Up
                        </DashboardActionButton>
                        <DashboardActionButton icon={FileInput} onClick={() => loadInvoice(activity)}>
                          Load
                        </DashboardActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {recentActivity.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-sm text-neutral-500">
                      No follow-up activity yet. Add follow-up notes from the tracker, because analytics cannot summarize silence.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardPanel>
    </div>
  );
}
