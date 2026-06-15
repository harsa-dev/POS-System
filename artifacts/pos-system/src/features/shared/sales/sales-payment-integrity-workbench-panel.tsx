"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Download,
  FileText,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
} from "@/features/shared/dashboard";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import {
  salesPaymentIntegrityApi,
  type SalesPaymentIntegrityDto,
  type SalesPaymentIntegrityIssue,
  type SalesPaymentIntegrityRowDto,
} from "@/lib/api/sales-payment-integrity-api";

import {
  getInitialSalesAnalyticsFilterContext,
  SALES_ANALYTICS_FILTER_SYNC_EVENT,
  type SalesAnalyticsFilterContext,
} from "./sales-analytics-filter-sync";
import {
  SALES_PAYMENT_INTEGRITY_OPEN_EVENT,
  type SalesPaymentIntegrityOpenEventDetail,
} from "./sales-payment-integrity-workbench-events";

const ISSUE_OPTIONS: Array<{ value: SalesPaymentIntegrityIssue; label: string }> = [
  { value: "all", label: "All payment issues" },
  { value: "orders_without_paid_payment", label: "Orders without paid payment" },
  { value: "payment_total_mismatch", label: "Payment total mismatches" },
];

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatIssueLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
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

function downloadText(content: string, filename: string, type: string) {
  downloadBlob(new Blob([content], { type }), filename);
}

function downloadJson(payload: unknown, filename: string) {
  downloadText(JSON.stringify(payload, null, 2), filename, "application/json;charset=utf-8");
}

function getBucket(data: SalesPaymentIntegrityDto | null, issue: Exclude<SalesPaymentIntegrityIssue, "all">) {
  return data?.summary.buckets.find((bucket) => bucket.issueType === issue) ?? null;
}

function buildRowColumns(): DataTableColumn<SalesPaymentIntegrityRowDto>[] {
  return [
    {
      key: "issueType",
      header: "Issue",
      cell: (row) => (
        <StatusPill tone="rose">{formatIssueLabel(row.issueType)}</StatusPill>
      ),
    },
    {
      key: "order",
      header: "Order",
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">Order #{row.orderNumber}</p>
          <p className="text-xs text-muted-foreground">{row.orderId}</p>
        </div>
      ),
    },
    {
      key: "orderDate",
      header: "Date",
      cell: (row) => formatDateTime(row.orderDate),
    },
    {
      key: "status",
      header: "Order Status",
      cell: (row) => <StatusPill tone="amber">{formatIssueLabel(row.orderStatus)}</StatusPill>,
    },
    {
      key: "paymentMethod",
      header: "Payment",
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.paymentMethod}</p>
          <p className="text-xs text-muted-foreground">
            {row.paymentId ? `${row.paymentProvider ?? "Provider"} · ${row.paymentStatus}` : "No PAID payment"}
          </p>
        </div>
      ),
    },
    {
      key: "orderTotal",
      header: "Order Total",
      cell: (row) => formatCurrency(row.orderTotal),
    },
    {
      key: "amountPaid",
      header: "Amount Paid",
      cell: (row) => formatCurrency(row.amountPaid),
    },
    {
      key: "difference",
      header: "Difference",
      cell: (row) => (
        <span className={row.difference === 0 ? "text-muted-foreground" : "font-medium text-rose-600"}>
          {formatCurrency(row.difference)}
        </span>
      ),
    },
    {
      key: "recommendedAction",
      header: "Recommended Action",
      cell: (row) => row.recommendedAction,
    },
  ];
}

function formatFilterSummary(context: SalesAnalyticsFilterContext) {
  const parts = [
    context.filters.productLabel,
    context.filters.categoryLabel,
    context.filters.paymentMethodLabel,
    context.filters.orderStatusLabel,
  ].filter(Boolean);

  if (context.filters.search) {
    parts.push(`Search: ${context.filters.search}`);
  }

  return parts.join(" · ") || "All products/categories/payments/statuses";
}

