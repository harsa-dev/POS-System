import type {
  SalesAnalyticsDataPointDto,
  SalesAnalyticsPeriodDto,
  SalesAnalyticsSourceHealthDto,
  SalesAnalyticsSummaryDto,
  SalesTransactionDto,
} from "./sales-analytics.types.js";
import type {
  SalesBestSellerRow,
  SalesCogsByOrderRow,
  SalesRevenueSummaryRow,
  SalesSourceHealthRow,
  SalesTransactionRow,
  SalesTrendRow,
} from "./repository.js";

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return 0;
  const normalized = typeof value === "number" ? value : Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
}

function roundCurrency(value: number) {
  return Math.round(value);
}

function roundRatio(value: number) {
  return Math.round(value * 100) / 100;
}

function safeMargin(profit: number, revenue: number) {
  if (revenue <= 0) return 0;
  return roundRatio((profit / revenue) * 100);
}

export function toSalesAnalyticsPeriodDto(from: Date, to: Date): SalesAnalyticsPeriodDto {
  const fromIso = from.toISOString();
  const toIso = to.toISOString();

  return {
    from: fromIso,
    to: toIso,
    label: `${fromIso.slice(0, 10)} - ${toIso.slice(0, 10)}`,
  };
}

export function toSalesAnalyticsSummaryDto(params: {
  revenue: SalesRevenueSummaryRow | undefined;
  cogs: number;
  receivables?: number;
}): SalesAnalyticsSummaryDto {
  const grossRevenue = roundCurrency(toNumber(params.revenue?.grossRevenue));
  const totalRevenue = roundCurrency(toNumber(params.revenue?.totalRevenue));
  const cogs = roundCurrency(params.cogs);
  const grossProfit = totalRevenue - cogs;
  const quantity = toNumber(params.revenue?.quantity);
  const transactionCount = toNumber(params.revenue?.transactionCount);
  const orderCount = toNumber(params.revenue?.orderCount);

  return {
    grossRevenue,
    totalDiscount: 0,
    totalRevenue,
    cogs,
    grossProfit,
    margin: safeMargin(grossProfit, totalRevenue),
    netProfit: grossProfit,
    quantity,
    transactionCount,
    orderCount,
    averageOrderValue: orderCount > 0 ? roundCurrency(totalRevenue / orderCount) : 0,
    receivables: roundCurrency(params.receivables ?? 0),
  };
}

export function toSalesAnalyticsDataPoint(row: SalesTrendRow): SalesAnalyticsDataPointDto {
  const revenue = roundCurrency(toNumber(row.revenue));
  const quantity = toNumber(row.quantity);
  const orderCount = toNumber(row.orderCount);

  return {
    label: row.label,
    value: revenue,
    revenue,
    quantity: quantity || orderCount,
  };
}

export function toBestSellerPoint(row: SalesBestSellerRow): SalesAnalyticsDataPointDto {
  const revenue = roundCurrency(toNumber(row.revenue));
  const quantity = toNumber(row.quantity);

  return {
    label: row.label,
    value: quantity,
    revenue,
    quantity,
  };
}

export function buildCogsByOrderMap(rows: SalesCogsByOrderRow[]) {
  return new Map(rows.map((row) => [row.orderId, toNumber(row.cogs)]));
}

export function toSalesTransactionDto(
  row: SalesTransactionRow,
  orderCogs: number,
): SalesTransactionDto {
  const totalRevenue = roundCurrency(row.totalRevenue);
  const orderSubtotal = row.orderSubtotal > 0 ? row.orderSubtotal : totalRevenue;
  const allocatedCogs = orderSubtotal > 0 ? roundCurrency(orderCogs * (totalRevenue / orderSubtotal)) : 0;
  const grossProfit = totalRevenue - allocatedCogs;

  return {
    id: row.id,
    orderId: row.orderId,
    orderNumber: row.orderNumber,
    date: row.date.toISOString(),
    menuItemId: row.menuItemId,
    productName: row.productName,
    categoryName: row.categoryName ?? "Uncategorized",
    quantity: row.quantity,
    sellingPrice: row.sellingPrice,
    grossRevenue: roundCurrency(row.grossRevenue),
    discount: 0,
    totalRevenue,
    cogs: allocatedCogs,
    grossProfit,
    margin: safeMargin(grossProfit, totalRevenue),
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus ?? "UNKNOWN",
    orderStatus: row.orderStatus,
  };
}

export function toSalesAnalyticsSourceHealthDto(
  row: SalesSourceHealthRow | undefined,
): SalesAnalyticsSourceHealthDto {
  const healthWithoutWarnings = {
    paidOrders: toNumber(row?.paidOrders),
    orderItems: toNumber(row?.orderItems),
    paidPayments: toNumber(row?.paidPayments),
    stockMovements: toNumber(row?.stockMovements),
    ordersWithoutPayment: toNumber(row?.ordersWithoutPayment),
    stockMovementsMissingCostSnapshot: toNumber(row?.stockMovementsMissingCostSnapshot),
    stockMovementsWithoutOrderSource: toNumber(row?.stockMovementsWithoutOrderSource),
  };

  const warnings: string[] = [];
  if (healthWithoutWarnings.paidOrders > 0 && healthWithoutWarnings.orderItems === 0) {
    warnings.push("Paid orders exist without order item rows.");
  }
  if (healthWithoutWarnings.ordersWithoutPayment > 0) {
    warnings.push("Some paid lifecycle orders have no paid payment row.");
  }
  if (healthWithoutWarnings.stockMovementsMissingCostSnapshot > 0) {
    warnings.push("Some stock movements are missing usable inventory cost, so COGS may be understated.");
  }
  if (healthWithoutWarnings.stockMovementsWithoutOrderSource > 0) {
    warnings.push(
      "Some recipe usage stock movements are not linked to orders, so allocated COGS may be understated.",
    );
  }

  return {
    ...healthWithoutWarnings,
    warnings,
  };
}
