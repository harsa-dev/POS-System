import { requireFinancialReportExport } from "./financial-reports.permissions.js";
import type { FinancialReportActor, FinancialReportDto, FinancialReportQuery } from "./financial-reports.types.js";
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

function escapeCsvCell(value: string | number | null | undefined) {
  const normalized = value === null || value === undefined ? "" : String(value);
  if (!/[",\n\r]/.test(normalized)) return normalized;
  return `"${normalized.replace(/"/g, '""')}"`;
}

function toCsv(rows: Array<Array<string | number | null | undefined>>) {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function buildReportCsv(report: FinancialReportDto) {
  return toCsv([
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
    ["Warnings", "Message", ""],
    ...report.sourceHealth.warnings.map((warning) => ["Warnings", warning, ""]),
  ]);
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
