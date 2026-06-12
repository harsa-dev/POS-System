"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
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
import type { DashboardTone, DateRangeOption } from "@/features/shared/types";
import {
  salesAnalyticsApi,
  type SalesAnalyticsDataPointDto,
  type SalesAnalyticsDto,
  type SalesAnalyticsQuery,
  type SalesTransactionDto,
} from "@/lib/api/sales-analytics-api";

const ALL_PRODUCTS = "All Products";
const DEFAULT_ROW_LIMIT = 50;

const emptySummary: SalesAnalyticsDto["summary"] = {
  grossRevenue: 0,
  totalDiscount: 0,
  totalRevenue: 0,
  cogs: 0,
  grossProfit: 0,
  margin: 0,
  netProfit: 0,
  quantity: 0,
  transactionCount: 0,
  orderCount: 0,
  averageOrderValue: 0,
  receivables: 0,
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function getDateRangeQuery(dateRange: DateRangeOption) {
  const now = new Date();

  if (dateRange === "Today") {
    return {
      from: startOfDay(now).toISOString(),
      to: endOfDay(now).toISOString(),
    };
  }

  if (dateRange === "This Week") {
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const start = startOfDay(new Date(now));
    start.setDate(start.getDate() - diffToMonday);

    return {
      from: start.toISOString(),
      to: endOfDay(now).toISOString(),
    };
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  return {
    from: monthStart.toISOString(),
    to: endOfDay(now).toISOString(),
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatStatusLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getStatusTone(status: string): DashboardTone {
  const normalized = status.toUpperCase();

  if (normalized === "PAID") return "green";
  if (normalized === "PENDING" || normalized === "PARTIAL") return "amber";
  if (normalized === "FAILED" || normalized === "REFUNDED" || normalized === "CANCELLED") {
    return "rose";
  }

  return "slate";
}

function SimpleBarChart({
  data,
  valueFormatter = formatNumber,
}: {
  data: Array<Pick<SalesAnalyticsDataPointDto, "label" | "value">>;
  valueFormatter?: (value: number) => string;
}) {
  const maxValue = Math.max(0, ...data.map((item) => item.value));

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No analytics data for the selected period yet.
      </p>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {data.map((item) => {
        const width = maxValue > 0 ? Math.max((item.value / maxValue) * 100, 8) : 8;

        return (
          <div
            key={item.label}
            className="grid grid-cols-[76px_1fr_96px] items-center gap-3"
          >
            <span className="truncate text-sm font-medium text-muted-foreground">
              {item.label}
            </span>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="truncate text-right text-sm text-muted-foreground">
              {valueFormatter(item.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SalesSourceHealthPanel({ report }: { report: SalesAnalyticsDto }) {
  const items = [
    ["Paid Orders", report.sourceHealth.paidOrders],
    ["Order Items", report.sourceHealth.orderItems],
    ["Paid Payments", report.sourceHealth.paidPayments],
    ["Stock Movements", report.sourceHealth.stockMovements],
  ] as const;

  return (
    <DashboardPanel
      title="Source Health"
      description="Backend source records used to build this sales analytics view."
    >
      <div className="grid gap-3 p-4 md:grid-cols-4">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-card p-3 text-card-foreground"
          >
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {formatNumber(value)}
            </p>
          </div>
        ))}
      </div>

      {report.sourceHealth.warnings.length > 0 && (
        <div className="border-t border-accent bg-accent p-4 text-sm text-accent-foreground">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Sales analytics source warnings
          </div>
          <ul className="list-inside list-disc space-y-1">
            {report.sourceHealth.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </DashboardPanel>
  );
}

export function SalesAnalyticsDashboard() {
  const [mode, setMode] = useState("Sales Table");
  const [productFilter, setProductFilter] = useState(ALL_PRODUCTS);
  const [productSearch, setProductSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeOption>("This Month");
  const [report, setReport] = useState<SalesAnalyticsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const productQuery = useMemo(() => {
    const search = productSearch.trim();
    if (search) return search;

    return productFilter === ALL_PRODUCTS ? undefined : productFilter;
  }, [productFilter, productSearch]);

  const query = useMemo<SalesAnalyticsQuery>(() => {
    return {
      ...getDateRangeQuery(dateRange),
      basis: "paid",
      limit: DEFAULT_ROW_LIMIT,
      q: productQuery,
    };
  }, [dateRange, productQuery]);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await salesAnalyticsApi.getReport(query);
      setReport(response.data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load sales analytics report.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadReport();
  }, [loadReport, refreshToken]);

  const rows = report?.rows ?? [];
  const summary = report?.summary ?? emptySummary;

  const productOptions = useMemo(() => {
    const names = new Set<string>();

    for (const item of report?.bestSellingProducts ?? []) {
      names.add(item.label);
    }
    for (const row of rows) {
      names.add(row.productName);
    }

    return [ALL_PRODUCTS, ...Array.from(names).sort((a, b) => a.localeCompare(b))];
  }, [report?.bestSellingProducts, rows]);

  const peakHour = useMemo(() => {
    const source = report?.busyHours ?? [];
    if (source.length === 0) return "-";

    return source.reduce((best, current) =>
      current.value > best.value ? current : best,
    ).label;
  }, [report?.busyHours]);

  const handleRefresh = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  const handleExport = useCallback(() => {
    if (!report || rows.length === 0) return;

    exportExcel({
      filename: "sales-analytics",
      rows,
      columns: [
        { key: "orderNumber", header: "Order Number", value: (row) => row.orderNumber },
        { key: "date", header: "Date", value: (row) => row.date },
        { key: "productName", header: "Product", value: (row) => row.productName },
        { key: "categoryName", header: "Category", value: (row) => row.categoryName },
        { key: "quantity", header: "Quantity", value: (row) => row.quantity },
        { key: "totalRevenue", header: "Total Revenue", value: (row) => row.totalRevenue },
        { key: "cogs", header: "COGS", value: (row) => row.cogs },
        { key: "grossProfit", header: "Gross Profit", value: (row) => row.grossProfit },
        { key: "margin", header: "Margin", value: (row) => row.margin },
        { key: "paymentStatus", header: "Payment Status", value: (row) => row.paymentStatus },
      ],
    });
  }, [report, rows]);

  const salesColumns: DataTableColumn<SalesTransactionDto>[] = [
    {
      key: "orderNumber",
      header: "Order Number",
      cell: (row) => (
        <span className="font-semibold text-foreground">#{row.orderNumber}</span>
      ),
    },
    { key: "date", header: "Date", cell: (row) => formatDate(row.date) },
    {
      key: "productName",
      header: "Product",
      cell: (row) => <span className="font-medium text-foreground">{row.productName}</span>,
    },
    { key: "categoryName", header: "Category", cell: (row) => row.categoryName },
    { key: "quantity", header: "Quantity", cell: (row) => formatNumber(row.quantity) },
    {
      key: "paymentStatus",
      header: "Payment Status",
      cell: (row) => (
        <StatusPill tone={getStatusTone(row.paymentStatus)}>
          {formatStatusLabel(row.paymentStatus)}
        </StatusPill>
      ),
    },
    {
      key: "orderStatus",
      header: "Order Status",
      cell: (row) => <StatusPill>{formatStatusLabel(row.orderStatus)}</StatusPill>,
    },
    {
      key: "paymentMethod",
      header: "Payment Method",
      cell: (row) => formatStatusLabel(row.paymentMethod),
    },
    {
      key: "sellingPrice",
      header: "Selling Price",
      cell: (row) => formatCurrency(row.sellingPrice),
    },
    {
      key: "grossRevenue",
      header: "Gross Revenue",
      cell: (row) => formatCurrency(row.grossRevenue),
    },
    {
      key: "discount",
      header: "Discount",
      cell: (row) => formatCurrency(row.discount),
    },
    {
      key: "totalRevenue",
      header: "Total Revenue",
      cell: (row) => <span className="font-medium">{formatCurrency(row.totalRevenue)}</span>,
    },
    { key: "cogs", header: "COGS / HPP", cell: (row) => formatCurrency(row.cogs) },
    {
      key: "grossProfit",
      header: "Gross Profit",
      cell: (row) => <span className="font-medium">{formatCurrency(row.grossProfit)}</span>,
    },
    {
      key: "margin",
      header: "Margin",
      cell: (row) => `${row.margin.toFixed(1)}%`,
    },
    {
      key: "actions",
      header: "Actions",
      cell: () => (
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-2 text-xs font-semibold text-card-foreground hover:bg-muted"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            View Detail
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-2 text-xs font-semibold text-card-foreground hover:bg-muted"
          >
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
      description="Track revenue, profit, receivables, COGS, product performance, and marketing insight from backend POS sales data."
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Gross Revenue"
          value={formatCurrency(summary.grossRevenue)}
          note="Before discounts"
          icon={Banknote}
          tone="blue"
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
          note="Backend paid lifecycle orders"
          icon={TrendingUp}
          tone="green"
        />
        <StatCard
          label="Margin"
          value={`${summary.margin.toFixed(1)}%`}
          note="Revenue minus COGS"
          icon={BarChart3}
          tone="amber"
        />
        <StatCard
          label="Net Profit"
          value={formatCurrency(summary.netProfit)}
          note="Backend-calculated gross profit"
          icon={Banknote}
          tone="rose"
        />
        <StatCard
          label="Total Quantity Sold"
          value={formatNumber(summary.quantity)}
          note="From backend rows"
          icon={ShoppingCart}
          tone="slate"
        />
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
              <DashboardActionButton
                icon={Plus}
                variant="primary"
                disabled
                title="Manual sales entry is not available for backend-backed analytics yet."
              >
                Add Data
              </DashboardActionButton>
              <DashboardActionButton icon={Eye} onClick={() => setMode("Sales Table")}>
                View Profit
              </DashboardActionButton>
              <DashboardActionButton
                icon={Megaphone}
                onClick={() => setMode("Marketing Insight")}
              >
                Marketing Insight
              </DashboardActionButton>
              <DashboardActionButton icon={RefreshCw} onClick={handleRefresh} disabled={isLoading}>
                {isLoading ? "Refreshing..." : "Refresh"}
              </DashboardActionButton>
              <DashboardActionButton
                icon={Upload}
                disabled
                title="Import is deferred until backend import validation exists."
              >
                Import Data
              </DashboardActionButton>
              <DashboardActionButton
                icon={Download}
                onClick={handleExport}
                disabled={!report || rows.length === 0}
              >
                Export Excel
              </DashboardActionButton>
              <DashboardActionButton
                icon={Columns3}
                disabled
                title="Column management is deferred."
              >
                Manage Columns
              </DashboardActionButton>
            </DashboardActions>
          }
        />
      </DashboardPanel>

      {errorMessage && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Failed to load sales analytics
          </div>
          <p>{errorMessage}</p>
        </div>
      )}

      {isLoading && !report && (
        <DashboardPanel title="Loading Sales Analytics">
          <p className="p-6 text-sm text-muted-foreground">
            Loading backend sales analytics data...
          </p>
        </DashboardPanel>
      )}

      {report && <SalesSourceHealthPanel report={report} />}

      {mode === "Marketing Insight" ? (
        <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
          <div className="grid gap-3">
            <StatCard
              label="Total Transactions"
              value={formatNumber(summary.transactionCount)}
              note="Backend order item rows"
              icon={ShoppingCart}
              tone="blue"
            />
            <StatCard
              label="Average Order Value"
              value={formatCurrency(summary.averageOrderValue)}
              note="Revenue per paid order"
              icon={Banknote}
              tone="green"
            />
            <StatCard
              label="Peak Hour"
              value={peakHour}
              note="Highest backend revenue concentration"
              icon={Clock3}
              tone="amber"
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <DashboardPanel title="Busy Hours">
              <SimpleBarChart
                data={report?.busyHours ?? []}
                valueFormatter={formatCurrency}
              />
            </DashboardPanel>
            <DashboardPanel title="Daily Trend">
              <SimpleBarChart
                data={report?.dailyTrend ?? []}
                valueFormatter={formatCurrency}
              />
            </DashboardPanel>
            <DashboardPanel title="Best Selling Products">
              <SimpleBarChart data={report?.bestSellingProducts ?? []} />
            </DashboardPanel>
          </div>
        </div>
      ) : (
        <DashboardPanel
          title="Sales Table"
          description={report ? `Backend period: ${report.period.label}` : `Date range: ${dateRange}`}
        >
          <DataTable
            columns={salesColumns}
            data={rows}
            getRowKey={(row) => row.id}
            minWidth={1680}
            emptyMessage={
              isLoading
                ? "Loading backend sales rows..."
                : "No backend sales analytics rows for this filter yet."
            }
          />
        </DashboardPanel>
      )}
    </DashboardShell>
  );
}
