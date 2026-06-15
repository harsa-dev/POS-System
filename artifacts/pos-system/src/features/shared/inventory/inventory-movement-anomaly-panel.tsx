"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileJson,
  RefreshCw,
  Search,
  ShieldAlert,
  TrendingUp,
  Wrench,
} from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
} from "@/features/shared/dashboard";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import { getApiErrorMessage } from "@/lib/api/api-client";
import {
  inventoryMovementAnomalyApi,
  type InventoryMovementAnomalyQuery,
  type InventoryMovementAnomalyReviewDto,
  type InventoryMovementAnomalyReviewFilter,
  type InventoryMovementAnomalyReviewStatus,
  type InventoryMovementAnomalyRowDto,
  type InventoryMovementAnomalySeverity,
  type InventoryMovementAnomalyType,
} from "@/lib/api/inventory-movement-anomaly-api";
import type { StockMovementReason, StockMovementSource } from "@/lib/api/inventory-api";

const ALL = "ALL" as const;

type ReviewDraft = {
  status: InventoryMovementAnomalyReviewStatus;
  note: string;
};

const anomalyTypeOptions: Array<{ label: string; value: InventoryMovementAnomalyType | typeof ALL }> = [
  { label: "All Anomalies", value: ALL },
  { label: "Negative Stock", value: "NEGATIVE_STOCK" },
  { label: "Missing Cost Snapshot", value: "MISSING_COST_SNAPSHOT" },
  { label: "Suspicious Adjustment", value: "SUSPICIOUS_ADJUSTMENT" },
  { label: "High Value Movement", value: "HIGH_VALUE_MOVEMENT" },
];

const severityOptions: Array<{ label: string; value: InventoryMovementAnomalySeverity | typeof ALL }> = [
  { label: "All Severities", value: ALL },
  { label: "Critical", value: "CRITICAL" },
  { label: "Warning", value: "WARNING" },
  { label: "Info", value: "INFO" },
];

const reviewFilterOptions: Array<{ label: string; value: InventoryMovementAnomalyReviewFilter }> = [
  { label: "All Review States", value: "ALL" },
  { label: "Unreviewed", value: "UNREVIEWED" },
  { label: "Reviewed", value: "REVIEWED" },
  { label: "Ignored", value: "IGNORED" },
  { label: "Resolved", value: "RESOLVED" },
];

const reviewStatusOptions: Array<{ label: string; value: InventoryMovementAnomalyReviewStatus }> = [
  { label: "Reviewed", value: "REVIEWED" },
  { label: "Ignored", value: "IGNORED" },
  { label: "Resolved", value: "RESOLVED" },
];

