"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
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
import { exportCsv, exportPdf } from "@/features/shared/export";
import { SelectFilter } from "@/features/shared/filters";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import {
  DataTable,
  TableToolbar,
  type DataTableColumn,
} from "@/features/shared/table";
import { getApiErrorMessage } from "@/lib/api/api-client";
import { financialReportExportApi } from "@/lib/api/financial-reports-export-api";
import {
  financialReportBases,
  financialReportsApi,
  isFinancialReportBasis,
  type FinancialBestSellerDto,
  type FinancialCashflowRowDto,
  type FinancialProfitLossLineDto,
  type FinancialReportBasis,
  type FinancialReportDto,
  type FinancialReportQuery,
  type FinancialTrendPointDto,
} from "@/lib/api/financial-reports-api";
import {
  financialReportsReconciliationApi,
  type FinancialReconciliationDetailRowDto,
  type FinancialReconciliationDto,
  type FinancialReconciliationIssueDto,
} from "@/lib/api/financial-reports-reconciliation-api";

type PeriodOption = {
  label: string;
  from: string;
  to: string;
};

type DataSourceOption = {
  basis: FinancialReportBasis;
  name: string;
  description: string;
};

const dataSources: DataSourceOption[] = [
  {
    basis: "hybrid",
    name: "Recap + Cashflow",
    description:
      "Revenue from orders, expenses from ledger, COGS from stock movements.",
  },
  {
    basis: "cashflow",
    name: "Cashflow Only",
    description: "Report strictly follows posted cashflow ledger entries.",
  },
  {
    basis: "orders",
    name: "Recap Only",
    description:
      "Sales report from paid/completed order recap and stock movement COGS.",
  },
];

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPeriodOptions(now = new Date()): PeriodOption[] {
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const quarterStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  return [
    {
      label: "This Month",
      from: toDateInputValue(thisMonthStart),
      to: toDateInputValue(now),
    },
    {
      label: "Last Month",
      from: toDateInputValue(lastMonthStart),
      to: toDateInputValue(lastMonthEnd),
    },
    {
      label: "Last 3 Months",
      from: toDateInputValue(quarterStart),
      to: toDateInputValue(now),
    },
    {
      label: "Year To Date",
      from: toDateInputValue(yearStart),
      to: toDateInputValue(now),
    },
  ];
}

function downloadTextFile(
  filename: string,
  content: string,
  contentType: string,
) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getProfitLossClass(tone: FinancialProfitLossLineDto["tone"]) {
  if (tone === "positive") return "font-semibold text-primary";
  if (tone === "negative") return "font-semibold text-destructive";
  if (tone === "total") return "font-bold text-foreground";

  return "text-muted-foreground";
}

function getIssueClass(issue: FinancialReconciliationIssueDto) {
  if (issue.severity === "critical") {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }

  if (issue.severity === "warning") {
    return "border-accent bg-accent text-accent-foreground";
  }

  return "border-primary/30 bg-primary/10 text-primary";
}

