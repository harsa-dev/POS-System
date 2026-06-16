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
import { DateRangeFilter, SearchFilter, SelectFilter } from "@/features/shared/filters";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import { DataTable, TableToolbar, type DataTableColumn } from "@/features/shared/table";
import type { DashboardTone, DateRangeOption } from "@/features/shared/types";
import {
  salesAnalyticsApi,
  salesAnalyticsSortKeys,
  type SalesAnalyticsDataPointDto,
  type SalesAnalyticsDto,
  type SalesAnalyticsExportFileDto,
  type SalesAnalyticsFilterOptionsDto,
  type SalesAnalyticsOrderStatus,
  type SalesAnalyticsQuery,
  type SalesAnalyticsReconciliationDetailRowDto,
  type SalesAnalyticsReconciliationDto,
  type SalesAnalyticsReconciliationIssueSeverity,
  type SalesAnalyticsSortDirection,
  type SalesAnalyticsSortKey,
  type SalesTransactionDto,
} from "@/lib/api/sales-analytics-api";

const ALL_PRODUCTS = "__all_products__";
const ALL_CATEGORIES = "__all_categories__";
const ALL_PAYMENT_METHODS = "__all_payment_methods__";
const ALL_ORDER_STATUSES = "__all_order_statuses__";
const DEFAULT_PAGE_SIZE = 10;

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

function formatMaybeCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "Restricted";

  return formatCurrency(value);
}

