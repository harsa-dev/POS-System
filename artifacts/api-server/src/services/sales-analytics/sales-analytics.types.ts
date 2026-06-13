import type { OrderStatus, Role } from "@prisma/client";

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

export const salesAnalyticsPaidOrderStatuses = [
  "PAID",
  "PREPARING",
  "READY",
  "SERVED",
  "COMPLETED",
] as const satisfies readonly OrderStatus[];

export type SalesAnalyticsBasis = (typeof salesAnalyticsBases)[number];

export type SalesAnalyticsExportFormat =
  (typeof salesAnalyticsExportFormats)[number];

export type SalesAnalyticsOrderStatus =
  (typeof salesAnalyticsPaidOrderStatuses)[number];

export type SalesAnalyticsSortKey = (typeof salesAnalyticsSortKeys)[number];

export type SalesAnalyticsSortDirection =
  (typeof salesAnalyticsSortDirections)[number];

export type SalesAnalyticsActor = {
  id: string;
  role: Role;
};

export type SalesAnalyticsQuery = {
  from: Date;
  to: Date;
  basis: SalesAnalyticsBasis;
  productId?: string;
  categoryId?: string;
  paymentMethod?: string;
  orderStatus?: SalesAnalyticsOrderStatus;
  q?: string;
  page: number;
  pageSize: number;
  sortBy: SalesAnalyticsSortKey;
  sortDirection: SalesAnalyticsSortDirection;
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
