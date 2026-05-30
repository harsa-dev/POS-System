"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Download,
  Landmark,
  PieChart,
  Search,
  WalletCards,
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
import type {
  AnalyticsDataPoint,
  BusinessScope,
  CashflowPeriod,
  CashflowSourceSummary,
  CashflowTransaction,
  CashflowType,
  CashflowViewMode,
  SourceAccount,
} from "@/features/shared/types";

const businessScopes: BusinessScope[] = [
  "Per Business",
  "Combined Business",
  "Branch Based",
];
const periodOptions: CashflowPeriod[] = ["This Month", "Last Month", "Lifetime"];
const sourceAccounts: SourceAccount[] = ["All", "Cash", "Bank", "QRIS"];
const transactionTypes = ["All", "Income", "Expense"];
const statusOptions = ["All", "Completed", "Pending"];
const viewModes: CashflowViewMode[] = ["Customers", "Suppliers", "Combined"];

const transactions: CashflowTransaction[] = [
  {
    id: "CF-001",
    date: "2026-05-02",
    sourceAccount: "Cash",
    type: "Income",
    category: "Product Sales",
    sourceName: "Walk-in Customers",
    description: "Daily cashier closing",
    amount: 18_400_000,
    status: "Completed",
  },
  {
    id: "CF-002",
    date: "2026-05-05",
    sourceAccount: "Bank",
    type: "Expense",
    category: "Raw Materials",
    sourceName: "Fresh Farm Supplier",
    description: "Weekly ingredient purchase",
    amount: 6_750_000,
    status: "Completed",
  },
  {
    id: "CF-003",
    date: "2026-05-11",
    sourceAccount: "QRIS",
    type: "Income",
    category: "Marketplace",
    sourceName: "Marketplace",
    description: "Online order settlement",
    amount: 9_820_000,
    status: "Completed",
  },
  {
    id: "CF-004",
    date: "2026-05-17",
    sourceAccount: "Bank",
    type: "Expense",
    category: "Operational Costs",
    sourceName: "Utilities",
    description: "Electricity and internet",
    amount: 3_150_000,
    status: "Pending",
  },
  {
    id: "CF-005",
    date: "2026-05-22",
    sourceAccount: "Cash",
    type: "Income",
    category: "Cashier Transfer",
    sourceName: "Branch Cashier",
    description: "Cash transfer from cashier drawer",
    amount: 7_200_000,
    status: "Completed",
  },
];

const monthlyTrend: AnalyticsDataPoint[] = [
  { label: "Jan", value: 42_000_000 },
  { label: "Feb", value: 48_500_000 },
  { label: "Mar", value: 44_300_000 },
  { label: "Apr", value: 53_200_000 },
  { label: "May", value: 58_100_000 },
];

const incomeSources: CashflowSourceSummary[] = [
  { name: "Product Sales", amount: 36_800_000, percentage: 63 },
  { name: "Cashier Transfer", amount: 12_400_000, percentage: 21 },
  { name: "Marketplace", amount: 9_820_000, percentage: 16 },
];

const expenseSources: CashflowSourceSummary[] = [
  { name: "Raw Materials", amount: 18_600_000, percentage: 54 },
  { name: "Bank Transfer", amount: 8_900_000, percentage: 26 },
  { name: "Operational Costs", amount: 6_850_000, percentage: 20 },
];

