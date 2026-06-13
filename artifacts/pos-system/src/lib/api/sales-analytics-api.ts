import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

export const salesAnalyticsBases = ["paid"] as const;

export const salesAnalyticsExportFormats = ["json", "csv"] as const;

export const salesAnalyticsSortKeys = [
  "date",
  "productName",
  "quantity",
  "totalRevenue",
  "grossProfit",
  "margin",
  "paymentStatus",
] as const;

export const salesAnalyticsSortDirections = ["asc", "desc"] as const;

export type SalesAnalyticsBasis = (typeof salesAnalyticsBases)[number];

export type SalesAnalyticsExportFormat =
  (typeof salesAnalyticsExportFormats)[number];

export type SalesAnalyticsOrderStatus =
  | "PAID"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "COMPLETED";

export type SalesAnalyticsSortKey = (typeof salesAnalyticsSortKeys)[number];

export type SalesAnalyticsSortDirection =
  (typeof salesAnalyticsSortDirections)[number];

export type SalesAnalyticsQuery = {
  from?: string;
  to?: string;
  basis?: SalesAnalyticsBasis;
  productId?: string;
  categoryId?: string;
  paymentMethod?: string;
  orderStatus?: SalesAnalyticsOrderStatus;
  q?: string;
  page?: number;
  pageSize?: number;
  sortBy?: SalesAnalyticsSortKey;
  sortDirection?: SalesAnalyticsSortDirection;
};

export type SalesAnalyticsExportQuery = SalesAnalyticsQuery & {
  format?: SalesAnalyticsExportFormat;
};

export type SalesAnalyticsFilterOptionDto = {
  value: string;
  label: string;
};

export type SalesAnalyticsFilterOptionsDto = {
  products: SalesAnalyticsFilterOptionDto[];
  categories: SalesAnalyticsFilterOptionDto[];
  paymentMethods: SalesAnalyticsFilterOptionDto[];
  orderStatuses: SalesAnalyticsFilterOptionDto[];
};

export type SalesAnalyticsPaginationDto = {
  page: number;
  pageSize: number;
  totalRows: number;
  totalPages: number;
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
  stockMovementsWithoutOrderSource: number;
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
  pagination: SalesAnalyticsPaginationDto;
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

export type SalesAnalyticsReconciliationIssueSeverity =
  | "info"
  | "warning"
  | "critical";

export type SalesAnalyticsReconciliationIssueDto = {
  key: string;
  title: string;
  description: string;
  severity: SalesAnalyticsReconciliationIssueSeverity;
  count: number;
};

export type SalesAnalyticsReconciliationDetailRowDto = {
  id: string;
  date: string;
  sourceType: string;
  reference: string;
  description: string;
  amount: number;
  status: string;
};

export type SalesAnalyticsReconciliationDto = {
  generatedAt: string;
  period: {
    from: string;
    to: string;
  };
  issues: SalesAnalyticsReconciliationIssueDto[];
  ordersWithoutPaidPayment: SalesAnalyticsReconciliationDetailRowDto[];
  paymentTotalMismatches: SalesAnalyticsReconciliationDetailRowDto[];
  missingCostSnapshots: SalesAnalyticsReconciliationDetailRowDto[];
  zeroRevenueRows: SalesAnalyticsReconciliationDetailRowDto[];
  cancelledOrdersInPeriod: SalesAnalyticsReconciliationDetailRowDto[];
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
  if (params?.categoryId) searchParams.set("categoryId", params.categoryId);
  if (params?.paymentMethod) {
    searchParams.set("paymentMethod", params.paymentMethod);
  }
  if (params?.orderStatus) searchParams.set("orderStatus", params.orderStatus);
  if (params?.q) searchParams.set("q", params.q);
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.pageSize !== undefined) {
    searchParams.set("pageSize", String(params.pageSize));
  }
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortDirection) {
    searchParams.set("sortDirection", params.sortDirection);
  }
  if (params?.format) searchParams.set("format", params.format);

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

export const salesAnalyticsApi = {
  getReport(params?: SalesAnalyticsQuery) {
    return apiClient.get<ApiDataEnvelope<SalesAnalyticsDto>>(
      `/api/sales-analytics${buildSalesAnalyticsQueryString(params)}`,
    );
  },

  getFilterOptions(params?: SalesAnalyticsQuery) {
    return apiClient.get<ApiDataEnvelope<SalesAnalyticsFilterOptionsDto>>(
      `/api/sales-analytics/filter-options${buildSalesAnalyticsQueryString(params)}`,
    );
  },

  getReconciliation(params?: SalesAnalyticsQuery) {
    return apiClient.get<ApiDataEnvelope<SalesAnalyticsReconciliationDto>>(
      `/api/sales-analytics/reconciliation${buildSalesAnalyticsQueryString(params)}`,
    );
  },

  exportReport(params?: SalesAnalyticsExportQuery) {
    return apiClient.get<ApiDataEnvelope<SalesAnalyticsExportFileDto>>(
      `/api/sales-analytics/export${buildSalesAnalyticsQueryString(params)}`,
    );
  },
};
