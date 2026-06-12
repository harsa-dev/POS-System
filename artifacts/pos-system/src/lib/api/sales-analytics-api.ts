import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

export const salesAnalyticsBases = ["paid"] as const;

export const salesAnalyticsExportFormats = ["json", "csv"] as const;

export type SalesAnalyticsBasis = (typeof salesAnalyticsBases)[number];

export type SalesAnalyticsExportFormat =
  (typeof salesAnalyticsExportFormats)[number];

export type SalesAnalyticsQuery = {
  from?: string;
  to?: string;
  basis?: SalesAnalyticsBasis;
  productId?: string;
  q?: string;
  limit?: number;
};

export type SalesAnalyticsExportQuery = SalesAnalyticsQuery & {
  format?: SalesAnalyticsExportFormat;
};

export type SalesAnalyticsPeriodDto = {
  from: string;
  to: string;
  label: string;
};

export type SalesAnalyticsSummaryDto = {
  grossRevenue: number;
  totalDiscount: number;
  totalRevenue: number;
  cogs: number;
  grossProfit: number;
  margin: number;
  netProfit: number;
  quantity: number;
  transactionCount: number;
  orderCount: number;
  averageOrderValue: number;
  receivables: number;
};

export type SalesTransactionDto = {
  id: string;
  orderId: string;
  orderNumber: number;
  date: string;
  menuItemId: string;
  productName: string;
  categoryName: string;
  quantity: number;
  sellingPrice: number;
  grossRevenue: number;
  discount: number;
  totalRevenue: number;
  cogs: number;
  grossProfit: number;
  margin: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
};

export type SalesAnalyticsDataPointDto = {
  label: string;
  value: number;
  revenue: number;
  quantity: number;
};

export type SalesAnalyticsSourceHealthDto = {
  paidOrders: number;
  orderItems: number;
  paidPayments: number;
  stockMovements: number;
  ordersWithoutPayment: number;
  stockMovementsMissingCostSnapshot: number;
  warnings: string[];
};

export type SalesAnalyticsDto = {
  period: SalesAnalyticsPeriodDto;
  basis: SalesAnalyticsBasis;
  generatedAt: string;
  summary: SalesAnalyticsSummaryDto;
  rows: SalesTransactionDto[];
  dailyTrend: SalesAnalyticsDataPointDto[];
  busyHours: SalesAnalyticsDataPointDto[];
  bestSellingProducts: SalesAnalyticsDataPointDto[];
  sourceHealth: SalesAnalyticsSourceHealthDto;
};

export type SalesAnalyticsExportFileDto = {
  exportedAt: string;
  format: SalesAnalyticsExportFormat;
  filename: string;
  contentType: string;
  auditLogged: boolean;
  report?: SalesAnalyticsDto;
  content?: string;
};

type ApiDataEnvelope<T> = ApiEnvelope<T> & { data: T };

export function isSalesAnalyticsBasis(value: unknown): value is SalesAnalyticsBasis {
  return (
    typeof value === "string" &&
    salesAnalyticsBases.includes(value as SalesAnalyticsBasis)
  );
}

export function isSalesAnalyticsExportFormat(
  value: unknown,
): value is SalesAnalyticsExportFormat {
  return (
    typeof value === "string" &&
    salesAnalyticsExportFormats.includes(value as SalesAnalyticsExportFormat)
  );
}

export function buildSalesAnalyticsQueryString(params?: SalesAnalyticsExportQuery) {
  const searchParams = new URLSearchParams();

  if (params?.from) searchParams.set("from", params.from);
  if (params?.to) searchParams.set("to", params.to);
  if (params?.basis) searchParams.set("basis", params.basis);
  if (params?.productId) searchParams.set("productId", params.productId);
  if (params?.q) searchParams.set("q", params.q);
  if (params?.format) searchParams.set("format", params.format);
  if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

export const salesAnalyticsApi = {
  getReport(params?: SalesAnalyticsQuery) {
    return apiClient.get<ApiDataEnvelope<SalesAnalyticsDto>>(
      `/api/sales-analytics${buildSalesAnalyticsQueryString(params)}`,
    );
  },

  exportReport(params?: SalesAnalyticsExportQuery) {
    return apiClient.get<ApiDataEnvelope<SalesAnalyticsExportFileDto>>(
      `/api/sales-analytics/export${buildSalesAnalyticsQueryString(params)}`,
    );
  },
};
