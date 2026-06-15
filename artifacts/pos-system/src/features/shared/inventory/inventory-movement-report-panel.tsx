"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileJson, History, RefreshCw, Search, TrendingDown, TrendingUp } from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
} from "@/features/shared/dashboard";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import { getApiErrorMessage } from "@/lib/api/api-client";
import {
  inventoryApi,
  type InventoryMovementReportQuery,
  type InventoryMovementReportRowDto,
  type InventoryMovementReportSort,
  type StockMovementReason,
  type StockMovementSource,
  type StockMovementType,
} from "@/lib/api/inventory-api";

const ALL = "ALL" as const;
const movementTypeOptions: Array<{ label: string; value: StockMovementType | typeof ALL }> = [
  { label: "All Types", value: ALL },
  { label: "In", value: "IN" },
  { label: "Out", value: "OUT" },
  { label: "Adjustment", value: "ADJUSTMENT" },
];
const movementReasonOptions: Array<{ label: string; value: StockMovementReason | typeof ALL }> = [
  { label: "All Reasons", value: ALL },
  { label: "Purchase", value: "PURCHASE" },
  { label: "Recipe Usage", value: "RECIPE_USAGE" },
  { label: "Waste", value: "WASTE" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Manual Adjustment", value: "MANUAL_ADJUSTMENT" },
  { label: "Damaged", value: "DAMAGED" },
  { label: "Return", value: "RETURN" },
  { label: "Opening Stock", value: "OPENING_STOCK" },
  { label: "Stock Count", value: "STOCK_COUNT" },
  { label: "Correction", value: "CORRECTION" },
  { label: "Transfer In", value: "TRANSFER_IN" },
  { label: "Transfer Out", value: "TRANSFER_OUT" },
  { label: "Production Usage", value: "PRODUCTION_USAGE" },
  { label: "Service Usage", value: "SERVICE_USAGE" },
  { label: "Livestock Usage", value: "LIVESTOCK_USAGE" },
  { label: "Import", value: "IMPORT" },
];
const sourceTypeOptions: Array<{ label: string; value: StockMovementSource | typeof ALL }> = [
  { label: "All Sources", value: ALL },
  { label: "Manual", value: "MANUAL" },
  { label: "Order", value: "ORDER" },
  { label: "Recipe", value: "RECIPE" },
  { label: "Purchase", value: "PURCHASE" },
  { label: "Waste", value: "WASTE" },
  { label: "Return", value: "RETURN" },
  { label: "Transfer", value: "TRANSFER" },
  { label: "Stock Count", value: "STOCK_COUNT" },
  { label: "Import", value: "IMPORT" },
  { label: "System", value: "SYSTEM" },
];
const sortOptions: Array<{ label: string; value: InventoryMovementReportSort }> = [
  { label: "Newest", value: "NEWEST" },
  { label: "Oldest", value: "OLDEST" },
  { label: "Highest Quantity", value: "HIGHEST_QUANTITY" },
  { label: "Highest Value", value: "HIGHEST_VALUE" },
];

type FilterState = {
  search: string;
  type: StockMovementType | typeof ALL;
  reason: StockMovementReason | typeof ALL;
  sourceType: StockMovementSource | typeof ALL;
  sourceId: string;
  from: string;
  to: string;
  sort: InventoryMovementReportSort;
};

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

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  downloadBlob(blob, filename);
}

