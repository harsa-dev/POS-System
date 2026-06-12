import { requireFinancialReportExport } from "./financial-reports.permissions.js";
import type {
  FinancialReportActor,
  FinancialReportDto,
  FinancialReportQuery,
} from "./financial-reports.types.js";
import type { BusinessContext } from "../../lib/business-context/business-context.types.js";
import { getFinancialReport } from "./report-service.js";
import { logFinancialReportExport } from "./report-audit.js";

export type ReportExportFormat = "json" | "csv";

export type ReportExportFileDto = {
  exportedAt: string;
  format: ReportExportFormat;
  filename: string;
  contentType: string;
  auditLogged: boolean;
  report?: FinancialReportDto;
  content?: string;
};

type CsvCell = string | number | null | undefined;
type CsvRow = CsvCell[];

function escapeCsvCell(value: CsvCell) {
  const normalized = value === null || value === undefined ? "" : String(value);

  if (!/[",\n\r]/.test(normalized)) return normalized;

  return `"${normalized.replace(/"/g, '""')}"`;
}

function toCsv(rows: CsvRow[]) {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function appendSection(rows: CsvRow[], title: string, headers: CsvRow) {
  if (rows.length > 0) rows.push([]);

  rows.push([title]);
  rows.push(headers);
}

function buildReportCsv(report: FinancialReportDto) {
  const rows: CsvRow[] = [];

  appendSection(rows, "Report Metadata", ["Metric", "Value"]);
  rows.push(["Generated At", report.generatedAt]);
  rows.push(["Period From", report.period.from]);
  rows.push(["Period To", report.period.to]);
  rows.push(["Period Label", report.period.label]);
  rows.push(["Basis", report.basis]);

  appendSection(rows, "Summary", ["Metric", "Value"]);
  rows.push(["Total Revenue", report.summary.totalRevenue]);
  rows.push(["COGS", report.summary.cogs]);
  rows.push(["Gross Profit", report.summary.grossProfit]);
  rows.push(["Gross Margin", report.summary.grossMargin]);
  rows.push(["Total Expenses", report.summary.totalExpenses]);
  rows.push(["Net Profit", report.summary.netProfit]);
  rows.push(["Net Margin", report.summary.netMargin]);
  rows.push(["Receivables", report.summary.receivables]);
  rows.push(["Cash In", report.summary.cashIn]);
  rows.push(["Cash Out", report.summary.cashOut]);
  rows.push(["Net Cashflow", report.summary.netCashflow]);
  rows.push(["Order Count", report.summary.orderCount]);
  rows.push(["Average Order Value", report.summary.averageOrderValue]);

  appendSection(rows, "Source Health", ["Metric", "Value"]);
  rows.push(["Cashflow Entries", report.sourceHealth.cashflowEntries]);
  rows.push(["Paid Orders", report.sourceHealth.paidOrders]);
  rows.push(["Invoices", report.sourceHealth.invoices]);
  rows.push(["Stock Movements", report.sourceHealth.stockMovements]);
  rows.push([
    "Orders Without Cashflow",
    report.sourceHealth.ordersWithoutCashflow,
  ]);
  rows.push([
    "Stock Movements Missing Cost Snapshot",
    report.sourceHealth.stockMovementsMissingCostSnapshot,
  ]);
  rows.push([
    "Pending Cashflow Entries",
    report.sourceHealth.pendingCashflowEntries,
  ]);
  rows.push([
    "Voided Cashflow Entries",
    report.sourceHealth.voidedCashflowEntries,
  ]);

  appendSection(rows, "Profit And Loss", ["Key", "Line", "Amount", "Tone"]);
  for (const line of report.profitLoss) {
    rows.push([line.key, line.label, line.amount, line.tone]);
  }

  appendSection(rows, "Trend", [
    "Label",
    "Period Start",
    "Revenue",
    "COGS",
    "Gross Profit",
    "Expenses",
    "Net Profit",
    "Cash In",
    "Cash Out",
  ]);
  for (const point of report.trend) {
    rows.push([
      point.label,
      point.periodStart,
      point.revenue,
      point.cogs,
      point.grossProfit,
      point.expenses,
      point.netProfit,
      point.cashIn,
      point.cashOut,
    ]);
  }

  appendSection(rows, "Best Selling Products", [
    "Menu Item ID",
    "Product",
    "Quantity",
    "Revenue",
  ]);
  for (const item of report.bestSellingProducts) {
    rows.push([item.menuItemId, item.label, item.quantity, item.revenue]);
  }

  appendSection(rows, "Cash In", [
    "ID",
    "Date",
    "Account",
    "Type",
    "Category",
    "Source",
    "Description",
    "Amount",
    "Status",
    "Source Type",
    "Source ID",
  ]);
  for (const entry of report.cashIn) {
    rows.push([
      entry.id,
      entry.date,
      entry.sourceAccount,
      entry.type,
      entry.category,
      entry.sourceName,
      entry.description,
      entry.amount,
      entry.status,
      entry.sourceType,
      entry.sourceId,
    ]);
  }

  appendSection(rows, "Cash Out", [
    "ID",
    "Date",
    "Account",
    "Type",
    "Category",
    "Source",
    "Description",
    "Amount",
    "Status",
    "Source Type",
    "Source ID",
  ]);
  for (const entry of report.cashOut) {
    rows.push([
      entry.id,
      entry.date,
      entry.sourceAccount,
      entry.type,
      entry.category,
      entry.sourceName,
      entry.description,
      entry.amount,
      entry.status,
      entry.sourceType,
      entry.sourceId,
    ]);
  }

  appendSection(rows, "Receivables", [
    "ID",
    "Invoice Number",
    "Invoice Date",
    "Due Date",
    "Customer",
    "Status",
    "Amount",
  ]);
  for (const receivable of report.receivables) {
    rows.push([
      receivable.id,
      receivable.invoiceNumber,
      receivable.invoiceDate,
      receivable.dueDate,
      receivable.customerName,
      receivable.status,
      receivable.amount,
    ]);
  }

  appendSection(rows, "Warnings", ["Message"]);
  for (const warning of report.sourceHealth.warnings) {
    rows.push([warning]);
  }

  return toCsv(rows);
}

async function auditExport(params: {
  actor: FinancialReportActor;
  businessContext: BusinessContext;
  query: FinancialReportQuery;
  format: ReportExportFormat;
  filename: string;
  contentType: string;
}) {
  await logFinancialReportExport(params);
}

export async function exportFinancialReportFile(params: {
  actor: FinancialReportActor;
  businessContext: BusinessContext;
  query: FinancialReportQuery;
  format: ReportExportFormat;
}): Promise<ReportExportFileDto> {
  requireFinancialReportExport(params.actor.role);

  const report = await getFinancialReport(params);
  const exportedAt = new Date().toISOString();
  const filenameBase = `financial-report-${report.period.from}-${report.period.to}-${report.basis}`;

  if (params.format === "csv") {
    const filename = `${filenameBase}.csv`;
    const contentType = "text/csv;charset=utf-8";

    await auditExport({ ...params, filename, contentType });

    return {
      exportedAt,
      format: "csv",
      filename,
      contentType,
      auditLogged: true,
      content: buildReportCsv(report),
    };
  }

  const filename = `${filenameBase}.json`;
  const contentType = "application/json;charset=utf-8";

  await auditExport({ ...params, filename, contentType });

  return {
    exportedAt,
    format: "json",
    filename,
    contentType,
    auditLogged: true,
    report,
  };
}