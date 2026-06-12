"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Download,
  Landmark,
  Link2,
  Plus,
  RefreshCw,
  Search,
  WalletCards,
  XCircle,
} from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import {
  DashboardActionButton,
  DashboardActions,
  DashboardFilters,
  DashboardPanel,
  DashboardShell,
  DashboardTabs,
} from "@/features/shared/dashboard";
import { exportCsv } from "@/features/shared/export";
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

const defaultEntryForm = {
  account: "CASH" as CashflowAccount,
  type: "EXPENSE" as CashflowEntryType,
  status: "POSTED" as CashflowEntryStatus,
  category: "Operational",
  counterpartyName: "",
  description: "",
  amount: "",
  occurredAt: new Date().toISOString().slice(0, 10),
};

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

  const [dashboard, setDashboard] = useState<CashflowDashboardDto | null>(null);
  const [entries, setEntries] = useState<CashflowEntryDto[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, limit: 25 });
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [entryForm, setEntryForm] = useState(defaultEntryForm);
  const [syncForm, setSyncForm] = useState({ orderId: "", shiftId: "" });

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

  const loadCashflow = useCallback(async () => {
    setIsFetching(true);
    setErrorMessage(null);

    try {
      const [dashboardResponse, entriesResponse] = await Promise.all([
        cashflowApi.getDashboard(query),
        cashflowApi.listEntries(query),
      ]);

      setDashboard(dashboardResponse.data);
      setEntries(entriesResponse.data);
      setPagination(entriesResponse.meta?.pagination ?? { page, limit: 25 });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to load cashflow data."));
    } finally {
      setIsFetching(false);
    }
  }, [page, query]);

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

  const cashDrawerBalance = entries
    .filter((entry) => entry.account === "CASH")
    .reduce((total, entry) => total + getEntrySignedAmount(entry), 0);

  const daysInRange = calculateDaysInRange(periodRange.from, periodRange.to);
  const periodLabel = formatPeriodLabel(period, periodRange.from, periodRange.to);

  async function handleCreateManualEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionMessage(null);

    const amount = Number(entryForm.amount);
    if (!entryForm.category.trim() || !Number.isInteger(amount) || amount <= 0) {
      setActionMessage("Category and a positive integer amount are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await cashflowApi.createEntry({
        account: entryForm.account,
        type: entryForm.type,
        status: entryForm.status,
        category: entryForm.category.trim(),
        counterpartyName: entryForm.counterpartyName.trim() || undefined,
        description: entryForm.description.trim() || undefined,
        amount,
        occurredAt: entryForm.occurredAt
          ? new Date(entryForm.occurredAt).toISOString()
          : undefined,
      });

      setEntryForm(defaultEntryForm);
      setIsManualEntryOpen(false);
      setActionMessage("Manual cashflow entry created.");
      await loadCashflow();
    } catch (error) {
      setActionMessage(getApiErrorMessage(error, "Failed to create cashflow entry."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSyncOrder() {
    const orderId = syncForm.orderId.trim();
    if (!orderId) {
      setActionMessage("Order ID is required before syncing order payment.");
      return;
    }

    setIsSubmitting(true);
    setActionMessage(null);
    try {
      await cashflowApi.syncOrder(orderId);
      setSyncForm((current) => ({ ...current, orderId: "" }));
      setActionMessage("Order payment synced to cashflow.");
      await loadCashflow();
    } catch (error) {
      setActionMessage(getApiErrorMessage(error, "Failed to sync order payment."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSyncShift() {
    const shiftId = syncForm.shiftId.trim();
    if (!shiftId) {
      setActionMessage("Shift ID is required before syncing shift close.");
      return;
    }

    setIsSubmitting(true);
    setActionMessage(null);
    try {
      await cashflowApi.syncShift(shiftId);
      setSyncForm((current) => ({ ...current, shiftId: "" }));
      setActionMessage("Shift close synced to cashflow.");
      await loadCashflow();
    } catch (error) {
      setActionMessage(getApiErrorMessage(error, "Failed to sync shift close."));
    } finally {
      setIsSubmitting(false);
    }
  }

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
      cell: (row) => (
        <span className="font-semibold text-neutral-950">
          {formatCurrency(row.amount)}
        </span>
      ),
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
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              {formatNumber(pagination.totalItems ?? entries.length)} Ledger Entries
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <DashboardTabs
              value={period}
              options={[...periodOptions]}
              onChange={(value) => {
                setPeriod(value as CashflowPeriod);
                setPage(1);
              }}
            />
            <DashboardActions>
              <DashboardActionButton icon={RefreshCw} onClick={() => void loadCashflow()} disabled={isFetching}>
                Refresh
              </DashboardActionButton>
              <DashboardActionButton icon={Plus} variant="primary" onClick={() => setIsManualEntryOpen(true)}>
                Manual Entry
              </DashboardActionButton>
              <DashboardActionButton icon={Link2} onClick={() => setIsSyncOpen(true)}>
                Sync Source
              </DashboardActionButton>
              <DashboardActionButton
                icon={BarChart3}
                variant="primary"
                onClick={() => setIsAnalysisOpen(true)}
              >
                Analysis
              </DashboardActionButton>
              <DashboardActionButton
                icon={Download}
                onClick={() =>
                  exportCsv({
                    filename: "cashflow-ledger-entries",
                    rows: entries,
                    columns: [
                      { key: "date", header: "Date", value: (row) => formatDateTime(row.occurredAt) },
                      { key: "account", header: "Source Account", value: (row) => row.account },
                      { key: "type", header: "Type", value: (row) => row.type },
                      { key: "status", header: "Status", value: (row) => row.status },
                      { key: "sourceType", header: "Source Type", value: (row) => row.sourceType },
                      { key: "sourceId", header: "Source ID", value: (row) => row.sourceId ?? "" },
                      { key: "category", header: "Category", value: (row) => row.category },
                      { key: "counterparty", header: "Customer / Supplier", value: (row) => row.counterpartyName ?? "" },
                      { key: "amount", header: "Amount", value: (row) => row.amount },
                    ],
                  })
                }
              >
                Export
              </DashboardActionButton>
            </DashboardActions>
          </div>
        </div>
      </DashboardPanel>

      {(errorMessage || actionMessage) && (
        <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm font-medium text-neutral-700 shadow-sm">
          {errorMessage ?? actionMessage}
        </div>
      )}

      <DashboardPanel>
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
      </DashboardPanel>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Income" value={formatCurrency(summary.totalIncome)} note="Posted cash in" icon={ArrowUpRight} tone="green" />
        <StatCard label="Total Expense" value={formatCurrency(summary.totalExpense)} note="Posted cash out" icon={ArrowDownRight} tone="rose" />
        <StatCard label="Cash Drawer Balance" value={formatCurrency(cashDrawerBalance)} note="Current page cash ledger" icon={WalletCards} tone="amber" />
        <StatCard label="Pending Amount" value={formatCurrency(summary.pendingAmount)} note="Pending ledger value" icon={Search} tone="blue" />
        <StatCard label="Current Balance" value={formatCurrency(summary.currentBalance)} note="Backend ledger balance" icon={Landmark} tone="slate" />
      </div>

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
        />
        <div className="flex flex-col gap-3 border-t border-neutral-200 p-4 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {pagination.page ?? page} of {pagination.totalPages ?? 1} · {formatNumber(pagination.totalItems ?? entries.length)} entries
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

      {isManualEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <section className="w-full max-w-3xl rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-neutral-950">Create Manual Cashflow Entry</h2>
                <p className="mt-1 text-sm text-neutral-500">Manual entries are written through backend validation and audit logs.</p>
              </div>
              <button type="button" onClick={() => setIsManualEntryOpen(false)} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold hover:bg-neutral-50">
                Close
              </button>
            </div>
            <form onSubmit={handleCreateManualEntry} className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-neutral-700">
                Account
                <select value={entryForm.account} onChange={(event) => setEntryForm((current) => ({ ...current, account: event.target.value as CashflowAccount }))} className="w-full rounded-lg border border-neutral-200 px-3 py-2">
                  {accountOptions.filter((option) => option !== "All").map((account) => <option key={account} value={account}>{displayEnum(account)}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-neutral-700">
                Type
                <select value={entryForm.type} onChange={(event) => setEntryForm((current) => ({ ...current, type: event.target.value as CashflowEntryType }))} className="w-full rounded-lg border border-neutral-200 px-3 py-2">
                  {transactionTypes.filter((option) => option !== "All").map((type) => <option key={type} value={type}>{displayEnum(type)}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-neutral-700">
                Status
                <select value={entryForm.status} onChange={(event) => setEntryForm((current) => ({ ...current, status: event.target.value as CashflowEntryStatus }))} className="w-full rounded-lg border border-neutral-200 px-3 py-2">
                  {statusOptions.filter((option) => option !== "All").map((status) => <option key={status} value={status}>{displayEnum(status)}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-neutral-700">
                Amount
                <input value={entryForm.amount} onChange={(event) => setEntryForm((current) => ({ ...current, amount: event.target.value }))} type="number" min="1" step="1" className="w-full rounded-lg border border-neutral-200 px-3 py-2" />
              </label>
              <label className="space-y-2 text-sm font-semibold text-neutral-700">
                Category
                <input value={entryForm.category} onChange={(event) => setEntryForm((current) => ({ ...current, category: event.target.value }))} className="w-full rounded-lg border border-neutral-200 px-3 py-2" />
              </label>
              <label className="space-y-2 text-sm font-semibold text-neutral-700">
                Occurred At
                <input value={entryForm.occurredAt} onChange={(event) => setEntryForm((current) => ({ ...current, occurredAt: event.target.value }))} type="date" className="w-full rounded-lg border border-neutral-200 px-3 py-2" />
              </label>
              <label className="space-y-2 text-sm font-semibold text-neutral-700">
                Customer / Supplier
                <input value={entryForm.counterpartyName} onChange={(event) => setEntryForm((current) => ({ ...current, counterpartyName: event.target.value }))} className="w-full rounded-lg border border-neutral-200 px-3 py-2" />
              </label>
              <label className="space-y-2 text-sm font-semibold text-neutral-700 sm:col-span-2">
                Description
                <textarea value={entryForm.description} onChange={(event) => setEntryForm((current) => ({ ...current, description: event.target.value }))} className="min-h-24 w-full rounded-lg border border-neutral-200 px-3 py-2" />
              </label>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <button type="button" onClick={() => setIsManualEntryOpen(false)} className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                  {isSubmitting ? "Saving..." : "Create Entry"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isSyncOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <section className="w-full max-w-2xl rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-neutral-950">Sync Source To Cashflow</h2>
                <p className="mt-1 text-sm text-neutral-500">Sync uses backend idempotency keys, so the same source will not create duplicate ledger entries.</p>
              </div>
              <button type="button" onClick={() => setIsSyncOpen(false)} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold hover:bg-neutral-50">
                Close
              </button>
            </div>
            <div className="grid gap-4 p-5">
              <div className="rounded-lg border border-neutral-200 p-4">
                <label className="space-y-2 text-sm font-semibold text-neutral-700">
                  Order ID
                  <input value={syncForm.orderId} onChange={(event) => setSyncForm((current) => ({ ...current, orderId: event.target.value }))} placeholder="Paste paid order id" className="w-full rounded-lg border border-neutral-200 px-3 py-2" />
                </label>
                <button type="button" disabled={isSubmitting} onClick={() => void handleSyncOrder()} className="mt-3 rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                  Sync Order Payment
                </button>
              </div>
              <div className="rounded-lg border border-neutral-200 p-4">
                <label className="space-y-2 text-sm font-semibold text-neutral-700">
                  Shift ID
                  <input value={syncForm.shiftId} onChange={(event) => setSyncForm((current) => ({ ...current, shiftId: event.target.value }))} placeholder="Paste closed shift id" className="w-full rounded-lg border border-neutral-200 px-3 py-2" />
                </label>
                <button type="button" disabled={isSubmitting} onClick={() => void handleSyncShift()} className="mt-3 rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                  Sync Shift Close
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {isAnalysisOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <section className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-neutral-950">Cashflow Analysis</h2>
                <p className="mt-1 text-sm text-neutral-500">Analysis Date: {periodLabel}</p>
              </div>
              <button type="button" onClick={() => setIsAnalysisOpen(false)} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold hover:bg-neutral-50">
                Close
              </button>
            </div>
            <div className="grid gap-4 p-5 lg:grid-cols-2">
              <DashboardPanel title="Income Card">
                <div className="grid gap-3 p-4 sm:grid-cols-3">
                  <StatCard label="Total Income" value={formatCurrency(summary.totalIncome)} icon={ArrowUpRight} tone="green" />
                  <StatCard label="Posted Entries" value={formatNumber(summary.postedCount)} icon={Search} tone="slate" />
                  <StatCard label="Pending Amount" value={formatCurrency(summary.pendingAmount)} icon={BarChart3} tone="blue" />
                </div>
              </DashboardPanel>
              <DashboardPanel title="Expense Card">
                <div className="grid gap-3 p-4 sm:grid-cols-3">
                  <StatCard label="Total Expense" value={formatCurrency(summary.totalExpense)} icon={ArrowDownRight} tone="rose" />
                  <StatCard label="Voided Entries" value={formatNumber(summary.voidedCount)} icon={XCircle} tone="rose" />
                  <StatCard label="Net Balance" value={formatCurrency(summary.currentBalance)} icon={WalletCards} tone="slate" />
                </div>
              </DashboardPanel>
              <DashboardPanel title="Daily Average">
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  <StatCard label="Income / Day" value={formatCurrency(summary.totalIncome / daysInRange)} icon={ArrowUpRight} tone="green" />
                  <StatCard label="Expense / Day" value={formatCurrency(summary.totalExpense / daysInRange)} icon={ArrowDownRight} tone="rose" />
                </div>
              </DashboardPanel>
              <DashboardPanel title="Ledger Health">
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  <StatCard label="Server Entries" value={formatNumber(pagination.totalItems ?? entries.length)} icon={Landmark} tone="blue" />
                  <StatCard label="Current Page" value={formatNumber(entries.length)} icon={Search} tone="slate" />
                </div>
              </DashboardPanel>
              <DashboardPanel title="Largest Income Sources">
                <SummaryBars data={dashboard?.incomeSources ?? []} total={summary.totalIncome} />
              </DashboardPanel>
              <DashboardPanel title="Largest Expense Sources">
                <SummaryBars data={dashboard?.expenseSources ?? []} total={summary.totalExpense} tone="rose" />
              </DashboardPanel>
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
