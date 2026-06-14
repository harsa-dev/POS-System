"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Download,
  Landmark,
  RefreshCw,
  Search,
  WalletCards,
  XCircle,
} from "lucide-react";

import { businessModeService } from "@/components/core/business-mode/business-mode-service";
import { StatCard, StatusPill } from "@/features/shared/cards";
import {
  DashboardActionButton,
  DashboardActions,
  DashboardFilters,
  DashboardPanel,
  DashboardShell,
  DashboardTabs,
  getSharedDashboardModeContext,
} from "@/features/shared/dashboard";
import { SearchFilter, SelectFilter, StatusFilter } from "@/features/shared/filters";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import { DataTable, TableToolbar, type DataTableColumn } from "@/features/shared/table";
import {
  cashflowApi,
  type CashflowAccount,
  type CashflowDashboardDto,
  type CashflowEntryDto,
  type CashflowEntryStatus,
  type CashflowEntryType,
  type CashflowQuery,
  type CashflowReconciliationDto,
} from "@/lib/api/cashflow-api";
import { getApiErrorMessage } from "@/lib/api/api-client";

const periodOptions = ["This Month", "Last Month", "Lifetime"] as const;
type CashflowPeriod = (typeof periodOptions)[number];

const viewModes = ["Customers", "Suppliers", "Combined"] as const;
type CashflowViewMode = (typeof viewModes)[number];

const accountOptions = ["All", "CASH", "BANK", "QRIS", "CARD", "TRANSFER", "OTHER"] as const;
type AccountFilter = (typeof accountOptions)[number];

const transactionTypes = [
  "All",
  "INCOME",
  "EXPENSE",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "ADJUSTMENT",
] as const;
type TypeFilter = (typeof transactionTypes)[number];

const statusOptions = ["All", "POSTED", "PENDING", "VOIDED"] as const;
type StatusFilterValue = (typeof statusOptions)[number];

