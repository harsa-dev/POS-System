import type {
  FinancialBestSellerDto,
  FinancialCashflowRowDto,
  FinancialReceivableDto,
  FinancialReportBasis,
  FinancialReportPeriodDto,
  FinancialReportSummaryDto,
  FinancialTrendPointDto,
} from "./financial-reports.types.js";

export function toIsoDate(value: Date) {
  return value.toISOString();
}

export function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function toPeriodDto(from: Date, to: Date): FinancialReportPeriodDto {
  return {
    from: toIsoDate(from),
    to: toIsoDate(to),
    label: `${toDateOnly(from)} - ${toDateOnly(to)}`,
  };
}

export function safeRatio(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

export function buildFinancialSummary(input: {
  totalRevenue: number;
  cogs: number;
  totalExpenses: number;
  receivables: number;
  cashIn: number;
  cashOut: number;
  orderCount: number;
}): FinancialReportSummaryDto {
  const grossProfit = input.totalRevenue - input.cogs;
  const netProfit = grossProfit - input.totalExpenses;

  return {
    totalRevenue: input.totalRevenue,
    cogs: input.cogs,
    grossProfit,
    grossMargin: safeRatio(grossProfit, input.totalRevenue),
    totalExpenses: input.totalExpenses,
    netProfit,
    netMargin: safeRatio(netProfit, input.totalRevenue),
    receivables: input.receivables,
    cashIn: input.cashIn,
    cashOut: input.cashOut,
    netCashflow: input.cashIn - input.cashOut,
    orderCount: input.orderCount,
    averageOrderValue: input.orderCount > 0 ? Math.round(input.totalRevenue / input.orderCount) : 0,
  };
}

export function buildProfitLossLines(summary: FinancialReportSummaryDto) {
  return [
    { key: "sales-revenue", label: "Sales Revenue", amount: summary.totalRevenue, tone: "positive" as const },
    { key: "cogs", label: "Cost of Goods Sold", amount: -summary.cogs, tone: "negative" as const },
    { key: "gross-profit", label: "Gross Profit", amount: summary.grossProfit, tone: "total" as const },
    { key: "expenses", label: "Operating Expenses", amount: -summary.totalExpenses, tone: "negative" as const },
    { key: "net-profit", label: "Net Profit", amount: summary.netProfit, tone: summary.netProfit >= 0 ? "positive" as const : "negative" as const },
    { key: "cash-in", label: "Cash In", amount: summary.cashIn, tone: "positive" as const },
    { key: "cash-out", label: "Cash Out", amount: -summary.cashOut, tone: "negative" as const },
    { key: "net-cashflow", label: "Net Cashflow", amount: summary.netCashflow, tone: "total" as const },
    { key: "receivables", label: "Receivables", amount: summary.receivables, tone: "neutral" as const },
  ];
}

export function toFinancialBasisLabel(basis: FinancialReportBasis) {
  if (basis === "cashflow") return "Cashflow Only";
  if (basis === "orders") return "Orders / Recap Only";
  return "Hybrid: Orders + Cashflow + Inventory + Invoice";
}

export type TrendInput = {
  label: string;
  periodStart: Date;
  revenue: number;
  cogs: number;
  expenses: number;
  cashIn: number;
  cashOut: number;
};

export function toTrendPoint(input: TrendInput): FinancialTrendPointDto {
  const grossProfit = input.revenue - input.cogs;
  return {
    label: input.label,
    periodStart: toIsoDate(input.periodStart),
    revenue: input.revenue,
    cogs: input.cogs,
    grossProfit,
    expenses: input.expenses,
    netProfit: grossProfit - input.expenses,
    cashIn: input.cashIn,
    cashOut: input.cashOut,
  };
}

export type BestSellerInput = {
  menuItemId: string;
  label: string;
  quantity: number;
  revenue: number;
};

export function toBestSellerDto(row: BestSellerInput): FinancialBestSellerDto {
  return {
    menuItemId: row.menuItemId,
    label: row.label,
    quantity: row.quantity,
    revenue: row.revenue,
  };
}

export type CashflowRowInput = {
  id: string;
  occurredAt: Date;
  account: string;
  type: string;
  category: string;
  counterpartyName: string | null;
  description: string | null;
  amount: number;
  status: string;
  sourceType: string;
  sourceId: string | null;
};

export function toCashflowReportRow(row: CashflowRowInput): FinancialCashflowRowDto {
  return {
    id: row.id,
    date: toDateOnly(row.occurredAt),
    sourceAccount: row.account,
    type: row.type,
    category: row.category,
    sourceName: row.counterpartyName ?? row.sourceType,
    description: row.description ?? "-",
    amount: row.amount,
    status: row.status,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
  };
}

export type ReceivableInput = {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date | null;
  customerName: string;
  status: string;
  amount: number;
};

export function toReceivableDto(row: ReceivableInput): FinancialReceivableDto {
  return {
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    invoiceDate: toDateOnly(row.invoiceDate),
    dueDate: row.dueDate ? toDateOnly(row.dueDate) : null,
    customerName: row.customerName,
    status: row.status,
    amount: row.amount,
  };
}