const movementReasonOptions: Array<{ label: string; value: StockMovementReason | typeof ALL }> = [
  { label: "All Reasons", value: ALL },
  { label: "Recipe Usage", value: "RECIPE_USAGE" },
  { label: "Manual Adjustment", value: "MANUAL_ADJUSTMENT" },
  { label: "Stock Count", value: "STOCK_COUNT" },
  { label: "Correction", value: "CORRECTION" },
  { label: "Waste", value: "WASTE" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Damaged", value: "DAMAGED" },
  { label: "Import", value: "IMPORT" },
];

const sourceTypeOptions: Array<{ label: string; value: StockMovementSource | typeof ALL }> = [
  { label: "All Sources", value: ALL },
  { label: "Manual", value: "MANUAL" },
  { label: "Order", value: "ORDER" },
  { label: "Recipe", value: "RECIPE" },
  { label: "Stock Count", value: "STOCK_COUNT" },
  { label: "Import", value: "IMPORT" },
  { label: "System", value: "SYSTEM" },
];

type FilterState = {
  search: string;
  anomalyType: InventoryMovementAnomalyType | typeof ALL;
  severity: InventoryMovementAnomalySeverity | typeof ALL;
  reviewStatus: InventoryMovementAnomalyReviewFilter;
  reason: StockMovementReason | typeof ALL;
  sourceType: StockMovementSource | typeof ALL;
  sourceId: string;
  from: string;
  to: string;
  highValueThreshold: number;
  adjustmentThreshold: number;
};

const defaultFilters: FilterState = {
  search: "",
  anomalyType: ALL,
  severity: ALL,
  reviewStatus: ALL,
  reason: ALL,
  sourceType: ALL,
  sourceId: "",
  from: "",
  to: "",
  highValueThreshold: 1_000_000,
  adjustmentThreshold: 50,
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getSeverityTone(severity: InventoryMovementAnomalySeverity) {
  if (severity === "CRITICAL") return "rose";
  if (severity === "WARNING") return "amber";
  return "blue";
}

function getReviewTone(status?: InventoryMovementAnomalyReviewStatus | null) {
  if (status === "RESOLVED") return "green";
  if (status === "IGNORED") return "slate";
  if (status === "REVIEWED") return "blue";
  return "amber";
}

function buildQuery(filters: FilterState): InventoryMovementAnomalyQuery {
  return {
    search: filters.search,
    anomalyType: filters.anomalyType,
    severity: filters.severity,
    reviewStatus: filters.reviewStatus,
    reason: filters.reason,
    sourceType: filters.sourceType,
    sourceId: filters.sourceId,
    from: filters.from || undefined,
    to: filters.to || undefined,
    highValueThreshold: filters.highValueThreshold,
    adjustmentThreshold: filters.adjustmentThreshold,
    limit: 500,
  };
}

function scrollToCostRepair() {
  document.getElementById("inventory-cost-snapshot-repair")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function createDefaultDraft(review?: InventoryMovementAnomalyReviewDto): ReviewDraft {
  return {
    status: review?.status ?? "REVIEWED",
    note: review?.note ?? "",
  };
}

function buildReviewDrafts(
  rows: InventoryMovementAnomalyRowDto[],
  reviewsByAnomalyId: Record<string, InventoryMovementAnomalyReviewDto>,
) {
  return rows.reduce<Record<string, ReviewDraft>>((drafts, row) => {
    drafts[row.id] = createDefaultDraft(reviewsByAnomalyId[row.id]);
    return drafts;
  }, {});
}

function ReviewCell({
  row,
  review,
  draft,
  isSaving,
  onDraftChange,
  onSave,
}: {
  row: InventoryMovementAnomalyRowDto;
  review?: InventoryMovementAnomalyReviewDto;
  draft: ReviewDraft;
  isSaving: boolean;
  onDraftChange: (anomalyId: string, draft: ReviewDraft) => void;
  onSave: (row: InventoryMovementAnomalyRowDto) => void;
}) {
  return (
    <div className="min-w-[260px] space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill
          label={review ? formatEnumLabel(review.status) : "Unreviewed"}
          tone={getReviewTone(review?.status)}
        />
        {review?.updatedAt && <span className="text-[11px] text-neutral-500">{formatDateTime(review.updatedAt)}</span>}
      </div>
      <select
        value={draft.status}
        onChange={(event) => onDraftChange(row.id, { ...draft, status: event.target.value as InventoryMovementAnomalyReviewStatus })}
        className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-2 text-xs outline-none focus:border-neutral-400"
      >
        {reviewStatusOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <textarea
        value={draft.note}
        onChange={(event) => onDraftChange(row.id, { ...draft, note: event.target.value })}
        placeholder="Required review note..."
        rows={2}
        className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-2 text-xs outline-none focus:border-neutral-400"
      />
      <DashboardActionButton
        icon={CheckCircle2}
        variant="primary"
        onClick={() => onSave(row)}
        disabled={isSaving || draft.note.trim().length === 0}
      >
        {isSaving ? "Saving..." : "Save Review"}
      </DashboardActionButton>
    </div>
  );
}

function AnomalyRow({
  row,
  review,
  draft,
  isSaving,
  onDraftChange,
  onSaveReview,
}: {
  row: InventoryMovementAnomalyRowDto;
  review?: InventoryMovementAnomalyReviewDto;
  draft: ReviewDraft;
  isSaving: boolean;
  onDraftChange: (anomalyId: string, draft: ReviewDraft) => void;
  onSaveReview: (row: InventoryMovementAnomalyRowDto) => void;
}) {
  return (
    <tr className="border-t border-neutral-100 align-top hover:bg-neutral-50/80">
      <td className="px-3 py-3">
        <StatusPill label={row.severity} tone={getSeverityTone(row.severity)} />
        <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {formatEnumLabel(row.anomalyType)}
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="font-semibold text-neutral-950">{row.title}</div>
        <div className="mt-1 max-w-md text-xs text-neutral-500">{row.description}</div>
      </td>
      <td className="px-3 py-3">
        <div className="font-semibold text-neutral-950">{row.itemName}</div>
        <div className="text-xs text-neutral-500">
          {row.itemSku ?? "No SKU"} · {formatEnumLabel(row.itemType)}
        </div>
      </td>
      <td className="px-3 py-3 text-neutral-700">
        <div>{formatEnumLabel(row.movementType)} · {formatNumber(row.quantity)} {row.itemUnit.toLowerCase()}</div>
        <div className="text-xs text-neutral-500">{formatEnumLabel(row.reason)}</div>
      </td>
      <td className="px-3 py-3 text-neutral-700">
        <div>{row.previousStock ?? "-"} → {row.newStock ?? "-"}</div>
        <div className="text-xs text-neutral-500">Snapshot {row.unitCostSnapshot ?? "missing"}</div>
      </td>
      <td className="px-3 py-3 text-neutral-700">
        <div>{formatEnumLabel(row.sourceType)}</div>
        <div className="text-xs text-neutral-500">{row.sourceId ?? "No source ID"}</div>
      </td>
      <td className="px-3 py-3 text-right font-semibold text-neutral-950">
        {formatCurrency(row.movementValue)}
      </td>
      <td className="px-3 py-3 text-neutral-600">
        <div>{formatDateTime(row.createdAt)}</div>
        <div className="mt-1 max-w-xs text-xs text-neutral-500">{row.recommendedAction}</div>
        {row.anomalyType === "MISSING_COST_SNAPSHOT" && (
          <button
            type="button"
            onClick={scrollToCostRepair}
            className="mt-2 text-xs font-semibold text-blue-700 underline underline-offset-4"
          >
            Open cost repair
          </button>
        )}
      </td>
      <td className="px-3 py-3">
        <ReviewCell
          row={row}
          review={review}
          draft={draft}
          isSaving={isSaving}
          onDraftChange={onDraftChange}
          onSave={onSaveReview}
        />
      </td>
    </tr>
  );
}

export function InventoryMovementAnomalyPanel() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(defaultFilters);
  const [rows, setRows] = useState<InventoryMovementAnomalyRowDto[]>([]);
  const [reviewsByAnomalyId, setReviewsByAnomalyId] = useState<Record<string, InventoryMovementAnomalyReviewDto>>({});
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [savingReviewId, setSavingReviewId] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    totalAnomalies: 0,
    criticalCount: 0,
    warningCount: 0,
    infoCount: 0,
    negativeStockCount: 0,
    missingCostSnapshotCount: 0,
    suspiciousAdjustmentCount: 0,
    highValueMovementCount: 0,
    reviewedCount: 0,
    ignoredCount: 0,
    resolvedCount: 0,
    unreviewedCount: 0,
    totalValueAtRisk: 0,
  });
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<"csv" | "json" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const query = useMemo(() => buildQuery(appliedFilters), [appliedFilters]);

  const reviewSummary = useMemo(() => {
    const reviewed = summary.reviewedCount ?? rows.filter((row) => reviewsByAnomalyId[row.id]?.status === "REVIEWED").length;
    const ignored = summary.ignoredCount ?? rows.filter((row) => reviewsByAnomalyId[row.id]?.status === "IGNORED").length;
    const resolved = summary.resolvedCount ?? rows.filter((row) => reviewsByAnomalyId[row.id]?.status === "RESOLVED").length;
    const unreviewed = summary.unreviewedCount ?? Math.max(rows.length - reviewed - ignored - resolved, 0);

    return { reviewed, ignored, resolved, unreviewed };
  }, [reviewsByAnomalyId, rows, summary.ignoredCount, summary.resolvedCount, summary.reviewedCount, summary.unreviewedCount]);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [reportResponse, reviewResponse] = await Promise.all([
        inventoryMovementAnomalyApi.list(query),
        inventoryMovementAnomalyApi.listReviews(),
      ]);
      const nextRows = reportResponse.data.rows;
      const nextReviewsByAnomalyId = reviewResponse.data.rows.reduce<Record<string, InventoryMovementAnomalyReviewDto>>(
        (lookup, review) => {
          lookup[review.anomalyId] = review;
          return lookup;
        },
        {},
      );

      setRows(nextRows);
      setReviewsByAnomalyId(nextReviewsByAnomalyId);
      setReviewDrafts(buildReviewDrafts(nextRows, nextReviewsByAnomalyId));
      setSummary(reportResponse.data.summary);
      setGeneratedAt(reportResponse.data.generatedAt);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to load inventory movement anomalies."));
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
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  }

  function updateReviewDraft(anomalyId: string, draft: ReviewDraft) {
    setReviewDrafts((current) => ({ ...current, [anomalyId]: draft }));
  }

  async function saveReview(row: InventoryMovementAnomalyRowDto) {
    const draft = reviewDrafts[row.id] ?? createDefaultDraft(reviewsByAnomalyId[row.id]);
    if (draft.note.trim().length === 0) {
      setErrorMessage("Review note is required before saving anomaly review status.");
      return;
    }

    setSavingReviewId(row.id);
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = await inventoryMovementAnomalyApi.saveReview({
        anomalyId: row.id,
        anomalyType: row.anomalyType,
        movementId: row.movementId,
        status: draft.status,
        note: draft.note,
      });
      setReviewsByAnomalyId((current) => ({ ...current, [row.id]: response.data }));
      setReviewDrafts((current) => ({ ...current, [row.id]: createDefaultDraft(response.data) }));
      setMessage(`Marked anomaly as ${formatEnumLabel(response.data.status)}.`);
      await loadReport();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to save anomaly review."));
    } finally {
      setSavingReviewId(null);
    }
  }

  async function handleExportCsv() {
    setIsExporting("csv");
    setMessage(null);
    setErrorMessage(null);

    try {
      const result = await inventoryMovementAnomalyApi.downloadCsv(query);
      downloadBlob(result.blob, result.filename);
      setMessage(`Exported ${result.rowCount ?? rows.length} anomaly row(s) from backend with review state.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to export anomaly CSV.");
    } finally {
      setIsExporting(null);
    }
  }

  async function handleExportJson() {
    setIsExporting("json");
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = await inventoryMovementAnomalyApi.exportJson(query);
      downloadJson(response.data, `inventory-movement-anomalies-${new Date().toISOString().slice(0, 10)}.json`);
      setMessage(`Exported ${response.data.meta.rowCount} anomaly row(s) to JSON with review state.`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to export anomaly JSON."));
    } finally {
      setIsExporting(null);
    }
  }

  return (
    <DashboardPanel
      title="Inventory Movement Anomaly Reconciliation"
      description="Backend-detected movement anomalies with review filters, review-aware export, and required notes, because anomaly reports should become workflow, not spreadsheet archaeology."
      icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />}
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
              placeholder="Item, SKU, source ID, note..."
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-neutral-700">
            <span>Anomaly</span>
            <select
              value={filters.anomalyType}
              onChange={(event) => setFilters((current) => ({ ...current, anomalyType: event.target.value as FilterState["anomalyType"] }))}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
            >
              {anomalyTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-neutral-700">
            <span>Severity</span>
            <select
              value={filters.severity}
              onChange={(event) => setFilters((current) => ({ ...current, severity: event.target.value as FilterState["severity"] }))}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
            >
              {severityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-neutral-700">
            <span>Review</span>
            <select
              value={filters.reviewStatus}
              onChange={(event) => setFilters((current) => ({ ...current, reviewStatus: event.target.value as FilterState["reviewStatus"] }))}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
            >
              {reviewFilterOptions.map((option) => (
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
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
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
            <span>Source ID</span>
            <input
              value={filters.sourceId}
              onChange={(event) => setFilters((current) => ({ ...current, sourceId: event.target.value }))}
              placeholder="Order, recipe, import..."
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
          <label className="space-y-1 text-sm font-medium text-neutral-700">
            <span>High Value ≥</span>
            <input
              type="number"
              min={0}
              value={filters.highValueThreshold}
              onChange={(event) => setFilters((current) => ({ ...current, highValueThreshold: Number(event.target.value) }))}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-neutral-700">
            <span>Adjustment ≥</span>
            <input
              type="number"
              min={0}
              value={filters.adjustmentThreshold}
              onChange={(event) => setFilters((current) => ({ ...current, adjustmentThreshold: Number(event.target.value) }))}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <DashboardActionButton icon={Search} variant="primary" onClick={applyFilters} disabled={isLoading}>
            Apply Filters
          </DashboardActionButton>
          <DashboardActionButton icon={RefreshCw} onClick={resetFilters} disabled={isLoading}>
            Reset
          </DashboardActionButton>
          <DashboardActionButton icon={Wrench} onClick={scrollToCostRepair} disabled={isLoading}>
            Cost Repair Panel
          </DashboardActionButton>
        </div>

        {generatedAt && <p className="text-xs text-neutral-500">Generated at {new Date(generatedAt).toLocaleString("id-ID")}</p>}
        {message && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p>}
        {errorMessage && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{errorMessage}</p>}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Anomalies" value={isLoading ? "..." : formatNumber(summary.totalAnomalies)} note="Backend detected rows" icon={ShieldAlert} tone="blue" />
          <StatCard label="Critical" value={isLoading ? "..." : formatNumber(summary.criticalCount)} note="Immediate review" icon={AlertTriangle} tone="rose" />
          <StatCard label="Missing Cost" value={isLoading ? "..." : formatNumber(summary.missingCostSnapshotCount)} note="COGS snapshot issues" icon={Wrench} tone="amber" />
          <StatCard label="High Value" value={isLoading ? "..." : formatNumber(summary.highValueMovementCount)} note="Threshold-based flag" icon={TrendingUp} tone="green" />
          <StatCard label="Value At Risk" value={isLoading ? "..." : formatCurrency(summary.totalValueAtRisk)} note="Snapshot/fallback value" icon={ShieldAlert} tone="slate" />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Reviewed" value={isLoading ? "..." : formatNumber(reviewSummary.reviewed)} note="Marked reviewed" icon={CheckCircle2} tone="blue" />
          <StatCard label="Resolved" value={isLoading ? "..." : formatNumber(reviewSummary.resolved)} note="Marked resolved" icon={CheckCircle2} tone="green" />
          <StatCard label="Ignored" value={isLoading ? "..." : formatNumber(reviewSummary.ignored)} note="Accepted / ignored" icon={ShieldAlert} tone="slate" />
          <StatCard label="Unreviewed" value={isLoading ? "..." : formatNumber(reviewSummary.unreviewed)} note="Needs action" icon={AlertTriangle} tone="amber" />
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full min-w-[1680px] text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-3 py-3 font-semibold">Severity</th>
                <th className="px-3 py-3 font-semibold">Issue</th>
                <th className="px-3 py-3 font-semibold">Item</th>
                <th className="px-3 py-3 font-semibold">Movement</th>
                <th className="px-3 py-3 font-semibold">Stock Snapshot</th>
                <th className="px-3 py-3 font-semibold">Source</th>
                <th className="px-3 py-3 text-right font-semibold">Value</th>
                <th className="px-3 py-3 font-semibold">Action</th>
                <th className="px-3 py-3 font-semibold">Review</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-neutral-500">Loading anomaly report...</td>
                </tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-neutral-500">No movement anomalies match the active filters.</td>
                </tr>
              )}
              {!isLoading && rows.map((row) => (
                <AnomalyRow
                  key={row.id}
                  row={row}
                  review={reviewsByAnomalyId[row.id]}
                  draft={reviewDrafts[row.id] ?? createDefaultDraft(reviewsByAnomalyId[row.id])}
                  isSaving={savingReviewId === row.id}
                  onDraftChange={updateReviewDraft}
                  onSaveReview={saveReview}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardPanel>
  );
}
