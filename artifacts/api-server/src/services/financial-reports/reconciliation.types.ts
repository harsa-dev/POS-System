import type { FinancialReportBasis, FinancialReportPeriodDto } from "./financial-reports.types.js";

export type ReportIssueLevel = "info" | "warning" | "danger";

export type ReportIssueDto = {
  key: string;
  level: ReportIssueLevel;
  title: string;
  count: number;
  message: string;
  action: string;
};

export type ReportIssueRowDto = {
  id: string;
  source: "ORDER" | "STOCK_MOVEMENT" | "CASHFLOW";
  label: string;
  date: string;
  amount: number;
  status: string;
  note: string;
};

export type ReportReconciliationDto = {
  generatedAt: string;
  period: FinancialReportPeriodDto;
  basis: FinancialReportBasis;
  issues: ReportIssueDto[];
  rows: ReportIssueRowDto[];
};