function formatEnumLabel(value: string | null | undefined) {
  if (!value) return "-";
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getMovementTone(type: StockMovementType) {
  if (type === "IN") return "green";
  if (type === "OUT") return "rose";
  return "amber";
}

function buildQuery(filters: FilterState): InventoryMovementReportQuery {
  return {
    search: filters.search,
    type: filters.type,
    reason: filters.reason,
    sourceType: filters.sourceType,
    sourceId: filters.sourceId,
    from: filters.from || undefined,
    to: filters.to || undefined,
    sort: filters.sort,
    limit: 500,
  };
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function MovementRow({ row }: { row: InventoryMovementReportRowDto }) {
  return (
    <tr className="border-t border-neutral-100 align-top hover:bg-neutral-50/80">
      <td className="px-3 py-3">
        <div className="font-semibold text-neutral-950">{row.itemName}</div>
        <div className="text-xs text-neutral-500">{row.itemSku ?? "No SKU"} · {formatEnumLabel(row.itemType)}</div>
      </td>
      <td className="px-3 py-3">
        <StatusPill label={row.type} tone={getMovementTone(row.type)} />
      </td>
      <td className="px-3 py-3 text-neutral-700">
        <div>{formatNumber(row.quantity)} {row.itemUnit.toLowerCase()}</div>
        <div className="text-xs text-neutral-500">{formatEnumLabel(row.reason)}</div>
      </td>
      <td className="px-3 py-3 text-neutral-700">
        <div>{formatEnumLabel(row.sourceType)}</div>
        <div className="text-xs text-neutral-500">{row.sourceId ?? "No source ID"}</div>
      </td>
      <td className="px-3 py-3 text-neutral-700">
        <div>{row.previousStock ?? "-"} → {row.newStock ?? "-"}</div>
        <div className="text-xs text-neutral-500">Snapshot {row.unitCostSnapshot ?? row.fallbackCostPerUnit}</div>
      </td>
      <td className="px-3 py-3 text-right font-semibold text-neutral-950">
        {formatCurrency(row.movementValue)}
      </td>
      <td className="px-3 py-3 text-neutral-600">
        <div>{formatDateTime(row.createdAt)}</div>
        {row.note && <div className="mt-1 max-w-xs text-xs text-neutral-500">{row.note}</div>}
      </td>
    </tr>
  );
}

export function InventoryMovementReportPanel() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    type: ALL,
    reason: ALL,
    sourceType: ALL,
    sourceId: "",
    from: "",
    to: "",
    sort: "NEWEST",
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(filters);
  const [rows, setRows] = useState<InventoryMovementReportRowDto[]>([]);
  const [summary, setSummary] = useState({
    totalMovements: 0,
    inMovements: 0,
    outMovements: 0,
    adjustmentMovements: 0,
    totalInQuantity: 0,
    totalOutQuantity: 0,
    totalAdjustmentQuantity: 0,
    netQuantity: 0,
    totalMovementValue: 0,
  });
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<"csv" | "json" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const query = useMemo(() => buildQuery(appliedFilters), [appliedFilters]);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await inventoryApi.listMovementReports(query);
      setRows(response.data.rows);
      setSummary(response.data.summary);
      setGeneratedAt(response.data.generatedAt);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to load inventory movement report."));
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  function applyFilters() {
    setAppliedFilters(filters);
  }

  function resetFilters() {
    const nextFilters: FilterState = {
      search: "",
      type: ALL,
      reason: ALL,
      sourceType: ALL,
      sourceId: "",
      from: "",
      to: "",
      sort: "NEWEST",
    };
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
  }

  async function handleExportCsv() {
    setIsExporting("csv");
    setErrorMessage(null);
    setMessage(null);

    try {
      const result = await inventoryApi.downloadMovementReportsCsv(query);
      downloadBlob(result.blob, result.filename);
      setMessage(`Exported ${result.rowCount ?? rows.length} movement row(s) from backend.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to export movement CSV.");
    } finally {
      setIsExporting(null);
    }
  }

  async function handleExportJson() {
    setIsExporting("json");
    setErrorMessage(null);
    setMessage(null);

    try {
      const response = await inventoryApi.exportMovementReportsJson(query);
      downloadJson(response.data, `inventory-movement-report-${new Date().toISOString().slice(0, 10)}.json`);
      setMessage(`Exported ${response.data.meta.rowCount} movement row(s) to JSON.`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to export movement JSON."));
    } finally {
      setIsExporting(null);
    }
  }

  return (
    <DashboardPanel
      title="Backend Stock Movement Report"
      description="Backend-filtered movement ledger with audit-oriented CSV/JSON export. The operational dashboard below can still create movements; this panel exists so audit does not depend on a browser tab's mood."
      icon={<History className="h-4 w-4" aria-hidden="true" />}
      actions={
        <DashboardActions>
          <DashboardActionButton icon={RefreshCw} onClick={loadReport} disabled={isLoading}>
            {isLoading ? "Loading..." : "Refresh"}
          </DashboardActionButton>
          <DashboardActionButton icon={Download} onClick={handleExportCsv} disabled={Boolean(isExporting) || isLoading}>
            {isExporting === "csv" ? "Exporting..." : "Export CSV"}
          </DashboardActionButton>
          <DashboardActionButton icon={FileJson} onClick={handleExportJson} disabled={Boolean(isExporting) || isLoading}>
            {isExporting === "json" ? "Exporting..." : "Export JSON"}
          </DashboardActionButton>
        </DashboardActions>
      }
    >
      <div className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="space-y-1 text-sm font-medium text-neutral-700 xl:col-span-2">
            <span>Search</span>
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Item, SKU, source ID, or note..."
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-neutral-700">
            <span>Movement Type</span>
            <select
              value={filters.type}
              onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value as FilterState["type"] }))}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
            >
              {movementTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-neutral-700">
            <span>Reason</span>
            <select
              value={filters.reason}
              onChange={(event) => setFilters((current) => ({ ...current, reason: event.target.value as FilterState["reason"] }))}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
            >
              {movementReasonOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-neutral-700">
            <span>Source</span>
            <select
              value={filters.sourceType}
              onChange={(event) => setFilters((current) => ({ ...current, sourceType: event.target.value as FilterState["sourceType"] }))}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
            >
              {sourceTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-neutral-700">
            <span>Sort</span>
            <select
              value={filters.sort}
              onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as InventoryMovementReportSort }))}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-sm font-medium text-neutral-700">
            <span>Source ID</span>
            <input
              value={filters.sourceId}
              onChange={(event) => setFilters((current) => ({ ...current, sourceId: event.target.value }))}
              placeholder="Order, recipe, import, transfer ID..."
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
            />
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
          <div className="flex items-end gap-2">
            <DashboardActionButton icon={Search} variant="primary" onClick={applyFilters} disabled={isLoading}>
              Apply Filters
            </DashboardActionButton>
            <DashboardActionButton icon={RefreshCw} onClick={resetFilters} disabled={isLoading}>
              Reset
            </DashboardActionButton>
          </div>
        </div>

        {generatedAt && <p className="text-xs text-neutral-500">Generated at {new Date(generatedAt).toLocaleString("id-ID")}</p>}
        {message && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p>}
        {errorMessage && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{errorMessage}</p>}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Movements" value={isLoading ? "..." : formatNumber(summary.totalMovements)} note="Backend filtered rows" icon={History} tone="blue" />
          <StatCard label="Stock In" value={isLoading ? "..." : formatNumber(summary.totalInQuantity)} note={`${formatNumber(summary.inMovements)} movement(s)`} icon={TrendingUp} tone="green" />
          <StatCard label="Stock Out" value={isLoading ? "..." : formatNumber(summary.totalOutQuantity)} note={`${formatNumber(summary.outMovements)} movement(s)`} icon={TrendingDown} tone="rose" />
          <StatCard label="Net Quantity" value={isLoading ? "..." : formatNumber(summary.netQuantity)} note="In minus out" icon={History} tone="slate" />
          <StatCard label="Movement Value" value={isLoading ? "..." : formatCurrency(summary.totalMovementValue)} note="Snapshot/fallback cost" icon={History} tone="amber" />
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full min-w-[1240px] text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-3 py-3 font-semibold">Item</th>
                <th className="px-3 py-3 font-semibold">Type</th>
                <th className="px-3 py-3 font-semibold">Quantity / Reason</th>
                <th className="px-3 py-3 font-semibold">Source</th>
                <th className="px-3 py-3 font-semibold">Stock Snapshot</th>
                <th className="px-3 py-3 text-right font-semibold">Value</th>
                <th className="px-3 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-neutral-500">Loading backend movement report...</td>
                </tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-neutral-500">No movement rows match the active filters.</td>
                </tr>
              )}
              {!isLoading && rows.map((row) => <MovementRow key={row.id} row={row} />)}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardPanel>
  );
}