function TrendChart({ data }: { data: FinancialTrendPointDto[] }) {
  const maxValue = Math.max(
    ...data.map((item) =>
      Math.max(item.revenue, item.netProfit, item.cashIn, 0),
    ),
    1,
  );

  return (
    <div className="space-y-4 p-4">
      {data.map((item) => (
        <div
          key={item.periodStart}
          className="grid grid-cols-[72px_1fr_120px] items-center gap-3"
        >
          <span className="text-sm font-medium text-muted-foreground">
            {item.label}
          </span>

          <div className="space-y-1">
            <div className="h-2 rounded-full bg-muted" title="Revenue">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${Math.max((item.revenue / maxValue) * 100, 4)}%`,
                }}
              />
            </div>

            <div className="h-2 rounded-full bg-muted" title="Net Profit">
              <div
                className="h-full rounded-full bg-chart-2"
                style={{
                  width: `${Math.max(
                    (Math.max(item.netProfit, 0) / maxValue) * 100,
                    4,
                  )}%`,
                }}
              />
            </div>
          </div>

          <span className="text-right text-xs text-muted-foreground">
            {formatCurrency(item.netProfit)}
          </span>
        </div>
      ))}

      {data.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No trend data for this period yet.
        </p>
      )}
    </div>
  );
}

function SimpleRanking({ data }: { data: FinancialBestSellerDto[] }) {
  const maxValue = Math.max(...data.map((item) => item.quantity), 1);

  return (
    <div className="space-y-4 p-4">
      {data.map((item) => (
        <div key={item.menuItemId} className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-foreground">{item.label}</span>
            <span className="text-muted-foreground">
              {formatNumber(item.quantity)} sold ·{" "}
              {formatCurrency(item.revenue)}
            </span>
          </div>

          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-chart-3"
              style={{
                width: `${Math.max((item.quantity / maxValue) * 100, 4)}%`,
              }}
            />
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No product sales data for this period yet.
        </p>
      )}
    </div>
  );
}

function CompactCalendar({ from, to }: { from: string; to: string }) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const totalDays = Math.max(
    Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) +
      1,
    1,
  );
  const shownDays = Math.min(totalDays, 31);

  return (
    <div className="rounded-lg border border-border bg-card p-3 text-xs text-card-foreground">
      <div className="mb-3 grid grid-cols-2 gap-2 text-muted-foreground">
        <div>
          <p className="font-semibold text-foreground">From</p>
          <p>{formatDate(from)}</p>
        </div>

        <div>
          <p className="font-semibold text-foreground">To</p>
          <p>{formatDate(to)}</p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: shownDays }).map((_, index) => (
          <div
            key={`${from}-${index}`}
            className="rounded-md bg-primary py-1.5 font-semibold text-primary-foreground"
          >
            {index + 1}
          </div>
        ))}
      </div>

      {totalDays > shownDays && (
        <p className="mt-3 text-center text-muted-foreground">
          +{formatNumber(totalDays - shownDays)} more day(s) in selected range
        </p>
      )}
    </div>
  );
}

function SourceHealthPanel({ report }: { report: FinancialReportDto }) {
  const items = [
    ["Paid Orders", report.sourceHealth.paidOrders],
    ["Cashflow Entries", report.sourceHealth.cashflowEntries],
    ["Invoices", report.sourceHealth.invoices],
    ["Stock Movements", report.sourceHealth.stockMovements],
  ] as const;

  return (
    <DashboardPanel
      title="Source Health"
      description="Backend source records used by this report."
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
            Reconciliation warnings
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

function ReconciliationPanel({
  reconciliation,
  isLoading,
  onRefresh,
}: {
  reconciliation: FinancialReconciliationDto | null;
  isLoading: boolean;
  onRefresh: () => void;
}) {
  const detailColumns: DataTableColumn<FinancialReconciliationDetailRowDto>[] =
    [
      { key: "date", header: "Date", cell: (row) => formatDate(row.date) },
      {
        key: "sourceType",
        header: "Source Type",
        cell: (row) => row.sourceType,
      },
      { key: "reference", header: "Reference", cell: (row) => row.reference },
      {
        key: "description",
        header: "Description",
        cell: (row) => row.description,
      },
      { key: "status", header: "Status", cell: (row) => row.status },
      {
        key: "amount",
        header: "Amount",
        className: "text-right",
        cell: (row) => (
          <span className="font-semibold">{formatCurrency(row.amount)}</span>
        ),
      },
    ];

  return (
    <DashboardPanel
      title="Reconciliation"
      description="Backend audit checks for report source integrity."
    >
      <TableToolbar
        actions={
          <DashboardActions>
            <DashboardActionButton
              icon={RefreshCw}
              onClick={onRefresh}
              disabled={isLoading}
            >
              Refresh Reconciliation
            </DashboardActionButton>
          </DashboardActions>
        }
      />

      {!reconciliation && (
        <div className="p-6 text-sm text-muted-foreground">
          {isLoading
            ? "Loading reconciliation details..."
            : "Reconciliation details are not loaded yet."}
        </div>
      )}

      {reconciliation && reconciliation.issues.length === 0 && (
        <div className="border-t border-primary/20 bg-primary/10 p-4 text-sm text-primary">
          No reconciliation issues detected for this period.
        </div>
      )}

      {reconciliation && reconciliation.issues.length > 0 && (
        <div className="grid gap-3 border-t border-border p-4 lg:grid-cols-2">
          {reconciliation.issues.map((issue) => (
            <div
              key={issue.key}
              className={`rounded-lg border p-4 ${getIssueClass(issue)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">{issue.title}</p>
                  <p className="mt-1 text-xs leading-5">{issue.description}</p>
                </div>

                <span className="rounded-full bg-background/80 text-foreground px-3 py-1 text-xs font-bold">
                  {formatNumber(issue.count)}
                </span>
              </div>

              <p className="mt-3 text-xs uppercase tracking-wide opacity-70">
                {issue.severity}
              </p>
            </div>
          ))}
        </div>
      )}

      {reconciliation && (
        <div className="grid gap-4 border-t border-border p-4 xl:grid-cols-2">
          <DashboardPanel title="Unsynced Paid Orders">
            <DataTable
              columns={detailColumns}
              data={reconciliation.unsyncedOrders}
              getRowKey={(row) => row.id}
              minWidth={860}
              emptyMessage="No paid orders without cashflow ledger entries."
            />
          </DashboardPanel>

          <DashboardPanel title="COGS Movements Missing Cost Snapshot">
            <DataTable
              columns={detailColumns}
              data={reconciliation.missingCostSnapshots}
              getRowKey={(row) => row.id}
              minWidth={860}
              emptyMessage="No COGS movements missing a cost snapshot."
            />
          </DashboardPanel>

          <DashboardPanel title="Pending Cashflow Entries">
            <DataTable
              columns={detailColumns}
              data={reconciliation.pendingCashflowEntries}
              getRowKey={(row) => row.id}
              minWidth={860}
              emptyMessage="No pending cashflow entries in this period."
            />
          </DashboardPanel>

          <DashboardPanel title="Voided Cashflow Entries">
            <DataTable
              columns={detailColumns}
              data={reconciliation.voidedCashflowEntries}
              getRowKey={(row) => row.id}
              minWidth={860}
              emptyMessage="No voided cashflow entries in this period."
            />
          </DashboardPanel>

          <DashboardPanel title="Open Invoice Receivables">
            <DataTable
              columns={detailColumns}
              data={reconciliation.openReceivables}
              getRowKey={(row) => row.id}
              minWidth={860}
              emptyMessage="No open invoice receivables in this period."
            />
          </DashboardPanel>
        </div>
      )}
    </DashboardPanel>
  );
}

