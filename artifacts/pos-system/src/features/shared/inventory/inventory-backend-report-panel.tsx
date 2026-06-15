"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileJson, PackageSearch, RefreshCw, Search, TriangleAlert } from "lucide-react";

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
  type InventoryItemDto,
  type InventoryReportQuery,
  type InventoryReportSort,
  type InventoryReportStatus,
  type InventoryType,
} from "@/lib/api/inventory-api";

const ALL_TYPES = "ALL";
const statusOptions: Array<{ label: string; value: InventoryReportStatus }> = [
  { label: "All Status", value: "ALL" },
  { label: "Low Stock", value: "LOW_STOCK" },
  { label: "Out of Stock", value: "OUT_OF_STOCK" },
  { label: "In Stock", value: "IN_STOCK" },
];
const sortOptions: Array<{ label: string; value: InventoryReportSort }> = [
  { label: "Highest Stock Value", value: "HIGHEST_VALUE" },
  { label: "Lowest Stock", value: "LOWEST_STOCK" },
  { label: "Item Name", value: "ITEM_NAME" },
  { label: "Newest", value: "NEWEST" },
];
const fallbackTypes: InventoryType[] = [
  "INGREDIENT",
  "PACKAGING",
  "EQUIPMENT",
  "PRODUCT",
  "RAW_MATERIAL",
  "FINISHED_GOOD",
  "SUPPLY",
  "TOOL",
  "SPARE_PART",
  "FEED",
  "MEDICINE",
];

type FilterState = {
  search: string;
  type: InventoryType | typeof ALL_TYPES;
  status: InventoryReportStatus;
  lowStock: boolean;
  sort: InventoryReportSort;
};

function formatEnumLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
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

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  downloadBlob(blob, filename);
}

function getStatusTone(status: InventoryReportStatus) {
  if (status === "OUT_OF_STOCK") return "rose";
  if (status === "LOW_STOCK") return "amber";
  if (status === "IN_STOCK") return "green";
  return "slate";
}

function buildQuery(filters: FilterState): InventoryReportQuery {
  return {
    search: filters.search,
    type: filters.type,
    status: filters.status,
    lowStock: filters.lowStock,
    sort: filters.sort,
    limit: 500,
  };
}

