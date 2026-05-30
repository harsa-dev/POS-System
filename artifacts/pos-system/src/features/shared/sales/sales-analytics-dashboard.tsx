"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  BarChart3,
  Clock3,
  Columns3,
  Download,
  Eye,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Upload,
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
import { exportExcel } from "@/features/shared/export";
import { DateRangeFilter, SearchFilter, SelectFilter } from "@/features/shared/filters";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import { DataTable, TableToolbar, type DataTableColumn } from "@/features/shared/table";
import type {
  AnalyticsDataPoint,
  DateRangeOption,
  PaymentStatus,
  SalesSummary,
  SalesTransaction,
} from "@/features/shared/types";

const productOptions = ["All Products", "Rice Bowl", "Coffee", "Tea", "Dessert"];

const salesRows: SalesTransaction[] = [
  {
    orderNumber: "FNB-10028",
    date: "2026-05-29",
    customerOrTable: "Table 04",
    product: "Chicken Rice Bowl",
    quantity: 18,
    paymentStatus: "Paid",
    sellingPrice: 540000,
    voucherDiscount: 25000,
    posPromotion: 15000,
    receivables: 0,
    cogs: 252000,
    advertisingCost: 30000,
  },
  {
    orderNumber: "FNB-10029",
    date: "2026-05-29",
    customerOrTable: "Dina Prasetyo",
    product: "Iced Latte",
    quantity: 31,
    paymentStatus: "Paid",
    sellingPrice: 713000,
    voucherDiscount: 45000,
    posPromotion: 30000,
    receivables: 0,
    cogs: 279000,
    advertisingCost: 40000,
  },
  {
    orderNumber: "FNB-10030",
    date: "2026-05-29",
    customerOrTable: "Table 11",
    product: "Matcha Dessert",
    quantity: 12,
    paymentStatus: "Partial",
    sellingPrice: 420000,
    voucherDiscount: 0,
    posPromotion: 25000,
    receivables: 120000,
    cogs: 168000,
    advertisingCost: 18000,
  },
  {
    orderNumber: "FNB-10031",
    date: "2026-05-28",
    customerOrTable: "Online Order",
    product: "Lemon Tea",
    quantity: 24,
    paymentStatus: "Receivable",
    sellingPrice: 360000,
    voucherDiscount: 10000,
    posPromotion: 0,
    receivables: 360000,
    cogs: 96000,
    advertisingCost: 12000,
  },
];

const busyHours: AnalyticsDataPoint[] = [
  { label: "09", value: 28 },
  { label: "11", value: 52 },
  { label: "13", value: 88 },
  { label: "15", value: 44 },
  { label: "18", value: 96 },
  { label: "20", value: 74 },
];

const dailyTrend: AnalyticsDataPoint[] = [
  { label: "Mon", value: 7_800_000 },
  { label: "Tue", value: 8_200_000 },
  { label: "Wed", value: 7_400_000 },
  { label: "Thu", value: 9_100_000 },
  { label: "Fri", value: 10_600_000 },
];

const bestSellingProducts: AnalyticsDataPoint[] = [
  { label: "Iced Latte", value: 184 },
  { label: "Chicken Rice Bowl", value: 142 },
  { label: "Lemon Tea", value: 98 },
  { label: "Matcha Dessert", value: 76 },
];

function getStatusTone(status: PaymentStatus) {
  if (status === "Paid") return "green";
  if (status === "Partial") return "amber";

  return "rose";
}

function getGrossProfit(row: SalesTransaction) {
  return row.sellingPrice - row.voucherDiscount - row.posPromotion - row.cogs;
}

function getNetProfit(row: SalesTransaction) {
  return getGrossProfit(row) - row.advertisingCost;
}

