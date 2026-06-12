import type { Role } from "@prisma/client";

export const salesAnalyticsBases = ["paid"] as const;

export type SalesAnalyticsBasis = (typeof salesAnalyticsBases)[number];

export type SalesAnalyticsActor = {
  id: string;
  role: Role;
};

export type SalesAnalyticsQuery = {
  from: Date;
  to: Date;
  basis: SalesAnalyticsBasis;
  productId?: string;
  q?: string;
  limit: number;
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