function SummaryBars({
  data,
  tone = "blue",
}: {
  data: CashflowSourceSummary[];
  tone?: "blue" | "rose";
}) {
  const color = tone === "blue" ? "bg-blue-600" : "bg-rose-600";

  return (
    <div className="space-y-4 p-4">
      {data.map((item) => (
        <div key={item.name} className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-neutral-700">{item.name}</span>
            <span className="text-neutral-500">
              {formatCurrency(item.amount)} ({item.percentage}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-neutral-100">
            <div
              className={`h-full rounded-full ${color}`}
              style={{ width: `${item.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ data }: { data: AnalyticsDataPoint[] }) {
  const maxValue = Math.max(...data.map((item) => item.value));

  return (
    <div className="flex h-64 items-end gap-3 p-4">
      {data.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-44 w-full items-end rounded-lg bg-neutral-50 px-2">
            <div
              className="w-full rounded-t-md bg-blue-600"
              style={{ height: `${Math.max((item.value / maxValue) * 100, 12)}%` }}
            />
          </div>
          <span className="text-xs font-medium text-neutral-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function getStatusTone(status: CashflowTransaction["status"]) {
  return status === "Completed" ? "green" : "amber";
}

function getTypeTone(type: CashflowType) {
  return type === "Income" ? "green" : "rose";
}

export function CashflowDashboard() {
  const [businessScope, setBusinessScope] = useState<BusinessScope>("Per Business");
  const [period, setPeriod] = useState<CashflowPeriod>("This Month");
  const [sourceAccount, setSourceAccount] = useState<SourceAccount>("All");
  const [viewMode, setViewMode] = useState<CashflowViewMode>("Combined");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  const filteredRows = useMemo(() => {
    return transactions.filter((row) => {
      const sourceMatches =
        sourceAccount === "All" || row.sourceAccount === sourceAccount;
      const typeMatches = typeFilter === "All" || row.type === typeFilter;
      const statusMatches = statusFilter === "All" || row.status === statusFilter;
      const viewMatches =
        viewMode === "Combined" ||
        (viewMode === "Customers" && row.type === "Income") ||
        (viewMode === "Suppliers" && row.type === "Expense");
      const searchMatches = [row.category, row.sourceName, row.description]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      return sourceMatches && typeMatches && statusMatches && viewMatches && searchMatches;
    });
  }, [search, sourceAccount, statusFilter, typeFilter, viewMode]);

  const totalIncome = transactions
    .filter((row) => row.type === "Income")
    .reduce((total, row) => total + row.amount, 0);
  const totalExpense = transactions
    .filter((row) => row.type === "Expense")
    .reduce((total, row) => total + row.amount, 0);
  const startingCapital = 25_000_000;
  const currentBalance = startingCapital + totalIncome - totalExpense;
  const cashDrawerBalance = transactions
    .filter((row) => row.sourceAccount === "Cash")
    .reduce(
      (total, row) => total + (row.type === "Income" ? row.amount : -row.amount),
      0,
    );

  const tableColumns: DataTableColumn<CashflowTransaction>[] = [
    { key: "date", header: "Date", cell: (row) => row.date },
    { key: "sourceAccount", header: "Source Account", cell: (row) => row.sourceAccount },
    {
      key: "type",
      header: "Type",
      cell: (row) => <StatusPill tone={getTypeTone(row.type)}>{row.type}</StatusPill>,
    },
    { key: "category", header: "Category", cell: (row) => row.category },
    { key: "sourceName", header: "Customer / Supplier", cell: (row) => row.sourceName },
    { key: "description", header: "Description", cell: (row) => row.description },
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
      cell: (row) => <StatusPill tone={getStatusTone(row.status)}>{row.status}</StatusPill>,
    },
  ];

  return (
    <DashboardShell
      title="Cashflow"
      description={`Date Summary: 1 May - 31 May 2026. Viewing ${businessScope.toLowerCase()} for ${period.toLowerCase()}.`}
    >
      <DashboardPanel title="Business Worksheet / Branch Selector">
        <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <DashboardTabs
            value={businessScope}
            options={businessScopes}
            onChange={(value) => setBusinessScope(value as BusinessScope)}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <DashboardTabs
              value={period}
              options={periodOptions}
              onChange={(value) => setPeriod(value as CashflowPeriod)}
            />
            <DashboardActions>
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
                    filename: "cashflow-transactions",
                    rows: filteredRows,
                    columns: [
                      { key: "date", header: "Date", value: (row) => row.date },
                      { key: "account", header: "Source Account", value: (row) => row.sourceAccount },
                      { key: "type", header: "Type", value: (row) => row.type },
                      { key: "category", header: "Category", value: (row) => row.category },
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

      <DashboardPanel>
        <TableToolbar
          filters={
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <DashboardFilters className="xl:min-w-[760px]">
                <SelectFilter
                  label="Source Account"
                  value={sourceAccount}
                  options={sourceAccounts}
                  onChange={(value) => setSourceAccount(value as SourceAccount)}
                />
                <SelectFilter
                  label="Transaction Type"
                  value={typeFilter}
                  options={transactionTypes}
                  onChange={setTypeFilter}
                />
                <StatusFilter
                  value={statusFilter}
                  options={statusOptions}
                  onChange={setStatusFilter}
                />
              </DashboardFilters>
              <DashboardTabs
                value={viewMode}
                options={viewModes}
                onChange={(value) => setViewMode(value as CashflowViewMode)}
              />
            </div>
          }
          actions={
            <div className="max-w-md">
              <SearchFilter
                label="Search transactions"
                value={search}
                placeholder="Search source, category, or notes..."
                onChange={setSearch}
              />
            </div>
          }
        />
      </DashboardPanel>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Starting Capital" value={formatCurrency(startingCapital)} note="Opening balance" icon={Landmark} tone="blue" />
        <StatCard label="Total Expense" value={formatCurrency(totalExpense)} note="Cash out this period" icon={ArrowDownRight} tone="rose" />
        <StatCard label="Cash Drawer Balance" value={formatCurrency(cashDrawerBalance)} note="Cash account only" icon={WalletCards} tone="amber" />
        <StatCard label="Total Income" value={formatCurrency(totalIncome)} note="Cash in this period" icon={ArrowUpRight} tone="green" />
        <StatCard label="Current Balance" value={formatCurrency(currentBalance)} note="Capital + income - expense" icon={WalletCards} tone="slate" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <DashboardPanel title="Monthly Cashflow Trend">
          <TrendChart data={monthlyTrend} />
        </DashboardPanel>
        <DashboardPanel title="Expense Categories">
          <SummaryBars data={expenseSources} tone="rose" />
        </DashboardPanel>
      </div>

      <DashboardPanel title="Transaction History" description="Income / Expense view">
        <DataTable
          columns={tableColumns}
          data={filteredRows}
          getRowKey={(row) => row.id}
          minWidth={1040}
        />
      </DashboardPanel>

      {isAnalysisOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <section className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-neutral-950">
                  Cashflow Analysis
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Analysis Date: 1 May - 31 May 2026
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAnalysisOpen(false)}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold hover:bg-neutral-50"
              >
                Close
              </button>
            </div>
            <div className="grid gap-4 p-5 lg:grid-cols-2">
              <DashboardPanel title="Income Card">
                <div className="grid gap-3 p-4 sm:grid-cols-3">
                  <StatCard label="Total Income" value={formatCurrency(totalIncome)} icon={ArrowUpRight} tone="green" />
                  <StatCard label="Total Transactions" value={formatNumber(3)} icon={Search} tone="slate" />
                  <StatCard label="Growth Percentage" value="+12.8%" icon={BarChart3} tone="blue" />
                </div>
              </DashboardPanel>
              <DashboardPanel title="Expense Card">
                <div className="grid gap-3 p-4 sm:grid-cols-3">
                  <StatCard label="Total Expense" value={formatCurrency(totalExpense)} icon={ArrowDownRight} tone="rose" />
                  <StatCard label="Total Transactions" value={formatNumber(2)} icon={Search} tone="slate" />
                  <StatCard label="Growth Percentage" value="+4.6%" icon={BarChart3} tone="amber" />
                </div>
              </DashboardPanel>
              <DashboardPanel title="Daily Average">
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  <StatCard label="Income / Day" value={formatCurrency(totalIncome / 31)} icon={ArrowUpRight} tone="green" />
                  <StatCard label="Expense / Day" value={formatCurrency(totalExpense / 31)} icon={ArrowDownRight} tone="rose" />
                </div>
              </DashboardPanel>
              <DashboardPanel title="Profit Summary">
                <div className="grid gap-3 p-4 sm:grid-cols-3">
                  <StatCard label="Gross Profit" value={formatCurrency(38_900_000)} icon={WalletCards} tone="green" />
                  <StatCard label="Operating Profit" value={formatCurrency(28_750_000)} icon={PieChart} tone="blue" />
                  <StatCard label="Net Income" value={formatCurrency(totalIncome - totalExpense)} icon={Landmark} tone="slate" />
                </div>
              </DashboardPanel>
              <DashboardPanel title="COGS Ratio" description="COGS vs Revenue">
                <div className="p-4">
                  <div className="h-4 rounded-full bg-neutral-100">
                    <div className="h-full w-[38%] rounded-full bg-amber-500" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-neutral-700">
                    38% COGS ratio against revenue
                  </p>
                </div>
              </DashboardPanel>
              <DashboardPanel title="Largest Income Sources">
                <SummaryBars data={incomeSources} />
              </DashboardPanel>
              <DashboardPanel title="Largest Expense Sources">
                <SummaryBars data={expenseSources} tone="rose" />
              </DashboardPanel>
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