type PaginationState = {
  page?: number;
  limit: number;
  totalItems?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function toIsoDateTime(date: Date) {
  return date.toISOString();
}

function getPeriodRange(period: CashflowPeriod) {
  const now = new Date();

  if (period === "Lifetime") return { from: undefined, to: undefined };

  if (period === "Last Month") {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return {
      from: toIsoDateTime(startOfMonth(lastMonth)),
      to: toIsoDateTime(endOfMonth(lastMonth)),
    };
  }

  return {
    from: toIsoDateTime(startOfMonth(now)),
    to: toIsoDateTime(endOfMonth(now)),
  };
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPeriodLabel(period: CashflowPeriod, from?: string, to?: string) {
  if (!from || !to) return `${period} · all ledger records`;
  return `${period} · ${formatDate(from)} - ${formatDate(to)}`;
}

function displayEnum(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getEntrySignedAmount(entry: CashflowEntryDto) {
  if (entry.status !== "POSTED") return 0;
  if (entry.type === "EXPENSE" || entry.type === "TRANSFER_OUT") return -entry.amount;
  return entry.amount;
}

function getStatusTone(status: CashflowEntryStatus) {
  if (status === "POSTED") return "green";
  if (status === "PENDING") return "amber";
  return "rose";
}

function getTypeTone(type: CashflowEntryType) {
  if (type === "INCOME" || type === "TRANSFER_IN") return "green";
  if (type === "EXPENSE" || type === "TRANSFER_OUT") return "rose";
  return "amber";
}

function getSourceName(entry: CashflowEntryDto) {
  return entry.counterpartyName || entry.sourceId || displayEnum(entry.sourceType);
}

function getViewModeType(viewMode: CashflowViewMode): CashflowEntryType | undefined {
  if (viewMode === "Customers") return "INCOME";
  if (viewMode === "Suppliers") return "EXPENSE";
  return undefined;
}

function calculateDaysInRange(from?: string, to?: string) {
  if (!from || !to) return 30;
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  const day = 1000 * 60 * 60 * 24;
  return Math.max(1, Math.ceil((end - start) / day));
}

function getLedgerHealthStatus(reconciliation: CashflowReconciliationDto | null) {
  if (!reconciliation) {
    return {
      label: "Loading",
      note: "Checking ledger health",
      tone: "slate" as const,
      icon: RefreshCw,
    };
  }

  const criticalCount = reconciliation.issues.filter((issue) => issue.severity === "critical").length;
  const warningCount = reconciliation.issues.filter((issue) => issue.severity === "warning").length;
  const unsyncedCount = reconciliation.unsyncedPaidOrders + reconciliation.unsyncedClosedShifts;

  if (criticalCount > 0 || reconciliation.duplicateSourceWarnings > 0) {
    return {
      label: "Critical",
      note: `${criticalCount + reconciliation.duplicateSourceWarnings} critical ledger issue(s)`,
      tone: "rose" as const,
      icon: XCircle,
    };
  }

  if (warningCount > 0 || unsyncedCount > 0 || reconciliation.pendingEntries > 0) {
    return {
      label: "Needs Review",
      note: `${warningCount + unsyncedCount + reconciliation.pendingEntries} item(s) need review`,
      tone: "amber" as const,
      icon: AlertTriangle,
    };
  }

  return {
    label: "Healthy",
    note: "No active ledger issues detected",
    tone: "green" as const,
    icon: CheckCircle2,
  };
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

function SummaryBars({
  data,
  total,
  tone = "blue",
}: {
  data: Array<{ category: string; amount: number; count: number }>;
  total: number;
  tone?: "blue" | "rose";
}) {
  const color = tone === "blue" ? "bg-blue-600" : "bg-rose-600";

  if (data.length === 0) {
    return <p className="p-4 text-sm text-neutral-500">No category data for this filter.</p>;
  }

  return (
    <div className="space-y-4 p-4">
      {data.map((item) => {
        const percentage = total > 0 ? Math.round((item.amount / total) * 100) : 0;

        return (
          <div key={item.category} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-neutral-700">{item.category}</span>
              <span className="text-neutral-500">
                {formatCurrency(item.amount)} ({percentage}%, {formatNumber(item.count)} tx)
              </span>
            </div>
            <div className="h-2 rounded-full bg-neutral-100">
              <div
                className={`h-full rounded-full ${color}`}
                style={{ width: `${Math.max(percentage, 4)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrendChart({ data }: { data: CashflowDashboardDto["trend"] }) {
  const maxValue = Math.max(
    1,
    ...data.flatMap((item) => [Math.abs(item.income), Math.abs(item.expense), Math.abs(item.balance)]),
  );

  if (data.length === 0) {
    return <p className="p-4 text-sm text-neutral-500">No trend data yet.</p>;
  }

  return (
    <div className="flex h-64 items-end gap-3 p-4">
      {data.map((item) => {
        const label = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(
          new Date(item.period),
        );
        const height = Math.max((Math.abs(item.balance) / maxValue) * 100, 8);

        return (
          <div key={item.period} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-44 w-full items-end rounded-lg bg-neutral-50 px-2">
              <div
                className="w-full rounded-t-md bg-blue-600"
                style={{ height: `${height}%` }}
                title={`Income ${formatCurrency(item.income)} · Expense ${formatCurrency(item.expense)} · Balance ${formatCurrency(item.balance)}`}
              />
            </div>
            <span className="text-xs font-medium text-neutral-500">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function CashflowDashboard() {
  const [period, setPeriod] = useState<CashflowPeriod>("This Month");
  const [sourceAccount, setSourceAccount] = useState<AccountFilter>("All");
  const [viewMode, setViewMode] = useState<CashflowViewMode>("Combined");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modeContext, setModeContext] = useState(() => getSharedDashboardModeContext("cashflow"));

  const [dashboard, setDashboard] = useState<CashflowDashboardDto | null>(null);
  const [reconciliation, setReconciliation] = useState<CashflowReconciliationDto | null>(null);
  const [entries, setEntries] = useState<CashflowEntryDto[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, limit: 25 });
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const periodRange = useMemo(() => getPeriodRange(period), [period]);

  const query = useMemo<CashflowQuery>(() => {
    const viewModeType = getViewModeType(viewMode);
    const explicitType = typeFilter === "All" ? undefined : typeFilter;

    return {
      from: periodRange.from,
      to: periodRange.to,
      account: sourceAccount === "All" ? undefined : sourceAccount,
      type: explicitType ?? viewModeType,
      status: statusFilter === "All" ? undefined : statusFilter,
      search: search.trim() || undefined,
      page,
      limit: 25,
    };
  }, [page, periodRange.from, periodRange.to, search, sourceAccount, statusFilter, typeFilter, viewMode]);

  const exportQuery = useMemo<CashflowQuery>(() => {
    const { page: _page, limit: _limit, ...filters } = query;
    return filters;
  }, [query]);

  const loadCashflow = useCallback(async () => {
    setIsFetching(true);
    setErrorMessage(null);

    try {
      const [dashboardResponse, entriesResponse, reconciliationResponse] = await Promise.all([
        cashflowApi.getDashboard(query),
        cashflowApi.listEntries(query),
        cashflowApi.getReconciliation(),
      ]);

      setDashboard(dashboardResponse.data);
      setEntries(entriesResponse.data);
      setReconciliation(reconciliationResponse.data);
      setPagination(entriesResponse.meta?.pagination ?? { page, limit: 25 });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to load cashflow data."));
    } finally {
      setIsFetching(false);
    }
  }, [modeContext.queryScopeKey, page, query]);

  useEffect(() => {
    return businessModeService.subscribe(() => {
      setModeContext(getSharedDashboardModeContext("cashflow"));
      setPage(1);
    });
  }, []);

  useEffect(() => {
    void loadCashflow();
  }, [loadCashflow]);

  const summary = dashboard?.summary ?? {
    totalIncome: 0,
    totalExpense: 0,
    currentBalance: 0,
    pendingAmount: 0,
    postedCount: 0,
    voidedCount: 0,
  };

  const currentPageCashNet = entries
    .filter((entry) => entry.account === "CASH")
    .reduce((total, entry) => total + getEntrySignedAmount(entry), 0);
  const daysInRange = calculateDaysInRange(periodRange.from, periodRange.to);
  const periodLabel = formatPeriodLabel(period, periodRange.from, periodRange.to);
  const ledgerHealth = getLedgerHealthStatus(reconciliation);
  const displayedIssues = reconciliation?.issues.slice(0, 5) ?? [];

  async function handleVoidEntry(entry: CashflowEntryDto) {
    if (entry.status === "VOIDED") return;
    if (!window.confirm(`Void cashflow entry ${entry.id}? This keeps the audit trail.`)) return;

    setIsSubmitting(true);
    setActionMessage(null);
    try {
      await cashflowApi.voidEntry(entry.id);
      setActionMessage("Cashflow entry voided.");
      await loadCashflow();
    } catch (error) {
      setActionMessage(getApiErrorMessage(error, "Failed to void cashflow entry."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleExportEntries() {
    setIsExporting(true);
    setActionMessage(null);

    try {
      const exportResult = await cashflowApi.downloadEntriesCsv(exportQuery);
      downloadBlob(exportResult.blob, exportResult.filename);
      setActionMessage(
        `Cashflow export ready${exportResult.rowCount === null ? "" : ` · ${formatNumber(exportResult.rowCount)} rows`}.`,
      );
    } catch (error) {
      setActionMessage(getApiErrorMessage(error, "Failed to export cashflow entries."));
    } finally {
      setIsExporting(false);
    }
  }

  const tableColumns: DataTableColumn<CashflowEntryDto>[] = [
    { key: "date", header: "Date", cell: (row) => formatDate(row.occurredAt) },
    { key: "account", header: "Source Account", cell: (row) => displayEnum(row.account) },
    {
      key: "type",
      header: "Type",
      cell: (row) => <StatusPill tone={getTypeTone(row.type)}>{displayEnum(row.type)}</StatusPill>,
    },
    { key: "category", header: "Category", cell: (row) => row.category },
    { key: "source", header: "Customer / Supplier", cell: (row) => getSourceName(row) },
    { key: "description", header: "Description", cell: (row) => row.description ?? "-" },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => <span className="font-semibold text-neutral-950">{formatCurrency(row.amount)}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusPill tone={getStatusTone(row.status)}>{displayEnum(row.status)}</StatusPill>,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <button
          type="button"
          disabled={row.status === "VOIDED" || isSubmitting}
          onClick={() => void handleVoidEntry(row)}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Void
        </button>
      ),
    },
  ];

  return (
    <DashboardShell
      title="Cashflow"
      description={`Server-backed cashflow ledger for the authenticated business. ${periodLabel}.`}
    >
      <DashboardPanel title="Business Cashflow Controls" description="All totals are calculated by backend ledger endpoints, not frontend hardcoded rows.">
        <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2 text-sm font-semibold text-neutral-600">
            <span className="rounded-full bg-neutral-100 px-3 py-1">Authenticated Business Scope</span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{periodLabel}</span>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
              Mode Scope: {modeContext.activeModeShortLabel}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              Query Scope: {modeContext.queryScopeKey}
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              {formatNumber(pagination.totalItems ?? entries.length)} Ledger Entries
            </span>
          </div>
          <DashboardActions>
            <DashboardActionButton icon={RefreshCw} onClick={() => void loadCashflow()} disabled={isFetching}>
              Refresh
            </DashboardActionButton>
            <DashboardActionButton
              icon={Download}
              onClick={() => void handleExportEntries()}
              disabled={isExporting || isFetching}
            >
              {isExporting ? "Exporting..." : "Export"}
            </DashboardActionButton>
          </DashboardActions>
        </div>
      </DashboardPanel>

      {(errorMessage || actionMessage) && (
        <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm font-medium text-neutral-700 shadow-sm">
          {errorMessage ?? actionMessage}
        </div>
      )}

      <TableToolbar
        filters={
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <DashboardFilters className="xl:min-w-[860px]">
              <SelectFilter
                label="Source Account"
                value={sourceAccount}
                options={[...accountOptions]}
                onChange={(value) => {
                  setSourceAccount(value as AccountFilter);
                  setPage(1);
                }}
              />
              <SelectFilter
                label="Transaction Type"
                value={typeFilter}
                options={[...transactionTypes]}
                onChange={(value) => {
                  setTypeFilter(value as TypeFilter);
                  setPage(1);
                }}
              />
              <StatusFilter
                value={statusFilter}
                options={[...statusOptions]}
                onChange={(value) => {
                  setStatusFilter(value as StatusFilterValue);
                  setPage(1);
                }}
              />
            </DashboardFilters>
            <DashboardTabs
              value={viewMode}
              options={[...viewModes]}
              onChange={(value) => {
                setViewMode(value as CashflowViewMode);
                setPage(1);
              }}
            />
          </div>
        }
        actions={
          <div className="max-w-md">
            <SearchFilter
              label="Search transactions"
              value={search}
              placeholder="Search source, category, or notes..."
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
            />
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Income" value={formatCurrency(summary.totalIncome)} note="Posted cash in" icon={ArrowUpRight} tone="green" />
        <StatCard label="Total Expense" value={formatCurrency(summary.totalExpense)} note="Posted cash out" icon={ArrowDownRight} tone="rose" />
        <StatCard label="Current Page Cash" value={formatCurrency(currentPageCashNet)} note="Visible page only, not final balance" icon={WalletCards} tone="amber" />
        <StatCard label="Pending Amount" value={formatCurrency(summary.pendingAmount)} note="Pending ledger value" icon={BarChart3} tone="blue" />
        <StatCard label="Current Balance" value={formatCurrency(summary.currentBalance)} note="Backend ledger balance" icon={Landmark} tone="slate" />
      </div>

      <DashboardPanel title="Ledger Health" description="Backend reconciliation checks for unsynced sources, duplicate source rows, pending entries, and voided ledger records.">
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Health" value={ledgerHealth.label} note={ledgerHealth.note} icon={ledgerHealth.icon} tone={ledgerHealth.tone} />
          <StatCard label="Unsynced Orders" value={formatNumber(reconciliation?.unsyncedPaidOrders ?? 0)} note="Paid orders not in ledger" icon={ArrowUpRight} tone={(reconciliation?.unsyncedPaidOrders ?? 0) > 0 ? "amber" : "green"} />
          <StatCard label="Unsynced Shifts" value={formatNumber(reconciliation?.unsyncedClosedShifts ?? 0)} note="Closed shifts not in ledger" icon={WalletCards} tone={(reconciliation?.unsyncedClosedShifts ?? 0) > 0 ? "amber" : "green"} />
          <StatCard label="Duplicate Sources" value={formatNumber(reconciliation?.duplicateSourceWarnings ?? 0)} note="Possible duplicate source sync" icon={AlertTriangle} tone={(reconciliation?.duplicateSourceWarnings ?? 0) > 0 ? "rose" : "green"} />
          <StatCard label="Pending Entries" value={formatNumber(reconciliation?.pendingEntries ?? 0)} note="Waiting to be posted" icon={BarChart3} tone={(reconciliation?.pendingEntries ?? 0) > 0 ? "amber" : "green"} />
          <StatCard label="Last Synced" value={formatDate(reconciliation?.lastSyncedAt)} note="Latest non-manual source sync" icon={RefreshCw} tone="blue" />
        </div>

        <div className="border-t border-neutral-200 p-4">
          {displayedIssues.length === 0 ? (
            <p className="text-sm font-medium text-neutral-500">No ledger health issues detected for the active business.</p>
          ) : (
            <div className="space-y-3">
              {displayedIssues.map((issue, index) => (
                <div
                  key={`${issue.sourceType}-${issue.sourceId ?? "none"}-${index}`}
                  className="rounded-lg border border-neutral-200 bg-white p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2 font-semibold text-neutral-800">
                    <StatusPill tone={issue.severity === "critical" ? "rose" : issue.severity === "warning" ? "amber" : "blue"}>
                      {displayEnum(issue.severity)}
                    </StatusPill>
                    <span>{displayEnum(issue.sourceType)}</span>
                    {issue.sourceId && <span className="text-neutral-500">· {issue.sourceId}</span>}
                  </div>
                  <p className="mt-2 text-neutral-600">{issue.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardPanel>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <DashboardPanel title="Monthly Cashflow Trend">
          <TrendChart data={dashboard?.trend ?? []} />
        </DashboardPanel>
        <DashboardPanel title="Expense Categories">
          <SummaryBars data={dashboard?.expenseSources ?? []} total={summary.totalExpense} tone="rose" />
        </DashboardPanel>
      </div>

      <DashboardPanel title="Transaction History" description="Paginated server-side ledger entries">
        <DataTable
          columns={tableColumns}
          data={entries}
          getRowKey={(row) => row.id}
          minWidth={1180}
          emptyMessage={isFetching ? "Loading cashflow ledger..." : "No cashflow entries match the active filters."}
          pagination={false}
        />
        <div className="flex flex-col gap-3 border-t border-neutral-200 p-4 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {pagination.page ?? page} of {pagination.totalPages ?? 1} · {formatNumber(pagination.totalItems ?? entries.length)} entries · {modeContext.queryScopeKey}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage || isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-neutral-200 px-3 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage || isFetching}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-neutral-200 px-3 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </DashboardPanel>

      <DashboardPanel title="Cashflow Mode Context" description="Shared dashboards are keyed by active business mode to avoid cross-mode ledger bleed.">
        <div className="grid gap-3 p-4 md:grid-cols-3">
          <StatCard label="Mode" value={modeContext.activeModeShortLabel} note={modeContext.activeModeLabel} icon={Search} tone="blue" />
          <StatCard label="Average Income / Day" value={formatCurrency(summary.totalIncome / daysInRange)} icon={ArrowUpRight} tone="green" />
          <StatCard label="Voided Entries" value={formatNumber(summary.voidedCount)} icon={XCircle} tone="rose" />
        </div>
      </DashboardPanel>
    </DashboardShell>
  );
}