export function FinancialReportsDashboard() {
  const periodOptions = useMemo(() => getPeriodOptions(), []);
  const [selectedPeriod, setSelectedPeriod] = useState(periodOptions[0]?.label ?? "This Month");
  const [basis, setBasis] = useState<FinancialReportBasis>("hybrid");
  const [report, setReport] = useState<FinancialReportDto | null>(null);
  const [reconciliation, setReconciliation] =
    useState<FinancialReconciliationDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReconciliationLoading, setIsReconciliationLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activePeriod =
    periodOptions.find((item) => item.label === selectedPeriod) ??
    periodOptions[0];

  const query = useMemo<FinancialReportQuery>(
    () => ({
      from: activePeriod.from,
      to: activePeriod.to,
      basis,
    }),
    [activePeriod.from, activePeriod.to, basis],
  );

  const handleBasisChange = useCallback((value: string) => {
    if (isFinancialReportBasis(value)) {
      setBasis(value);
    }
  }, []);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await financialReportsApi.getReport(query);
      setReport(response.data);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to load financial report."),
      );
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const loadReconciliation = useCallback(async () => {
    setIsReconciliationLoading(true);

    try {
      const response =
        await financialReportsReconciliationApi.getReconciliation(query);
      setReconciliation(response.data);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to load reconciliation details."),
      );
      setReconciliation(null);
    } finally {
      setIsReconciliationLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadReport();
    void loadReconciliation();
  }, [loadReport, loadReconciliation]);

  const refreshDashboard = () => {
    void loadReport();
    void loadReconciliation();
  };

  const plColumns: DataTableColumn<FinancialProfitLossLineDto>[] = [
    {
      key: "label",
      header: "Line",
      cell: (row) => <span>{row.label}</span>,
    },
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

  const cashColumns: DataTableColumn<FinancialCashflowRowDto>[] = [
    { key: "date", header: "Date", cell: (row) => formatDate(row.date) },
    { key: "category", header: "Category", cell: (row) => row.category },
    {
      key: "sourceName",
      header: "Source",
      cell: (row) => row.sourceName,
    },
    {
      key: "description",
      header: "Description",
      cell: (row) => row.description,
    },
    { key: "status", header: "Status", cell: (row) => row.status },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      cell: (row) => (
        <span className="font-semibold">{formatCurrency(row.amount)}</span>
      ),
    },
  ];

  const receivableColumns: DataTableColumn<
    FinancialReportDto["receivables"][number]
  >[] = [
    {
      key: "invoiceNumber",
      header: "Invoice",
      cell: (row) => row.invoiceNumber,
    },
    {
      key: "customerName",
      header: "Customer",
      cell: (row) => row.customerName,
    },
    {
      key: "invoiceDate",
      header: "Invoice Date",
      cell: (row) => formatDate(row.invoiceDate),
    },
    {
      key: "dueDate",
      header: "Due Date",
      cell: (row) => formatDate(row.dueDate),
    },
    { key: "status", header: "Status", cell: (row) => row.status },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      cell: (row) => (
        <span className="font-semibold">{formatCurrency(row.amount)}</span>
      ),
    },
  ];

  const exportRows = report
    ? [
        ["Metric", "Value"],
        ["Period", report.period.label],
        ["Basis", report.basis],
        ["Total Revenue", report.summary.totalRevenue],
        ["COGS", report.summary.cogs],
        ["Gross Profit", report.summary.grossProfit],
        ["Total Expenses", report.summary.totalExpenses],
        ["Net Profit", report.summary.netProfit],
        ["Receivables", report.summary.receivables],
        ["Cash In", report.summary.cashIn],
        ["Cash Out", report.summary.cashOut],
        ["Net Cashflow", report.summary.netCashflow],
      ]
    : [];

  const exportCurrentViewCsv = () => {
    if (!report) return;

    exportCsv<[string | number, string | number]>({
      filename: `financial-report-${report.period.from}-${report.period.to}.csv`,
      columns: [
        { key: "metric", header: "Metric", value: (row) => row[0] },
        { key: "value", header: "Value", value: (row) => row[1] },
      ],
      rows: exportRows as [string | number, string | number][],
    });
  };

  const exportReportFile = async (format: "csv" | "json") => {
    if (!report) return;

    setIsExporting(true);
    setErrorMessage(null);

    try {
      const response = await financialReportExportApi.exportReport({
        ...query,
        format,
      });
      const file = response.data;

      if (format === "csv" && file.content) {
        downloadTextFile(file.filename, file.content, file.contentType);
        return;
      }

      if (format === "json" && file.report) {
        downloadTextFile(
          file.filename,
          JSON.stringify(file.report, null, 2),
          file.contentType,
        );
      }
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to export financial report."),
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = () => {
    if (!report) return;
    exportPdf();
  };

  return (
    <DashboardShell
      title="Financial Reports"
      description="Backend-backed financial report, reconciliation, export, and source health dashboard."
      icon={BarChart3}
    >
      <DashboardPanel>
        <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {report?.period.label ?? activePeriod.label}
            </p>
            <h2 className="text-xl font-semibold text-foreground">
              Financial Performance
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Generated from backend report sources. Basis: {basis}.
            </p>
          </div>

          <DashboardActions>
            <DashboardActionButton
              icon={Download}
              onClick={exportCurrentViewCsv}
              disabled={!report}
            >
              Export Current View
            </DashboardActionButton>

            <DashboardActionButton
              icon={Download}
              onClick={() => void exportReportFile("csv")}
              disabled={!report || isExporting}
            >
              Export CSV
            </DashboardActionButton>

            <DashboardActionButton
              icon={Download}
              onClick={() => void exportReportFile("json")}
              disabled={!report || isExporting}
            >
              Export JSON
            </DashboardActionButton>

            <DashboardActionButton
              icon={Download}
              onClick={exportPdf}
              disabled={!report}
            >
              Print / PDF
            </DashboardActionButton>

            <DashboardActionButton
              icon={RefreshCw}
              onClick={refreshDashboard}
              disabled={isLoading || isReconciliationLoading}
            >
              Refresh
            </DashboardActionButton>
          </DashboardActions>
        </div>
      </DashboardPanel>

      {errorMessage && (
        <DashboardPanel>
          <div className="flex items-start gap-3 border-l-4 border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4" aria-hidden="true" />
            <div>
              <p className="font-semibold">Financial report issue</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        </DashboardPanel>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <DashboardPanel
          title="Period Section"
          description="Backend query date range"
        >
          <div className="p-4">
            <DashboardFilters className="md:grid-cols-2">
              <SelectFilter
                label="Monthly Period Selector"
                value={selectedPeriod}
                options={periodOptions.map((item) => item.label)}
                onChange={setSelectedPeriod}
              />

              <SelectFilter
                label="Report Basis"
                value={basis}
                options={[...financialReportBases]}
                onChange={handleBasisChange}
              />
            </DashboardFilters>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Selected Range">
          <div className="p-4">
            <CompactCalendar from={activePeriod.from} to={activePeriod.to} />
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel title="Data Sources Section">
        <div className="grid gap-4 p-4 xl:grid-cols-3">
          {dataSources.map((source) => {
            const isActive = source.basis === basis;

            return (
              <button
                key={source.basis}
                type="button"
                onClick={() => setBasis(source.basis)}
                className={`rounded-lg border p-4 text-left transition ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-card-foreground hover:bg-muted"
                }`}
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </div>

                <h3 className="font-semibold text-foreground">
                  {source.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {source.description}
                </p>
              </button>
            );
          })}
        </div>
      </DashboardPanel>

      {isLoading && (
        <DashboardPanel>
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading financial report from backend sources...
          </div>
        </DashboardPanel>
      )}

      {report && !isLoading && (
        <>
          <SourceHealthPanel report={report} />

          <ReconciliationPanel
            reconciliation={reconciliation}
            isLoading={isReconciliationLoading}
            onRefresh={() => void loadReconciliation()}
          />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Revenue"
              value={formatCurrency(report.summary.totalRevenue)}
              note={`Basis: ${report.basis}`}
              icon={ArrowUpRight}
              tone="green"
            />
            <StatCard
              label="Gross Profit"
              value={formatCurrency(report.summary.grossProfit)}
              note={`Margin ${report.summary.grossMargin.toFixed(1)}%`}
              icon={WalletCards}
              tone="blue"
            />
            <StatCard
              label="Net Profit"
              value={formatCurrency(report.summary.netProfit)}
              note={`Margin ${report.summary.netMargin.toFixed(1)}%`}
              icon={ArrowUpRight}
              tone="green"
            />
            <StatCard
              label="Receivables"
              value={formatCurrency(report.summary.receivables)}
              note="Open invoices"
              icon={FileText}
              tone="amber"
            />
            <StatCard
              label="Cash In"
              value={formatCurrency(report.summary.cashIn)}
              note="Posted income ledger"
              icon={ArrowUpRight}
              tone="green"
            />
            <StatCard
              label="Cash Out"
              value={formatCurrency(report.summary.cashOut)}
              note="Posted expense ledger"
              icon={ArrowDownRight}
              tone="red"
            />
            <StatCard
              label="Net Cashflow"
              value={formatCurrency(report.summary.netCashflow)}
              note="Cash in minus cash out"
              icon={WalletCards}
              tone="blue"
            />
            <StatCard
              label="Average Order Value"
              value={formatCurrency(report.summary.averageOrderValue)}
              note={`${formatNumber(report.summary.orderCount)} paid orders`}
              icon={CalendarDays}
              tone="slate"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <DashboardPanel
              title="6 Month Trend"
              description="Revenue, cashflow, and profitability trend from backend aggregates."
            >
              <TrendChart data={report.trend} />
            </DashboardPanel>

            <DashboardPanel title="Best Selling Products">
              <SimpleRanking data={report.bestSellingProducts} />
            </DashboardPanel>
          </div>

          <DashboardPanel title="Profit & Loss Table">
            <DataTable
              columns={plColumns}
              data={report.profitLoss}
              getRowKey={(row) => row.key}
              minWidth={640}
              emptyMessage="No profit and loss rows for this period."
            />
          </DashboardPanel>

          <div className="grid gap-4 xl:grid-cols-2">
            <DashboardPanel title="Cash In Table">
              <DataTable
                columns={cashColumns}
                data={report.cashIn}
                getRowKey={(row) => row.id}
                minWidth={860}
                emptyMessage="No cash-in rows for this period."
              />
            </DashboardPanel>

            <DashboardPanel title="Cash Out Table">
              <DataTable
                columns={cashColumns}
                data={report.cashOut}
                getRowKey={(row) => row.id}
                minWidth={860}
                emptyMessage="No cash-out rows for this period."
              />
            </DashboardPanel>
          </div>

          <DashboardPanel title="Receivables Table">
            <DataTable
              columns={receivableColumns}
              data={report.receivables}
              getRowKey={(row) => row.id}
              minWidth={760}
              emptyMessage="No receivables for this period."
            />
          </DashboardPanel>
        </>
      )}
    </DashboardShell>
  );
}
