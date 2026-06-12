import type { BusinessContext } from "../../lib/business-context/business-context.types.js";
import { prisma } from "../../lib/prisma.js";
import {
  buildCogsByOrderMap,
  toBestSellerPoint,
  toSalesAnalyticsDataPoint,
  toSalesAnalyticsPeriodDto,
  toSalesAnalyticsSourceHealthDto,
  toSalesAnalyticsSummaryDto,
  toSalesTransactionDto,
} from "./sales-analytics.dto.js";
import { requireSalesAnalyticsExport, requireSalesAnalyticsView } from "./sales-analytics.permissions.js";
import {
  getCogsByOrderIds,
  getSalesBestSellingProducts,
  getSalesBusyHours,
  getSalesCogsSummary,
  getSalesDailyTrend,
  getSalesRevenueSummary,
  getSalesSourceHealth,
  listSalesTransactionRows,
} from "./repository.js";
import type {
  SalesAnalyticsActor,
  SalesAnalyticsDto,
  SalesAnalyticsQuery,
} from "./sales-analytics.types.js";
import { parseSalesAnalyticsQuery } from "./sales-analytics.validation.js";

export function parseSalesAnalyticsRequest(rawQuery: Record<string, unknown>) {
  return parseSalesAnalyticsQuery(rawQuery);
}

function hasProductScopedFilter(query: SalesAnalyticsQuery) {
  return Boolean(query.productId || query.q);
}

export async function getSalesAnalytics(params: {
  actor: SalesAnalyticsActor;
  businessContext: BusinessContext;
  query: SalesAnalyticsQuery;
}): Promise<SalesAnalyticsDto> {
  requireSalesAnalyticsView(params.actor.role);

  const restaurantId = params.businessContext.restaurantId;

  const [
    revenue,
    cogs,
    dailyTrend,
    busyHours,
    bestSellingProducts,
    rows,
    sourceHealth,
  ] = await Promise.all([
    getSalesRevenueSummary(prisma, restaurantId, params.query),
    getSalesCogsSummary(prisma, restaurantId, params.query),
    getSalesDailyTrend(prisma, restaurantId, params.query),
    getSalesBusyHours(prisma, restaurantId, params.query),
    getSalesBestSellingProducts(prisma, restaurantId, params.query),
    listSalesTransactionRows(prisma, restaurantId, params.query),
    getSalesSourceHealth(prisma, restaurantId, params.query),
  ]);

  const orderIds = Array.from(new Set(rows.map((row) => row.orderId)));
  const cogsByOrder = buildCogsByOrderMap(
    await getCogsByOrderIds(prisma, restaurantId, orderIds),
  );
  const productScopedFilter = hasProductScopedFilter(params.query);
  const sourceHealthDto = toSalesAnalyticsSourceHealthDto(sourceHealth);

  if (productScopedFilter) {
    sourceHealthDto.warnings.push(
      "COGS is hidden for product-filtered analytics until product-level cost allocation is implemented.",
    );
  }

  return {
    period: toSalesAnalyticsPeriodDto(params.query.from, params.query.to),
    basis: params.query.basis,
    generatedAt: new Date().toISOString(),
    summary: toSalesAnalyticsSummaryDto({
      revenue,
      cogs: productScopedFilter ? 0 : Number(cogs?.cogs ?? 0),
    }),
    rows: rows.map((row) => toSalesTransactionDto(row, cogsByOrder.get(row.orderId) ?? 0)),
    dailyTrend: dailyTrend.map(toSalesAnalyticsDataPoint),
    busyHours: busyHours.map(toSalesAnalyticsDataPoint),
    bestSellingProducts: bestSellingProducts.map(toBestSellerPoint),
    sourceHealth: sourceHealthDto,
  };
}

export async function exportSalesAnalytics(params: {
  actor: SalesAnalyticsActor;
  businessContext: BusinessContext;
  query: SalesAnalyticsQuery;
}) {
  requireSalesAnalyticsExport(params.actor.role);

  const data = await getSalesAnalytics(params);

  return {
    exportedAt: new Date().toISOString(),
    format: "json" as const,
    data,
  };
}
