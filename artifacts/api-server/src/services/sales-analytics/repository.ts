import { OrderStatus, PaymentStatus, Prisma, StockMovementReason, type PrismaClient } from "@prisma/client";

import type { SalesAnalyticsQuery } from "./sales-analytics.types.js";

const PAID_ORDER_STATUSES = [
  OrderStatus.PAID,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.SERVED,
  OrderStatus.COMPLETED,
] as const;

export type SalesRevenueSummaryRow = {
  grossRevenue: number | string | null;
  totalRevenue: number | string | null;
  quantity: number | string | null;
  transactionCount: number | string | null;
  orderCount: number | string | null;
};

export type SalesTrendRow = {
  label: string;
  revenue: number | string | null;
  quantity: number | string | null;
  orderCount: number | string | null;
};

export type SalesBestSellerRow = {
  menuItemId: string;
  label: string;
  revenue: number | string | null;
  quantity: number | string | null;
};

export type SalesTransactionRow = {
  id: string;
  orderId: string;
  orderNumber: number;
  date: Date;
  menuItemId: string;
  productName: string;
  categoryName: string | null;
  quantity: number;
  sellingPrice: number;
  grossRevenue: number;
  totalRevenue: number;
  orderSubtotal: number;
  paymentMethod: string;
  paymentStatus: string | null;
  orderStatus: string;
};

export type SalesSourceHealthRow = {
  paidOrders: number | string | null;
  orderItems: number | string | null;
  paidPayments: number | string | null;
  stockMovements: number | string | null;
  ordersWithoutPayment: number | string | null;
  stockMovementsMissingCostSnapshot: number | string | null;
};

export type SalesCogsByOrderRow = {
  orderId: string;
  cogs: number | string | null;
};

export type SalesCogsSummaryRow = {
  cogs: number | string | null;
};

function productFilter(query: SalesAnalyticsQuery) {
  const filters: Prisma.Sql[] = [];

  if (query.productId) {
    filters.push(Prisma.sql`oi."menuItemId" = ${query.productId}`);
  }

  if (query.q) {
    filters.push(Prisma.sql`mi.name ILIKE ${`%${query.q}%`}`);
  }

  return filters;
}

function orderItemWhere(restaurantId: string, query: SalesAnalyticsQuery) {
  const filters = [
    Prisma.sql`o."restaurantId" = ${restaurantId}`,
    Prisma.sql`o."createdAt" >= ${query.from}`,
    Prisma.sql`o."createdAt" <= ${query.to}`,
    Prisma.sql`o.status IN (${Prisma.join(PAID_ORDER_STATUSES)})`,
    ...productFilter(query),
  ];

  return Prisma.sql`${Prisma.join(filters, " AND ")}`;
}

function stockMovementWhere(restaurantId: string, query: SalesAnalyticsQuery) {
  const filters = [
    Prisma.sql`sm."restaurantId" = ${restaurantId}`,
    Prisma.sql`sm."createdAt" >= ${query.from}`,
    Prisma.sql`sm."createdAt" <= ${query.to}`,
    Prisma.sql`sm.reason = ${StockMovementReason.RECIPE_USAGE}`,
  ];

  return Prisma.sql`${Prisma.join(filters, " AND ")}`;
}

export async function getSalesRevenueSummary(
  prisma: PrismaClient,
  restaurantId: string,
  query: SalesAnalyticsQuery,
) {
  const [row] = await prisma.$queryRaw<SalesRevenueSummaryRow[]>`
    SELECT
      COALESCE(SUM(oi.subtotal), 0)::double precision AS "grossRevenue",
      COALESCE(SUM(oi.subtotal), 0)::double precision AS "totalRevenue",
      COALESCE(SUM(oi.quantity), 0)::double precision AS "quantity",
      COUNT(oi.id)::int AS "transactionCount",
      COUNT(DISTINCT o.id)::int AS "orderCount"
    FROM "OrderItem" oi
    INNER JOIN "Order" o ON o.id = oi."orderId"
    INNER JOIN "MenuItem" mi ON mi.id = oi."menuItemId"
    WHERE ${orderItemWhere(restaurantId, query)}
  `;

  return row;
}

export async function getSalesCogsSummary(
  prisma: PrismaClient,
  restaurantId: string,
  query: SalesAnalyticsQuery,
) {
  const [row] = await prisma.$queryRaw<SalesCogsSummaryRow[]>`
    SELECT
      COALESCE(SUM(ABS(sm.quantity) * sm."unitCostSnapshot"), 0)::double precision AS cogs
    FROM "StockMovement" sm
    WHERE ${stockMovementWhere(restaurantId, query)}
      AND sm."unitCostSnapshot" IS NOT NULL
  `;

  return row;
}

export async function getSalesDailyTrend(
  prisma: PrismaClient,
  restaurantId: string,
  query: SalesAnalyticsQuery,
) {
  return prisma.$queryRaw<SalesTrendRow[]>`
    SELECT
      to_char(date_trunc('day', o."createdAt"), 'YYYY-MM-DD') AS label,
      COALESCE(SUM(oi.subtotal), 0)::double precision AS revenue,
      COALESCE(SUM(oi.quantity), 0)::double precision AS quantity,
      COUNT(DISTINCT o.id)::int AS "orderCount"
    FROM "OrderItem" oi
    INNER JOIN "Order" o ON o.id = oi."orderId"
    INNER JOIN "MenuItem" mi ON mi.id = oi."menuItemId"
    WHERE ${orderItemWhere(restaurantId, query)}
    GROUP BY date_trunc('day', o."createdAt")
    ORDER BY date_trunc('day', o."createdAt") ASC
  `;
}