function SimpleBarChart({
  data,
  valueFormatter = formatNumber,
}: {
  data: AnalyticsDataPoint[];
  valueFormatter?: (value: number) => string;
}) {
  const maxValue = Math.max(...data.map((item) => item.value));

  return (
    <div className="space-y-3 p-4">
      {data.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-[76px_1fr_96px] items-center gap-3"
        >
          <span className="truncate text-sm font-medium text-neutral-600">
            {item.label}
          </span>
          <div className="h-3 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${Math.max((item.value / maxValue) * 100, 8)}%` }}
            />
          </div>
          <span className="truncate text-right text-sm text-neutral-500">
            {valueFormatter(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function SalesAnalyticsDashboard() {
  const [mode, setMode] = useState("Sales Table");
  const [productFilter, setProductFilter] = useState(productOptions[0]);
  const [productSearch, setProductSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeOption>("This Month");

  const filteredRows = useMemo(() => {
    return salesRows.filter((row) => {
      const productMatches =
        productFilter === "All Products" || row.product.includes(productFilter);
      const searchMatches = row.product
        .toLowerCase()
        .includes(productSearch.toLowerCase());

      return productMatches && searchMatches;
    });
  }, [productFilter, productSearch]);

  const summary: SalesSummary = useMemo(() => {
    const grossRevenue = filteredRows.reduce((total, row) => total + row.sellingPrice, 0);
    const totalDiscount = filteredRows.reduce(
      (total, row) => total + row.voucherDiscount + row.posPromotion,
      0,
    );
    const totalRevenue = grossRevenue - totalDiscount;
    const cogs = filteredRows.reduce((total, row) => total + row.cogs, 0);
    const ads = filteredRows.reduce((total, row) => total + row.advertisingCost, 0);
    const margin = totalRevenue ? ((totalRevenue - cogs) / totalRevenue) * 100 : 0;
    const netProfit = totalRevenue - cogs - ads;
    const quantity = filteredRows.reduce((total, row) => total + row.quantity, 0);

    return { grossRevenue, totalRevenue, margin, netProfit, quantity };
  }, [filteredRows]);

  const salesColumns: DataTableColumn<SalesTransaction>[] = [
    { key: "orderNumber", header: "Order Number", cell: (row) => <span className="font-semibold text-neutral-950">{row.orderNumber}</span> },
    { key: "date", header: "Date", cell: (row) => row.date },
    { key: "customerOrTable", header: "Customer / Table", cell: (row) => row.customerOrTable },
    { key: "product", header: "Product", cell: (row) => <span className="text-neutral-950">{row.product}</span> },
    { key: "quantity", header: "Quantity", cell: (row) => row.quantity },
    {
      key: "paymentStatus",
      header: "Payment Status",
      cell: (row) => (
        <StatusPill tone={getStatusTone(row.paymentStatus)}>
          {row.paymentStatus}
        </StatusPill>
      ),
    },
    { key: "sellingPrice", header: "Selling Price", cell: (row) => formatCurrency(row.sellingPrice) },
    { key: "voucherDiscount", header: "Voucher Discount", cell: (row) => formatCurrency(row.voucherDiscount) },
    { key: "posPromotion", header: "POS Promotion", cell: (row) => formatCurrency(row.posPromotion) },
    { key: "receivables", header: "Receivables", cell: (row) => formatCurrency(row.receivables) },
    { key: "cogs", header: "COGS / HPP", cell: (row) => formatCurrency(row.cogs) },
    { key: "advertisingCost", header: "Advertising Cost", cell: (row) => formatCurrency(row.advertisingCost) },
    { key: "totalReceivables", header: "Total Receivables", cell: (row) => <span className="font-medium">{formatCurrency(row.receivables)}</span> },
    { key: "grossProfit", header: "Gross Profit", cell: (row) => <span className="font-medium">{formatCurrency(getGrossProfit(row))}</span> },
    { key: "netProfit", header: "Net Profit", cell: (row) => <span className="font-semibold text-neutral-950">{formatCurrency(getNetProfit(row))}</span> },
    {
      key: "actions",
      header: "Actions",
      cell: () => (
        <div className="flex gap-2">
          <button type="button" className="inline-flex h-9 items-center gap-1 rounded-lg border border-neutral-200 px-2 text-xs font-semibold hover:bg-neutral-50">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            View Detail
          </button>
          <button type="button" className="inline-flex h-9 items-center gap-1 rounded-lg border border-neutral-200 px-2 text-xs font-semibold hover:bg-neutral-50">
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell
      title="Sales Analytics"
      description="Track revenue, profit, receivables, COGS, product performance, and marketing insight from POS sales data."
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Gross Revenue" value={formatCurrency(summary.grossRevenue)} note="Before discounts" icon={Banknote} tone="blue" />
        <StatCard label="Total Revenue" value={formatCurrency(summary.totalRevenue)} note="After voucher and POS promotion" icon={TrendingUp} tone="green" />
        <StatCard label="Margin" value={`${summary.margin.toFixed(1)}%`} note="Revenue minus COGS" icon={BarChart3} tone="amber" />
        <StatCard label="Net Profit" value={formatCurrency(summary.netProfit)} note="After COGS and advertising cost" icon={Banknote} tone="rose" />
        <StatCard label="Total Quantity Sold" value={formatNumber(summary.quantity)} note="From filtered rows" icon={ShoppingCart} tone="slate" />
      </div>

      <DashboardPanel>
        <TableToolbar
          filters={
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <DashboardFilters className="xl:min-w-[720px]">
                <SelectFilter
                  label="Product Filter"
                  value={productFilter}
                  options={productOptions}
                  onChange={setProductFilter}
                />
                <SearchFilter
                  label="Product Search"
                  value={productSearch}
                  placeholder="Search product..."
                  onChange={setProductSearch}
                />
                <DateRangeFilter value={dateRange} onChange={setDateRange} />
              </DashboardFilters>
              <DashboardTabs
                value={mode}
                options={["Sales Table", "Marketing Insight"]}
                onChange={setMode}
              />
            </div>
          }
          actions={
            <DashboardActions>
              <DashboardActionButton icon={Plus} variant="primary">Add Data</DashboardActionButton>
              <DashboardActionButton icon={Eye}>View Profit</DashboardActionButton>
              <DashboardActionButton icon={Megaphone} onClick={() => setMode("Marketing Insight")}>Marketing Insight</DashboardActionButton>
              <DashboardActionButton icon={RefreshCw}>Sync Cashflow</DashboardActionButton>
              <DashboardActionButton icon={Upload}>Import Data</DashboardActionButton>
              <DashboardActionButton
                icon={Download}
                onClick={() =>
                  exportExcel({
                    filename: "sales-analytics",
                    rows: filteredRows,
                    columns: [
                      { key: "orderNumber", header: "Order Number", value: (row) => row.orderNumber },
                      { key: "date", header: "Date", value: (row) => row.date },
                      { key: "product", header: "Product", value: (row) => row.product },
                      { key: "quantity", header: "Quantity", value: (row) => row.quantity },
                      { key: "netProfit", header: "Net Profit", value: (row) => getNetProfit(row) },
                    ],
                  })
                }
              >
                Export Excel
              </DashboardActionButton>
              <DashboardActionButton icon={Columns3}>Manage Columns</DashboardActionButton>
            </DashboardActions>
          }
        />
      </DashboardPanel>

      {mode === "Marketing Insight" ? (
        <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
          <div className="grid gap-3">
            <StatCard label="Total Transactions" value={formatNumber(486)} note="Marketing insight mode" icon={ShoppingCart} tone="blue" />
            <StatCard label="Average Order Value" value={formatCurrency(89_500)} note="Revenue per transaction" icon={Banknote} tone="green" />
            <StatCard label="Peak Hour" value="18:00" note="Highest sales concentration" icon={Clock3} tone="amber" />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <DashboardPanel title="Busy Hours"><SimpleBarChart data={busyHours} /></DashboardPanel>
            <DashboardPanel title="Daily Trend"><SimpleBarChart data={dailyTrend} valueFormatter={formatCurrency} /></DashboardPanel>
            <DashboardPanel title="Best Selling Products"><SimpleBarChart data={bestSellingProducts} /></DashboardPanel>
          </div>
        </div>
      ) : (
        <DashboardPanel title="Sales Table" description={`Date range: ${dateRange}`}>
          <DataTable
            columns={salesColumns}
            data={filteredRows}
            getRowKey={(row) => row.orderNumber}
            minWidth={1680}
          />
        </DashboardPanel>
      )}
    </DashboardShell>
  );
}