export function InventoryBackendReportPanel() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    type: ALL_TYPES,
    status: "ALL",
    lowStock: false,
    sort: "HIGHEST_VALUE",
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(filters);
  const [rows, setRows] = useState<InventoryItemDto[]>([]);
  const [summary, setSummary] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    inStockItems: 0,
    totalStockValue: 0,
    totalUnits: 0,
    averageCostPerUnit: 0,
  });
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<"csv" | "json" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const typeOptions = useMemo(() => {
    const dynamicTypes = rows.map((row) => row.type);
    const types = Array.from(new Set([...fallbackTypes, ...dynamicTypes]));
    return [ALL_TYPES, ...types];
  }, [rows]);

  const query = useMemo(() => buildQuery(appliedFilters), [appliedFilters]);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await inventoryApi.listReports(query);
      setRows(response.data.rows);
      setSummary(response.data.summary);
      setGeneratedAt(response.data.generatedAt);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to load backend inventory report."));
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
      type: ALL_TYPES,
      status: "ALL",
      lowStock: false,
      sort: "HIGHEST_VALUE",
    };
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
  }

  async function handleExportCsv() {
    setIsExporting("csv");
    setErrorMessage(null);
    setMessage(null);

    try {
      const result = await inventoryApi.downloadReportsCsv(query);
      downloadBlob(result.blob, result.filename);
      setMessage(`Exported ${result.rowCount ?? rows.length} inventory row(s) from backend.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to export inventory CSV.");
    } finally {
      setIsExporting(null);
    }
  }

  async function handleExportJson() {
    setIsExporting("json");
    setErrorMessage(null);
    setMessage(null);

    try {
      const response = await inventoryApi.exportReportsJson(query);
      downloadJson(response.data, `inventory-report-${new Date().toISOString().slice(0, 10)}.json`);
      setMessage(`Exported ${response.data.meta.rowCount} inventory row(s) to JSON.`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to export inventory JSON."));
    } finally {
      setIsExporting(null);
    }
  }

  return (
    <DashboardPanel
      title="Backend Inventory Report"
      description="Backend-filtered inventory table and export surface. The operational dashboard below still handles item mutations and stock movement workflows, because apparently one dashboard can have responsibilities if supervised."
      icon={<PackageSearch className="h-4 w-4" aria-hidden="true" />}
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
              placeholder="Item, SKU, type, or unit..."
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-neutral-700">
            <span>Type</span>
            <select
              value={filters.type}
              onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value as FilterState["type"] }))}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
            >
              {typeOptions.map((type) => (
                <option key={type} value={type}>{type === ALL_TYPES ? "All Types" : formatEnumLabel(type)}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-neutral-700">
            <span>Status</span>
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as InventoryReportStatus }))}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-neutral-700">
            <span>Sort</span>
            <select
              value={filters.sort}
              onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as InventoryReportSort }))}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="flex h-full items-end gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700">
            <input
              type="checkbox"
              checked={filters.lowStock}
              onChange={(event) => setFilters((current) => ({ ...current, lowStock: event.target.checked }))}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <span>Low/out only</span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DashboardActionButton icon={Search} variant="primary" onClick={applyFilters} disabled={isLoading}>
            Apply Filters
          </DashboardActionButton>
          <DashboardActionButton icon={RefreshCw} onClick={resetFilters} disabled={isLoading}>
            Reset
          </DashboardActionButton>
          {generatedAt && <p className="text-xs text-neutral-500">Generated at {new Date(generatedAt).toLocaleString("id-ID")}</p>}
        </div>

        {message && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p>}
        {errorMessage && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{errorMessage}</p>}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Report Items" value={isLoading ? "..." : formatNumber(summary.totalItems)} note="Backend filtered rows" icon={PackageSearch} tone="blue" />
          <StatCard label="Low Stock" value={isLoading ? "..." : formatNumber(summary.lowStockItems)} note="At or below threshold" icon={TriangleAlert} tone="amber" />
          <StatCard label="Out of Stock" value={isLoading ? "..." : formatNumber(summary.outOfStockItems)} note="Current stock <= 0" icon={TriangleAlert} tone="rose" />
          <StatCard label="Stock Units" value={isLoading ? "..." : formatNumber(summary.totalUnits)} note="Filtered quantity total" icon={PackageSearch} tone="green" />
          <StatCard label="Stock Value" value={isLoading ? "..." : formatCurrency(summary.totalStockValue)} note="Filtered COGS basis" icon={PackageSearch} tone="slate" />
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-3 py-3 font-semibold">Item</th>
                <th className="px-3 py-3 font-semibold">SKU</th>
                <th className="px-3 py-3 font-semibold">Type</th>
                <th className="px-3 py-3 font-semibold">Stock</th>
                <th className="px-3 py-3 font-semibold">Minimum</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 text-right font-semibold">Cost / Unit</th>
                <th className="px-3 py-3 text-right font-semibold">Stock Value</th>
                <th className="px-3 py-3 font-semibold">Usage</th>
                <th className="px-3 py-3 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-neutral-500">Loading backend inventory report...</td>
                </tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-neutral-500">No inventory items match the current backend filters.</td>
                </tr>
              )}
              {!isLoading && rows.map((row) => (
                <tr key={row.id} className="border-t border-neutral-100 align-top">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-neutral-950">{row.name}</p>
                    <p className="text-xs text-neutral-500">{row.unit}</p>
                  </td>
                  <td className="px-3 py-3 text-neutral-600">{row.sku || "-"}</td>
                  <td className="px-3 py-3 text-neutral-600">{formatEnumLabel(row.type)}</td>
                  <td className="px-3 py-3 font-semibold text-neutral-950">{formatNumber(row.currentStock)}</td>
                  <td className="px-3 py-3 text-neutral-600">{formatNumber(row.minimumStock)}</td>
                  <td className="px-3 py-3"><StatusPill tone={getStatusTone(row.stockStatus)}>{formatEnumLabel(row.stockStatus)}</StatusPill></td>
                  <td className="px-3 py-3 text-right text-neutral-700">{formatCurrency(row.costPerUnit)}</td>
                  <td className="px-3 py-3 text-right font-semibold text-neutral-950">{formatCurrency(row.stockValue)}</td>
                  <td className="px-3 py-3 text-neutral-600">{row.recipeCount > 0 ? `${row.recipeCount} recipe(s)` : `${row.movementCount} movement(s)`}</td>
                  <td className="px-3 py-3 text-neutral-500">{new Date(row.updatedAt).toLocaleString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardPanel>
  );
}
