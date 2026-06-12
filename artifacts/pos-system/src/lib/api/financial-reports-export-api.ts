import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

export const financialReportBases = ["cashflow", "orders", "hybrid"] as const;

export type FinancialReportBasis = (typeof financialReportBases)[number];

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

export type FinancialProfitLossLineDto = {
  key: string;
  label: string;
  amount: number;
  tone: "positive" | "negative" | "neutral" | "total";
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

export type FinancialReportQuery = {
  from?: string;
  to?: string;
  basis?: FinancialReportBasis;
};

export type FinancialReportQueryExtra = Record<
  string,
  string | number | boolean | null | undefined
>;

type ApiDataEnvelope<T> = ApiEnvelope<T> & { data: T };

export function isFinancialReportBasis(
  value: unknown,
): value is FinancialReportBasis {
  return (
    typeof value === "string" &&
    financialReportBases.includes(value as FinancialReportBasis)
  );
}

export function buildFinancialReportQueryString(
  params?: FinancialReportQuery,
  extra?: FinancialReportQueryExtra,
) {
  const searchParams = new URLSearchParams();

  if (params?.from) searchParams.set("from", params.from);
  if (params?.to) searchParams.set("to", params.to);
  if (params?.basis) searchParams.set("basis", params.basis);

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value === null || value === undefined || value === "") continue;

      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

export const financialReportsApi = {
  getReport(params?: FinancialReportQuery) {
    return apiClient.get<ApiDataEnvelope<FinancialReportDto>>(
      `/api/financial-reports${buildFinancialReportQueryString(params)}`,
    );
  },
};