export async function getSalesBusyHours(
  prisma: PrismaClient,
  restaurantId: string,
  query: SalesAnalyticsQuery,
) {
  return prisma.$queryRaw<SalesTrendRow[]>`
    SELECT
      LPAD(EXTRACT(HOUR FROM o."createdAt")::text, 2, '0') || ':00' AS label,
      COALESCE(SUM(oi.subtotal), 0)::double precision AS revenue,
      COALESCE(SUM(oi.quantity), 0)::double precision AS quantity,
      COUNT(DISTINCT o.id)::int AS "orderCount"
    FROM "OrderItem" oi
    INNER JOIN "Order" o ON o.id = oi."orderId"
    INNER JOIN "MenuItem" mi ON mi.id = oi."menuItemId"
    WHERE ${orderItemWhere(restaurantId, query)}
    GROUP BY EXTRACT(HOUR FROM o."createdAt")
    ORDER BY EXTRACT(HOUR FROM o."createdAt") ASC
  `;
}

export async function getSalesBestSellingProducts(
  prisma: PrismaClient,
  restaurantId: string,
  query: SalesAnalyticsQuery,
) {
  return prisma.$queryRaw<SalesBestSellerRow[]>`
    SELECT
      mi.id AS "menuItemId",
      mi.name AS label,
      COALESCE(SUM(oi.subtotal), 0)::double precision AS revenue,
      COALESCE(SUM(oi.quantity), 0)::double precision AS quantity
    FROM "OrderItem" oi
    INNER JOIN "Order" o ON o.id = oi."orderId"
    INNER JOIN "MenuItem" mi ON mi.id = oi."menuItemId"
    WHERE ${orderItemWhere(restaurantId, query)}
    GROUP BY mi.id, mi.name
    ORDER BY COALESCE(SUM(oi.quantity), 0) DESC, COALESCE(SUM(oi.subtotal), 0) DESC
    LIMIT 10
  `;
}

export async function listSalesTransactionRows(
  prisma: PrismaClient,
  restaurantId: string,
  query: SalesAnalyticsQuery,
) {
  return prisma.$queryRaw<SalesTransactionRow[]>`
    SELECT
      oi.id,
      o.id AS "orderId",
      o."orderNumber",
      o."createdAt" AS date,
      mi.id AS "menuItemId",
      mi.name AS "productName",
      c.name AS "categoryName",
      oi.quantity,
      oi.price AS "sellingPrice",
      oi.subtotal AS "grossRevenue",
      oi.subtotal AS "totalRevenue",
      o.subtotal AS "orderSubtotal",
      o."paymentMethod",
      p.status AS "paymentStatus",
      o.status AS "orderStatus"
    FROM "OrderItem" oi
    INNER JOIN "Order" o ON o.id = oi."orderId"
    INNER JOIN "MenuItem" mi ON mi.id = oi."menuItemId"
    LEFT JOIN "Category" c ON c.id = mi."categoryId"
    LEFT JOIN "Payment" p ON p."orderId" = o.id
    WHERE ${orderItemWhere(restaurantId, query)}
    ORDER BY o."createdAt" DESC, oi.id ASC
    LIMIT ${query.limit}
  `;
}

export async function getCogsByOrderIds(
  prisma: PrismaClient,
  restaurantId: string,
  orderIds: string[],
) {
  if (orderIds.length === 0) return [];

  return prisma.$queryRaw<SalesCogsByOrderRow[]>`
    SELECT
      sm."sourceId" AS "orderId",
      COALESCE(SUM(ABS(sm.quantity) * sm."unitCostSnapshot"), 0)::double precision AS cogs
    FROM "StockMovement" sm
    WHERE sm."restaurantId" = ${restaurantId}
      AND sm."sourceId" IN (${Prisma.join(orderIds)})
      AND sm."unitCostSnapshot" IS NOT NULL
      AND sm.reason = ${StockMovementReason.RECIPE_USAGE}
    GROUP BY sm."sourceId"
  `;
}

export async function getSalesSourceHealth(
  prisma: PrismaClient,
  restaurantId: string,
  query: SalesAnalyticsQuery,
) {
  const [row] = await prisma.$queryRaw<SalesSourceHealthRow[]>`
    SELECT
      COUNT(DISTINCT o.id)::int AS "paidOrders",
      COUNT(oi.id)::int AS "orderItems",
      COUNT(DISTINCT p.id) FILTER (WHERE p.status = ${PaymentStatus.PAID})::int AS "paidPayments",
      (
        SELECT COUNT(sm.id)::int
        FROM "StockMovement" sm
        WHERE ${stockMovementWhere(restaurantId, query)}
      ) AS "stockMovements",
      COUNT(DISTINCT o.id) FILTER (WHERE p.id IS NULL OR p.status <> ${PaymentStatus.PAID})::int AS "ordersWithoutPayment",
      (
        SELECT COUNT(sm_missing.id)::int
        FROM "StockMovement" sm_missing
        WHERE ${stockMovementWhere(restaurantId, query)}
          AND sm_missing."unitCostSnapshot" IS NULL
      ) AS "stockMovementsMissingCostSnapshot"
    FROM "Order" o
    LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
    LEFT JOIN "Payment" p ON p."orderId" = o.id
    WHERE o."restaurantId" = ${restaurantId}
      AND o."createdAt" >= ${query.from}
      AND o."createdAt" <= ${query.to}
      AND o.status IN (${Prisma.join(PAID_ORDER_STATUSES)})
  `;

  return row;
}
