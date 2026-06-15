"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, ChevronLeft, ChevronRight, Download, FileInput, RefreshCw, Search } from "lucide-react";

import {
  invoiceApi,
  type InvoiceBackendStatus,
  type InvoiceCapabilitiesDto,
  type InvoiceHistoryMeta,
  type InvoiceHistoryQuery,
  type InvoiceRecord,
} from "@/lib/api/invoice-api";
import { formatCurrency } from "@/features/shared/format";
import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
} from "@/features/shared/dashboard";
import {
  INVOICE_GENERATOR_LOAD_INVOICE_EVENT,
  type InvoiceGeneratorLoadInvoiceEventDetail,
} from "./invoice-generator-events";

type InvoiceHistoryPanelProps = {
  capabilities: InvoiceCapabilitiesDto;
  canLoadToEditor?: boolean;
};

type FilterState = {
  search: string;
  status: InvoiceBackendStatus | "ALL";
  from: string;
  to: string;
};

const DEFAULT_FILTERS: FilterState = {
  search: "",
  status: "ALL",
  from: "",
  to: "",
};

function getStatusTone(status: InvoiceBackendStatus) {
  if (status === "PAID") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "SENT") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "CANCELLED") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-neutral-50 text-neutral-600 border-neutral-200";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function buildQuery(filters: FilterState, page: number): InvoiceHistoryQuery {
  return {
    search: filters.search,
    status: filters.status,
    from: filters.from || undefined,
    to: filters.to || undefined,
    page,
    limit: 15,
  };
}

export function InvoiceHistoryPanel({ capabilities, canLoadToEditor = false }: InvoiceHistoryPanelProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<InvoiceRecord[]>([]);
  const [meta, setMeta] = useState<InvoiceHistoryMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const query = useMemo(() => buildQuery(appliedFilters, page), [appliedFilters, page]);

  async function loadHistory(nextQuery = query) {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await invoiceApi.listInvoices(nextQuery);
      if (!response.success || !response.data) {
        setErrorMessage(response.message ?? "Failed to load invoice history.");
        return;
      }
      setRows(response.data);
      setMeta(response.meta ?? null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load invoice history.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadHistory(query);
  }, [query]);

  function applyFilters() {
    setPage(1);
    setAppliedFilters(filters);
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  async function handleExport() {
    setIsExporting(true);
    setErrorMessage(null);
    setMessage(null);

    try {
      const result = await invoiceApi.downloadInvoicesCsv({ ...query, page: undefined, limit: undefined });
      downloadBlob(result.blob, result.filename);
      setMessage(`Exported ${result.rowCount ?? "matching"} invoices to CSV.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to export invoice history.");
    } finally {
      setIsExporting(false);
    }
  }

  function handleLoadToEditor(invoice: InvoiceRecord) {
    if (!canLoadToEditor) {
      setErrorMessage("Invoice editor access is required to load history records into the editor.");
      setMessage(null);
      return;
    }

    const detail: InvoiceGeneratorLoadInvoiceEventDetail = {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
    };

    window.dispatchEvent(new CustomEvent(INVOICE_GENERATOR_LOAD_INVOICE_EVENT, { detail }));
    document.getElementById("invoice-generator-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMessage(`Invoice ${invoice.invoiceNumber} sent to the editor.`);
    setErrorMessage(null);
  }

  async function handleCancel(invoice: InvoiceRecord) {
    if (!capabilities.canCancel || invoice.status === "CANCELLED") return;
    const confirmed = window.confirm(`Cancel invoice ${invoice.invoiceNumber}? This keeps the record but marks it cancelled.`);
    if (!confirmed) return;

    setCancelingId(invoice.id);
    setErrorMessage(null);
    setMessage(null);

    try {
      const result = await invoiceApi.cancelInvoiceWithResult(invoice.id);
      if (!result.ok || !result.body.success) {
        setErrorMessage(result.body.message ?? "Failed to cancel invoice.");
        return;
      }
      setMessage(`Invoice ${invoice.invoiceNumber} cancelled.`);
      await loadHistory(query);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to cancel invoice.");
    } finally {
      setCancelingId(null);
    }
  }

  const totalPages = meta?.totalPages ?? 1;
  const totalItems = meta?.totalItems ?? rows.length;

  return (
    <DashboardPanel title="Invoice History Operations">
      <div className="space-y-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-1 text-sm font-medium text-neutral-700 xl:col-span-2">
              <span>Search</span>
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Invoice, customer, phone, notes..."
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-neutral-700">
              <span>Status</span>
              <select
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as FilterState["status"] }))}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
              >
                <option value="ALL">All</option>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-neutral-700">
              <span>From</span>
              <input
                type="date"
                value={filters.from}
                onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-neutral-700">
              <span>To</span>
              <input
                type="date"
                value={filters.to}
                onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
              />
            </label>
          </div>
          <DashboardActions>
            <DashboardActionButton icon={Search} onClick={applyFilters} disabled={isLoading}>
              Apply
            </DashboardActionButton>
            <DashboardActionButton icon={RefreshCw} onClick={resetFilters} disabled={isLoading}>
              Reset
            </DashboardActionButton>
            <DashboardActionButton icon={Download} variant="primary" onClick={handleExport} disabled={isExporting || isLoading}>
              {isExporting ? "Exporting..." : "Export CSV"}
            </DashboardActionButton>
          </DashboardActions>
        </div>

        {message && <p className="text-sm font-medium text-emerald-700">{message}</p>}
        {errorMessage && <p className="text-sm font-medium text-rose-700">{errorMessage}</p>}

        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full min-w-[1020px] text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-3 py-3 font-semibold">Invoice</th>
                <th className="px-3 py-3 font-semibold">Customer</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Invoice Date</th>
                <th className="px-3 py-3 text-right font-semibold">Total</th>
                <th className="px-3 py-3 font-semibold">Updated</th>
                <th className="px-3 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-neutral-500">
                    Loading invoice history...
                  </td>
                </tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-neutral-500">
                    No invoices match the current filters.
                  </td>
                </tr>
              )}
              {!isLoading && rows.map((invoice) => (
                <tr key={invoice.id} className="border-t border-neutral-100 align-top">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-neutral-950">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-neutral-500">{invoice.items.length} item(s)</p>
                  </td>
                  <td className="px-3 py-3 text-neutral-600">
                    <p className="font-medium text-neutral-800">{invoice.customerName}</p>
                    <p className="text-xs text-neutral-500">{invoice.customerPhone ?? "No phone"}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusTone(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-neutral-600">
                    {new Date(invoice.invoiceDate).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-neutral-950">
                    {formatCurrency(invoice.grandTotal)}
                  </td>
                  <td className="px-3 py-3 text-neutral-500">
                    {new Date(invoice.updatedAt).toLocaleString("id-ID")}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadToEditor(invoice)}
                        disabled={!canLoadToEditor}
                        title={canLoadToEditor ? "Load this invoice into the editor." : "Invoice editor access is required to load this record."}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FileInput className="h-4 w-4" />
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCancel(invoice)}
                        disabled={!capabilities.canCancel || invoice.status === "CANCELLED" || cancelingId === invoice.id}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Ban className="h-4 w-4" />
                        {cancelingId === invoice.id ? "Canceling..." : "Cancel"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing page {meta?.page ?? page} of {totalPages} · {totalItems} matching invoice(s)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={isLoading || page <= 1}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
              disabled={isLoading || page >= totalPages}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}