export function SalesPaymentIntegrityWorkbenchPanel() {
  const [filterContext, setFilterContext] = useState<SalesAnalyticsFilterContext>(() =>
    getInitialSalesAnalyticsFilterContext(),
  );
  const [issue, setIssue] = useState<SalesPaymentIntegrityIssue>("all");
  const [workbench, setWorkbench] = useState<SalesPaymentIntegrityDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState<"csv" | "json" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadWorkbench = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await salesPaymentIntegrityApi.getWorkbench({
        ...filterContext.query,
        issue,
        limit: 150,
      });

      if (!response.success || !response.data) {
        setErrorMessage(response.message ?? "Failed to load payment integrity workbench.");
        return;
      }

      setWorkbench(response.data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load payment integrity workbench.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [filterContext.query, issue]);

  useEffect(() => {
    void loadWorkbench();
  }, [loadWorkbench]);

  useEffect(() => {
    const handleFilterSync = (event: Event) => {
      const detail = (event as CustomEvent<SalesAnalyticsFilterContext>).detail;
      if (detail?.query) {
        setFilterContext(detail);
      }
    };

    window.addEventListener(SALES_ANALYTICS_FILTER_SYNC_EVENT, handleFilterSync);
    return () => window.removeEventListener(SALES_ANALYTICS_FILTER_SYNC_EVENT, handleFilterSync);
  }, []);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<SalesPaymentIntegrityOpenEventDetail>).detail;
      if (detail?.issue) {
        setIssue(detail.issue);
      }
      setActionMessage(detail?.message ?? "Opened from Sales Reconciliation drilldown.");
      document
        .getElementById("sales-payment-integrity-workbench")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    window.addEventListener(SALES_PAYMENT_INTEGRITY_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(SALES_PAYMENT_INTEGRITY_OPEN_EVENT, handleOpen);
  }, []);

  const columns = useMemo(() => buildRowColumns(), []);
  const missingPaymentBucket = getBucket(workbench, "orders_without_paid_payment");
  const mismatchBucket = getBucket(workbench, "payment_total_mismatch");

  async function handleExportCsv() {
    setIsExporting("csv");
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await salesPaymentIntegrityApi.exportCsv({
        ...filterContext.query,
        issue,
        limit: 5000,
      });

      if (!response.success || !response.data?.content) {
        setErrorMessage(response.message ?? "Failed to export payment integrity CSV.");
        return;
      }

      downloadText(response.data.content, response.data.filename, response.data.contentType);
      setSuccessMessage(`Exported ${response.data.meta.rowCount} payment integrity row(s) to CSV.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to export payment integrity CSV.",
      );
    } finally {
      setIsExporting(null);
    }
  }

  async function handleExportJson() {
    setIsExporting("json");
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await salesPaymentIntegrityApi.exportJson({
        ...filterContext.query,
        issue,
        limit: 5000,
      });

      if (!response.success || !response.data) {
        setErrorMessage(response.message ?? "Failed to export payment integrity JSON.");
        return;
      }

      downloadJson(response.data, response.data.filename);
      setSuccessMessage(`Exported ${response.data.meta.rowCount} payment integrity row(s) to JSON.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to export payment integrity JSON.",
      );
    } finally {
      setIsExporting(null);
    }
  }

  return (
    <div id="sales-payment-integrity-workbench" className="scroll-mt-24">
      <DashboardPanel
        title="Sales Payment Integrity Workbench"
        description="Backend-backed action workbench for orders without PAID payment records and paid amount mismatches. It does not auto-repair money. Astonishing restraint, but audit will thank us."
        actions={
          <DashboardActions>
            <DashboardActionButton icon={RefreshCw} onClick={() => void loadWorkbench()} disabled={isLoading}>
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
          <div className="grid gap-3 md:grid-cols-4">
            <StatCard
              label="Payment Issues"
              value={isLoading ? "Loading..." : formatNumber(workbench?.summary.totalIssues ?? 0)}
              note="Backend integrity rows"
              icon={ShieldAlert}
              tone="rose"
            />
            <StatCard
              label="Value At Risk"
              value={formatCurrency(workbench?.summary.totalValueAtRisk ?? 0)}
              note="Missing payment + mismatch value"
              icon={AlertTriangle}
              tone="amber"
            />
            <StatCard
              label="Missing PAID Payment"
              value={formatNumber(missingPaymentBucket?.count ?? 0)}
              note={formatCurrency(missingPaymentBucket?.totalValue ?? 0)}
              icon={Search}
              tone="rose"
            />
            <StatCard
              label="Amount Mismatch"
              value={formatNumber(mismatchBucket?.count ?? 0)}
              note={formatCurrency(mismatchBucket?.totalValue ?? 0)}
              icon={AlertTriangle}
              tone="amber"
            />
          </div>

          <div className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
            <div>
              <p className="text-sm font-semibold text-foreground">Synced sales filter scope</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {workbench
                  ? `${formatDateTime(workbench.period.from)} - ${formatDateTime(workbench.period.to)}`
                  : filterContext.label}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{formatFilterSummary(filterContext)}</p>
              {actionMessage && (
                <p className="mt-2 text-xs font-medium text-blue-600">{actionMessage}</p>
              )}
            </div>

            <label className="space-y-1 text-sm font-medium text-foreground">
              Issue Filter
              <select
                value={issue}
                onChange={(event) => setIssue(event.target.value as SalesPaymentIntegrityIssue)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {ISSUE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {successMessage}
            </div>
          )}

          {!isLoading && workbench && workbench.rows.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              No payment integrity issues found for this filter. A rare moment where silence is useful.
            </div>
          )}

          {workbench && workbench.rows.length > 0 && (
            <DataTable
              columns={columns}
              data={workbench.rows}
              getRowKey={(row) => `${row.issueType}-${row.orderId}`}
              minWidth={1280}
              pagination={{ pageSize: 8 }}
            />
          )}
        </div>
      </DashboardPanel>
    </div>
  );
}