function formatMaybePercentage(value: number | null | undefined) {
  if (value === null || value === undefined) return "Restricted";

  return `${value.toFixed(1)}%`;
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

function getIssueTone(severity: SalesAnalyticsReconciliationIssueSeverity): DashboardTone {
  if (severity === "critical") return "rose";
  if (severity === "warning") return "amber";

  return "slate";
}

const reconciliationDetailColumns: DataTableColumn<SalesAnalyticsReconciliationDetailRowDto>[] = [
  { key: "date", header: "Date", cell: (row) => formatDate(row.date), sortable: true },
  { key: "sourceType", header: "Source", cell: (row) => formatStatusLabel(row.sourceType) },
  {
    key: "reference",
    header: "Reference",
    cell: (row) => <span className="font-medium text-foreground">{row.reference}</span>,
  },
  { key: "description", header: "Description", cell: (row) => row.description },
  { key: "amount", header: "Amount", cell: (row) => formatCurrency(row.amount) },
  {
    key: "status",
    header: "Status",
    cell: (row) => <StatusPill tone={getStatusTone(row.status)}>{formatStatusLabel(row.status)}</StatusPill>,
  },
];

function ReconciliationDetailTable({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: SalesAnalyticsReconciliationDetailRowDto[];
}) {
  if (rows.length === 0) return null;

  return (
    <DashboardPanel title={title} description={description}>
      <DataTable
        columns={reconciliationDetailColumns}
        data={rows}
        getRowKey={(row) => row.id}
        minWidth={1080}
        pagination={{ pageSize: 5 }}
      />
    </DashboardPanel>
  );
}

function SalesReconciliationPanel({
  reconciliation,
}: {
  reconciliation: SalesAnalyticsReconciliationDto;
}) {
  const hasIssues = reconciliation.issues.length > 0;

  return (
    <div className="grid gap-4">
      <DashboardPanel
        title="Sales Reconciliation"
        description="Backend integrity checks for the selected sales analytics period."
      >
        {hasIssues ? (
          <div className="grid gap-3 p-4 lg:grid-cols-2">
            {reconciliation.issues.map((issue) => (
              <div
                key={issue.key}
                className="rounded-lg border border-border bg-card p-4 text-card-foreground"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{issue.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {issue.description}
                    </p>
                  </div>
                  <StatusPill tone={getIssueTone(issue.severity)}>
                    {formatStatusLabel(issue.severity)}
                  </StatusPill>
                </div>
                <p className="text-2xl font-semibold text-foreground">
                  {formatNumber(issue.count)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-4 text-sm text-muted-foreground">
            No sales analytics reconciliation issues were found for this period.
          </p>
        )}
      </DashboardPanel>

      <ReconciliationDetailTable
        title="Orders Without Paid Payment"
        description="Orders included in paid analytics without a PAID payment record."
        rows={reconciliation.ordersWithoutPaidPayment}
      />
      <ReconciliationDetailTable
        title="Payment Total Mismatches"
        description="Paid orders whose amountPaid value does not match the order total."
        rows={reconciliation.paymentTotalMismatches}
      />
      <ReconciliationDetailTable
        title="Missing Usable Inventory Cost"
        description="Recipe usage stock movements without linked inventory cost."
        rows={reconciliation.missingCostSnapshots}
      />
      <ReconciliationDetailTable
        title="Invalid Order Item Values"
        description="Included order items with zero or negative price, quantity, or subtotal."
        rows={reconciliation.zeroRevenueRows}
      />
      <ReconciliationDetailTable
        title="Cancelled Orders In Period"
        description="Cancelled orders excluded from paid sales analytics totals."
        rows={reconciliation.cancelledOrdersInPeriod}
      />
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

function downloadSalesAnalyticsExport(file: SalesAnalyticsExportFileDto) {
  const content = file.content ?? JSON.stringify(file.report, null, 2);

  if (!content) {
    throw new Error("Sales analytics export did not include downloadable content.");
  }

  const blob = new Blob([content], { type: file.contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = file.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function SalesAnalyticsDashboard() {
  const [mode, setMode] = useState("Sales Table");
  const [productFilter, setProductFilter] = useState(ALL_PRODUCTS);
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState(ALL_PAYMENT_METHODS);
  const [orderStatusFilter, setOrderStatusFilter] = useState(ALL_ORDER_STATUSES);
  const [dateRange, setDateRange] = useState<DateRangeOption>("This Month");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SalesAnalyticsSortKey>("date");
  const [sortDirection, setSortDirection] =
    useState<SalesAnalyticsSortDirection>("desc");
  const [report, setReport] = useState<SalesAnalyticsDto | null>(null);
  const [filterOptions, setFilterOptions] =
    useState<SalesAnalyticsFilterOptionsDto | null>(null);
  const [reconciliation, setReconciliation] =
    useState<SalesAnalyticsReconciliationDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const query = useMemo<SalesAnalyticsQuery>(() => {
    const search = productSearch.trim();

    return {
      ...getDateRangeQuery(dateRange),
      basis: "paid",
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      sortBy,
      sortDirection,
      productId: productFilter === ALL_PRODUCTS ? undefined : productFilter,
      categoryId: categoryFilter === ALL_CATEGORIES ? undefined : categoryFilter,
      paymentMethod:
        paymentMethodFilter === ALL_PAYMENT_METHODS ? undefined : paymentMethodFilter,
      orderStatus:
        orderStatusFilter === ALL_ORDER_STATUSES
          ? undefined
          : (orderStatusFilter as SalesAnalyticsOrderStatus),
      q: search || undefined,
    };
  }, [
    categoryFilter,
    dateRange,
    orderStatusFilter,
    page,
    paymentMethodFilter,
    productFilter,
    productSearch,
    sortBy,
    sortDirection,
  ]);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setExportErrorMessage(null);

    try {
      const [reportResponse, reconciliationResponse, filterOptionsResponse] =
        await Promise.all([
          salesAnalyticsApi.getReport(query),
          salesAnalyticsApi.getReconciliation(query),
          salesAnalyticsApi.getFilterOptions(),
        ]);

      setReport(reportResponse.data);
      setReconciliation(reconciliationResponse.data);
      setFilterOptions(filterOptionsResponse.data);
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

  useEffect(() => {
    setPage(1);
  }, [
    categoryFilter,
    dateRange,
    orderStatusFilter,
    paymentMethodFilter,
    productFilter,
    productSearch,
  ]);

  const rows = report?.rows ?? [];
  const summary = report?.summary ?? emptySummary;
  const access = report?.access ?? {
    canViewOperational: false,
    canViewProfit: false,
    canExport: false,
  };
  const canViewProfit = access.canViewProfit;
  const canExportReport = access.canExport;

  const visibleSortableKeys = useMemo(
    () =>
      canViewProfit
        ? [...salesAnalyticsSortKeys]
        : salesAnalyticsSortKeys.filter(
            (key) => key !== "grossProfit" && key !== "margin",
          ),
    [canViewProfit],
  );

  const productOptions = useMemo(
    () => [
      { value: ALL_PRODUCTS, label: "All Products" },
      ...(filterOptions?.products ?? []),
    ],
    [filterOptions?.products],
  );

  const categoryOptions = useMemo(
    () => [
      { value: ALL_CATEGORIES, label: "All Categories" },
      ...(filterOptions?.categories ?? []),
    ],
    [filterOptions?.categories],
  );

  const paymentMethodOptions = useMemo(
    () => [
      { value: ALL_PAYMENT_METHODS, label: "All Payment Methods" },
      ...(filterOptions?.paymentMethods ?? []),
    ],
    [filterOptions?.paymentMethods],
  );

  const orderStatusOptions = useMemo(
    () => [
      { value: ALL_ORDER_STATUSES, label: "All Order Statuses" },
      ...(filterOptions?.orderStatuses ?? []).map((option) => ({
        value: option.value,
        label: formatStatusLabel(option.label),
      })),
    ],
    [filterOptions?.orderStatuses],
  );

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

  const handleSortChange = useCallback(
    (nextSortBy: string) => {
      if (!visibleSortableKeys.includes(nextSortBy as SalesAnalyticsSortKey)) {
        return;
      }

      const typedSortBy = nextSortBy as SalesAnalyticsSortKey;

      setPage(1);
      setSortBy((currentSortBy) => {
        if (currentSortBy === typedSortBy) {
          setSortDirection((currentDirection) =>
            currentDirection === "asc" ? "desc" : "asc",
          );
          return currentSortBy;
        }

        setSortDirection("desc");
        return typedSortBy;
      });
    },
    [visibleSortableKeys],
  );

  const handleExport = useCallback(async () => {
    if (!report || !canExportReport) return;

    setIsExporting(true);
    setExportErrorMessage(null);

    try {
      const response = await salesAnalyticsApi.exportReport({
        ...query,
        format: "csv",
      });

      downloadSalesAnalyticsExport(response.data);
    } catch (error) {
      setExportErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to export sales analytics.",
      );
    } finally {
      setIsExporting(false);
    }
  }, [canExportReport, query, report]);

  const salesColumns: DataTableColumn<SalesTransactionDto>[] = [
    {
      key: "orderNumber",
      header: "Order Number",
      cell: (row) => (
        <span className="font-semibold text-foreground">#{row.orderNumber}</span>
      ),
    },
    { key: "date", header: "Date", cell: (row) => formatDate(row.date), sortable: true },
    {
      key: "productName",
      header: "Product",
      sortable: true,
      cell: (row) => <span className="font-medium text-foreground">{row.productName}</span>,
    },
    { key: "categoryName", header: "Category", cell: (row) => row.categoryName },
    { key: "quantity", header: "Quantity", cell: (row) => formatNumber(row.quantity), sortable: true },
    {
      key: "paymentStatus",
      header: "Payment Status",
      sortable: true,
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
      sortable: true,
      cell: (row) => <span className="font-medium">{formatCurrency(row.totalRevenue)}</span>,
    },
    ...(canViewProfit
      ? ([
          {
            key: "cogs",
            header: "COGS / HPP",
            cell: (row) => formatMaybeCurrency(row.cogs),
          },
          {
            key: "grossProfit",
            header: "Gross Profit",
            sortable: true,
            cell: (row) => (
              <span className="font-medium">{formatMaybeCurrency(row.grossProfit)}</span>
            ),
          },
          {
            key: "margin",
            header: "Margin",
            sortable: true,
            cell: (row) => formatMaybePercentage(row.margin),
          },
        ] satisfies DataTableColumn<SalesTransactionDto>[])
      : []),
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
      description="Track role-scoped backend sales analytics, operational summaries, product performance, and profit metrics when permitted."
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
        {canViewProfit ? (
          <>
            <StatCard
              label="Margin"
              value={formatMaybePercentage(summary.margin)}
              note="Revenue minus COGS"
              icon={BarChart3}
              tone="amber"
            />
            <StatCard
              label="Net Profit"
              value={formatMaybeCurrency(summary.netProfit)}
              note="Backend-calculated gross profit"
              icon={Banknote}
              tone="rose"
            />
          </>
        ) : (
          <>
            <StatCard
              label="Transactions"
              value={formatNumber(summary.transactionCount)}
              note="Operational analytics view"
              icon={BarChart3}
              tone="amber"
            />
            <StatCard
              label="Average Order Value"
              value={formatCurrency(summary.averageOrderValue)}
              note="Profit metrics are restricted"
              icon={Banknote}
              tone="rose"
            />
          </>
        )}
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
              <DashboardFilters className="xl:min-w-[980px]">
                <SelectFilter
                  label="Product Filter"
                  value={productFilter}
                  options={productOptions}
                  onChange={setProductFilter}
                />
                <SelectFilter
                  label="Category Filter"
                  value={categoryFilter}
                  options={categoryOptions}
                  onChange={setCategoryFilter}
                />
                <SelectFilter
                  label="Payment Method Filter"
                  value={paymentMethodFilter}
                  options={paymentMethodOptions}
                  onChange={setPaymentMethodFilter}
                />
                <SelectFilter
                  label="Order Status Filter"
                  value={orderStatusFilter}
                  options={orderStatusOptions}
                  onChange={setOrderStatusFilter}
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
              <DashboardActionButton
                icon={Eye}
                onClick={() => setMode("Sales Table")}
                disabled={!canViewProfit}
                title={
                  canViewProfit
                    ? undefined
                    : "Profit metrics are restricted for your analytics role."
                }
              >
                {canViewProfit ? "View Profit" : "Profit Restricted"}
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
                disabled={!report || !canExportReport || isLoading || isExporting}
                title={
                  canExportReport
                    ? undefined
                    : "Export is restricted to profit analytics roles."
                }
              >
                {isExporting ? "Exporting..." : "Export CSV"}
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
      {reconciliation && <SalesReconciliationPanel reconciliation={reconciliation} />}

      {exportErrorMessage && (
        <DashboardPanel
          title="Export failed"
          description="Backend sales analytics export could not be prepared."
        >
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {exportErrorMessage}
          </div>
        </DashboardPanel>
      )}

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
            minWidth={canViewProfit ? 1680 : 1380}
            emptyMessage={
              isLoading
                ? "Loading backend sales rows..."
                : "No backend sales analytics rows for this filter yet."
            }
            pagination={
              report
                ? {
                    label: "Sales rows",
                    page: report.pagination.page,
                    pageSize: report.pagination.pageSize,
                    totalRows: report.pagination.totalRows,
                    totalPages: report.pagination.totalPages,
                    onPageChange: setPage,
                  }
                : { pageSize: DEFAULT_PAGE_SIZE }
            }
            sorting={{
              sortBy,
              sortDirection,
              onSortChange: handleSortChange,
              sortableKeys: visibleSortableKeys,
            }}
          />
        </DashboardPanel>
      )}
    </DashboardShell>
  );
}
