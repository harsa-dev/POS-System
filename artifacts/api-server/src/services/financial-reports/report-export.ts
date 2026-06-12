import { requireFinancialReportExport } from "./financial-reports.permissions.js";
import type { FinancialReportActor, FinancialReportDto, FinancialReportQuery } from "./financial-reports.types.js";
import type { BusinessContext } from "../../lib/business-context/business-context.types.js";
import { getFinancialReport } from "./report-service.js";

export type ReportExportFormat = "json" | "csv";

export type ReportExportFileDto = {
  exportedAt: string;
  format: ReportExportFormat;
  filename: string;
  contentType: string;
  report?: FinancialReportDto;
  content?: string;
};

function escapeCsvCell(value: string | number | null | undefined) {
  const normalized = value === null || value === undefined ? "" : String(value);
  if (!/[",\n\r]/.test(normalized)) return normalized;
  return `"${normalized.replace(/"/g, '""')}"`;
}

function toCsv(rows: Array<Array<string | number | null | undefined>>) {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function buildReportCsv(report: FinancialReportDto) {
  const rows: Array<Array<string | number | null | undefined>> = [
    ["Section", "Metric", "Value"],
    ["Summary", "Total Revenue", report.summary.totalRevenue],
    ["Summary", "COGS", report.summary.cogs],
    ["Summary", "Gross Profit", report.summary.grossProfit],
    ["Summary", "Total Expenses", report.summary.totalExpenses],
    ["Summary", "Net Profit", report.summary.netProfit],
    ["Summary", "Receivables", report.summary.receivables],
    ["Summary", "Cash In", report.summary.cashIn],
    ["Summary", "Cash Out", report.summary.cashOut],
    ["Summary", "Order Count", report.summary.orderCount],
    [],
    ["Profit And Loss", "Line", "Amount"],
    ...report.profitLoss.map((line) => ["Profit And Loss", line.label, line.amount]),
    [],
    ["Source Health", "Metric", "Value"],
    ["Source Health", "Paid Orders", report.sourceHealth.paidOrders],
    ["Source Health", "Ledger Entries", report.sourceHealth.cashflowEntries],
    ["Source Health", "Invoices", report.sourceHealth.invoices],
    ["Source Health", "Stock Movements", report.sourceHealth.stockMovements],
    ["Source Health", "Unsynced Orders", report.sourceHealth.ordersWithoutCashflow],
    ["Source Health", "Missing Cost Snapshots", report.sourceHealth.stockMovementsMissingCostSnapshot],
    ["Source Health", "Pending Ledger Entries", report.sourceHealth.pendingCashflowEntries],
    ["Source Health", "Voided Ledger Entries", report.sourceHealth.voidedCashflowEntries],
    [],
    ["Warnings", "Message", ""],
    ...report.sourceHealth.warnings.map((warning) => ["Warnings", warning, ""]),
  ];

  return toCsv(rows);
}

export async function exportFinancialReportFile(params: {
  actor: FinancialReportActor;
  businessContext: BusinessContext;
  query: FinancialReportQuery;
  format: ReportExportFormat;
}): Promise<ReportExportFileDto> {
  requireFinancialReportExport(params.actor.role);
  const report = await getFinancialReport(params);
  const filenameBase = `financial-report-${report.period.from}-${report.period.to}-${report.basis}`;

  if (params.format === "csv") {
    return {
      exportedAt: new Date().toISOString(),
      format: "csv",
      filename: `${filenameBase}.csv`,
      contentType: "text/csv;charset=utf-8",
      content: buildReportCsv(report),
    };
  }

  return {
    exportedAt: new Date().toISOString(),
    format: "json",
    filename: `${filenameBase}.json`,
    contentType: "application/json;charset=utf-8",
    report,
  };
}
