"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Download,
  FileText,
  RefreshCw,
  WalletCards,
} from "lucide-react";

import { StatCard } from "@/features/shared/cards";
import {
  DashboardActionButton,
  DashboardActions,
  DashboardFilters,
  DashboardPanel,
  DashboardShell,
} from "@/features/shared/dashboard";
import { exportPdf } from "@/features/shared/export";
import { SelectFilter } from "@/features/shared/filters";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import { DataTable, TableToolbar, type DataTableColumn } from "@/features/shared/table";
import type {
  AnalyticsDataPoint,
  CashflowTransaction,
  FinancialDataSource,
  FinancialSourceInput,
  FinancialTrendPoint,
  ProfitLossLine,
} from "@/features/shared/types";

const dataSources: { name: FinancialDataSource; description: string }[] = [
  {
    name: "Recap + Cashflow",
    description:
      "Revenue and COGS from Sales Recap, Operational Cost from Cashflow",
  },
  {
    name: "Cashflow Only",
    description: "All data comes from business cashflow",
  },
  {
    name: "Recap Only",
    description: "Only sales recap data",
  },
];

const sourceInputs: FinancialSourceInput[] = [
  { label: "Recap Source", value: "Sales Recap - May 2026" },
  { label: "Cashflow Source", value: "Cashflow - Main Branch" },
  { label: "Warehouse Source", value: "Warehouse COGS - May 2026" },
];

const sixMonthTrend: FinancialTrendPoint[] = [
  { label: "Dec", revenue: 92_000_000, netProfit: 18_500_000 },
  { label: "Jan", revenue: 96_000_000, netProfit: 21_200_000 },
  { label: "Feb", revenue: 88_500_000, netProfit: 17_400_000 },
  { label: "Mar", revenue: 102_300_000, netProfit: 24_900_000 },
  { label: "Apr", revenue: 108_700_000, netProfit: 27_300_000 },
  { label: "May", revenue: 116_400_000, netProfit: 31_800_000 },
];

const bestSellingProducts: AnalyticsDataPoint[] = [
  { label: "Chicken Rice Bowl", value: 148 },
  { label: "Iced Latte", value: 132 },
  { label: "Lemon Tea", value: 98 },
  { label: "Matcha Dessert", value: 74 },
];

const profitLossRows: ProfitLossLine[] = [
  { label: "Sales Revenue", amount: 116_400_000, tone: "positive" },
  { label: "Cost of Goods Sold", amount: -44_200_000, tone: "negative" },
  { label: "Gross Profit", amount: 72_200_000, tone: "total" },
  { label: "Expenses", amount: -21_800_000, tone: "negative" },
  { label: "Discounts", amount: -6_400_000, tone: "negative" },
  { label: "Marketplace Fees", amount: -3_900_000, tone: "negative" },
  { label: "Total Expenses", amount: -32_100_000, tone: "total" },
  { label: "Net Profit", amount: 40_100_000, tone: "positive" },
];

const cashInRows: CashflowTransaction[] = [
  {
    id: "IN-001",
    date: "2026-05-04",
    sourceAccount: "Cash",
    type: "Income",
    category: "Product Sales",
    sourceName: "Main Branch",
    description: "Cashier close",
    amount: 18_400_000,
    status: "Completed",
  },
  {
    id: "IN-002",
    date: "2026-05-11",
    sourceAccount: "QRIS",
    type: "Income",
    category: "Marketplace",
    sourceName: "Marketplace",
    description: "Settlement",
    amount: 12_800_000,
    status: "Completed",
  },
];

const cashOutRows: CashflowTransaction[] = [
  {
    id: "OUT-001",
    date: "2026-05-08",
    sourceAccount: "Bank",
    type: "Expense",
    category: "Raw Materials",
    sourceName: "Fresh Farm Supplier",
    description: "Ingredient purchase",
    amount: 9_600_000,
    status: "Completed",
  },
  {
    id: "OUT-002",
    date: "2026-05-19",
    sourceAccount: "Bank",
    type: "Expense",
    category: "Operational Costs",
    sourceName: "Utilities",
    description: "Monthly bills",
    amount: 4_300_000,
    status: "Completed",
  },
];

