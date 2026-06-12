import type { Role } from "@prisma/client";

export const financialReportBases = ["cashflow", "orders", "hybrid"] as const;

export type FinancialReportBasis = (typeof financialReportBases)[number];

export type FinancialReportActor = {
  id: string;
  role: Role;
};

export type FinancialReportQuery = {
  from: Date;
  to: Date;
  basis: FinancialReportBasis;
};

export type FinancialReportPeriodDto = {
  from: string;
  to: string;
  label: string;
};

export type FinancialReportSummaryDto = {
  totalRevenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  totalExpenses: number;
  netProfit: number;
  netMargin: number;
  receivables: number;
  cashIn: number;
  cashOut: number;
  netCashflow: number;
  orderCount: number;
  averageOrderValue: number;
};

export type ProfitLossLineTone = "positive" | "negative" | "neutral" | "total";

export type FinancialProfitLossLineDto = {
  key: string;
  label: string;
  amount: number;
  tone: ProfitLossLineTone;
};

export type FinancialTrendPointDto = {
  label: string;
  periodStart: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  cashIn: number;
  cashOut: number;
};

export type FinancialBestSellerDto = {
  menuItemId: string;
  label: string;
  quantity: number;
  revenue: number;
};

export type FinancialCashflowRowDto = {
  id: string;
  date: string;
  sourceAccount: string;
  type: string;
  category: string;
  sourceName: string;
  description: string;
  amount: number;
  status: string;
  sourceType: string;
  sourceId: string | null;
};

export type FinancialReceivableDto = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  customerName: string;
  status: string;
  amount: number;
};

export type FinancialSourceHealthDto = {
  cashflowEntries: number;
  paidOrders: number;
  invoices: number;
  stockMovements: number;
  ordersWithoutCashflow: number;
  stockMovementsMissingCostSnapshot: number;
  pendingCashflowEntries: number;
  voidedCashflowEntries: number;
  warnings: string[];
};

export type FinancialReportDto = {
  period: FinancialReportPeriodDto;
  basis: FinancialReportBasis;
  generatedAt: string;
  summary: FinancialReportSummaryDto;
  profitLoss: FinancialProfitLossLineDto[];
  trend: FinancialTrendPointDto[];
  bestSellingProducts: FinancialBestSellerDto[];
  cashIn: FinancialCashflowRowDto[];
  cashOut: FinancialCashflowRowDto[];
  receivables: FinancialReceivableDto[];
  sourceHealth: FinancialSourceHealthDto;
};

export type FinancialReportExportDto = {
  exportedAt: string;
  format: "json";
  report: FinancialReportDto;
};