function TrendChart({ data }: { data: FinancialTrendPoint[] }) {
  const maxValue = Math.max(...data.map((item) => item.revenue));

  return (
    <div className="space-y-4 p-4">
      {data.map((item) => (
        <div key={item.label} className="grid grid-cols-[48px_1fr_110px] items-center gap-3">
          <span className="text-sm font-medium text-neutral-500">{item.label}</span>
          <div className="space-y-1">
            <div className="h-2 rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${Math.max((item.revenue / maxValue) * 100, 8)}%` }}
              />
            </div>
            <div className="h-2 rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${Math.max((item.netProfit / maxValue) * 100, 8)}%` }}
              />
            </div>
          </div>
          <span className="text-right text-xs text-neutral-500">
            {formatCurrency(item.netProfit)}
          </span>
        </div>
      ))}
    </div>
  );
}

function SimpleRanking({ data }: { data: AnalyticsDataPoint[] }) {
  const maxValue = Math.max(...data.map((item) => item.value));

  return (
    <div className="space-y-4 p-4">
      {data.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-neutral-700">{item.label}</span>
            <span className="text-neutral-500">{formatNumber(item.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${Math.max((item.value / maxValue) * 100, 8)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CompactCalendar() {
  return (
    <div className="grid grid-cols-7 gap-1 rounded-lg border border-neutral-200 bg-white p-3 text-center text-xs">
      {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
        <div key={`${day}-${index}`} className="py-1 font-semibold text-neutral-400">
          {day}
        </div>
      ))}
      {Array.from({ length: 31 }).map((_, index) => {
        const day = index + 1;
        const isSelected = day === 1 || day === 31;

        return (
          <div
            key={day}
            className={`rounded-md py-1.5 ${
              isSelected
                ? "bg-neutral-950 font-semibold text-white"
                : "text-neutral-600"
            }`}
          >
            {day}
          </div>
        );
      })}
    </div>
  );
}

function getProfitLossClass(tone: ProfitLossLine["tone"]) {
  if (tone === "positive") return "font-semibold text-emerald-700";
  if (tone === "negative") return "font-semibold text-rose-700";
  if (tone === "total") return "font-bold text-neutral-950";

  return "text-neutral-700";
}

export function FinancialReportsDashboard() {
  const [selectedSource, setSelectedSource] =
    useState<FinancialDataSource>("Recap + Cashflow");
  const [period, setPeriod] = useState("May 2026");

  const totalRevenue = 116_400_000;
  const grossProfit = 72_200_000;
  const netProfit = 40_100_000;
  const receivables = 8_750_000;
  const cashIn = cashInRows.reduce((total, row) => total + row.amount, 0);
  const cashOut = cashOutRows.reduce((total, row) => total + row.amount, 0);

  const plColumns: DataTableColumn<ProfitLossLine>[] = [
    { key: "label", header: "Line Item", cell: (row) => row.label },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      cell: (row) => (
        <span className={getProfitLossClass(row.tone)}>
          {formatCurrency(row.amount)}
        </span>
      ),
    },
  ];

  const cashColumns: DataTableColumn<CashflowTransaction>[] = [
    { key: "date", header: "Date", cell: (row) => row.date },
    { key: "sourceAccount", header: "Source Account", cell: (row) => row.sourceAccount },
    { key: "category", header: "Category", cell: (row) => row.category },
    { key: "sourceName", header: "Source", cell: (row) => row.sourceName },
    { key: "description", header: "Description", cell: (row) => row.description },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => <span className="font-semibold">{formatCurrency(row.amount)}</span>,
    },
  ];

  return (
    <DashboardShell
      title="Financial Reports"
      description={`Date Summary: 1 May - 31 May 2026. Active period: ${period}.`}
    >
      <DashboardPanel>
        <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-950">1 May - 31 May 2026</p>
              <p className="text-xs text-neutral-500">Monthly financial report</p>
            </div>
          </div>
          <DashboardActions>
            <DashboardActionButton
              icon={Download}
              onClick={exportPdf}
            >
              Export PDF
            </DashboardActionButton>
            <DashboardActionButton icon={RefreshCw}>Refresh</DashboardActionButton>
          </DashboardActions>
        </div>
      </DashboardPanel>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <DashboardPanel title="Period Section" description="Monthly Period Selector">
          <div className="p-4">
            <DashboardFilters className="md:grid-cols-1">
              <SelectFilter
                label="Monthly Period Selector"
                value={period}
                options={["March 2026", "April 2026", "May 2026"]}
                onChange={setPeriod}
              />
            </DashboardFilters>
          </div>
        </DashboardPanel>
        <DashboardPanel title="Compact Calendar">
          <div className="p-4">
            <CompactCalendar />
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel title="Data Sources Section">
        <div className="grid gap-4 p-4 xl:grid-cols-[1fr_360px]">
          <div className="grid gap-3 md:grid-cols-3">
            {dataSources.map((source) => {
              const isActive = source.name === selectedSource;

              return (
                <button
                  key={source.name}
                  type="button"
                  onClick={() => setSelectedSource(source.name)}
                  className={`rounded-lg border p-4 text-left transition ${
                    isActive
                      ? "border-blue-300 bg-blue-50"
                      : "border-neutral-200 bg-white hover:bg-neutral-50"
                  }`}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-neutral-700 ring-1 ring-neutral-200">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-neutral-950">{source.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    {source.description}
                  </p>
                </button>
              );
            })}
          </div>
          <div className="grid gap-3">
            {sourceInputs.map((input) => (
              <SelectFilter
                key={input.label}
                label={input.label}
                value={input.value}
                options={[input.value, "Manual Upload", "Latest Synced Data"]}
                onChange={() => undefined}
              />
            ))}
          </div>
        </div>
      </DashboardPanel>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} note={selectedSource} icon={ArrowUpRight} tone="green" />
        <StatCard label="Gross Profit" value={formatCurrency(grossProfit)} note="Revenue minus COGS" icon={BarChart3} tone="blue" />
        <StatCard label="Net Profit" value={formatCurrency(netProfit)} note="After expenses and fees" icon={WalletCards} tone="slate" />
        <StatCard label="Receivables" value={formatCurrency(receivables)} note="Outstanding payment" icon={FileText} tone="amber" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardPanel title="6 Month Trend" description="Revenue and net profit">
          <TrendChart data={sixMonthTrend} />
        </DashboardPanel>
        <DashboardPanel title="Best Selling Products">
          <SimpleRanking data={bestSellingProducts} />
        </DashboardPanel>
      </div>

      <DashboardPanel title="Profit & Loss Section">
        <DataTable
          columns={plColumns}
          data={profitLossRows}
          getRowKey={(row) => row.label}
          minWidth={620}
        />
      </DashboardPanel>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Cash In" value={formatCurrency(cashIn)} note="Income data" icon={ArrowUpRight} tone="green" />
        <StatCard label="Cash Out" value={formatCurrency(cashOut)} note="Expense data" icon={ArrowDownRight} tone="rose" />
        <StatCard label="Net Cashflow" value={formatCurrency(cashIn - cashOut)} note="Cash in minus cash out" icon={WalletCards} tone="blue" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardPanel title="Cash In Data">
          <TableToolbar
            actions={
              <DashboardActions>
                <DashboardActionButton icon={Download}>Export Cash In</DashboardActionButton>
              </DashboardActions>
            }
          />
          <DataTable
            columns={cashColumns}
            data={cashInRows}
            getRowKey={(row) => row.id}
            minWidth={820}
          />
        </DashboardPanel>
        <DashboardPanel title="Cash Out Data">
          <TableToolbar
            actions={
              <DashboardActions>
                <DashboardActionButton icon={Download}>Export Cash Out</DashboardActionButton>
              </DashboardActions>
            }
          />
          <DataTable
            columns={cashColumns}
            data={cashOutRows}
            getRowKey={(row) => row.id}
            minWidth={820}
          />
        </DashboardPanel>
      </div>
    </DashboardShell>
  );
}
