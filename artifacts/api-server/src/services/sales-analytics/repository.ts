import { OrderStatus, PaymentStatus, Prisma, StockMovementReason, type PrismaClient } from "@prisma/client";

import type { SalesAnalyticsFilterOptionsDto, SalesAnalyticsQuery } from "./sales-analytics.types.js";

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
  stockMovementsWithoutOrderSource: number | string | null;
};

export type SalesCogsByOrderRow = {
  orderId: string;
  cogs: number | string | null;
};

export type SalesCogsSummaryRow = {
  cogs: number | string | null;
};

export type SalesTransactionRowCount = {
  totalRows: number | string | null;
};

type FilterOptionRow = {
  value: string;
  label: string;
};

function orderStatusFilter(query: SalesAnalyticsQuery) {
  if (query.orderStatus) {
    return Prisma.sql`o.status = ${query.orderStatus}`;
  }

  return Prisma.sql`o.status IN (${Prisma.join(PAID_ORDER_STATUSES)})`;
}

function analyticsFilters(query: SalesAnalyticsQuery) {
  const filters: Prisma.Sql[] = [];

  if (query.productId) {
    filters.push(Prisma.sql`oi."menuItemId" = ${query.productId}`);
  }

  if (query.categoryId) {
    filters.push(Prisma.sql`mi."categoryId" = ${query.categoryId}`);
  }

  if (query.paymentMethod) {
    filters.push(Prisma.sql`o."paymentMethod" = ${query.paymentMethod}`);
  }

  if (query.q) {
    filters.push(Prisma.sql`mi.name ILIKE ${`%${query.q}%`}`);
  }

  return filters;
}

function orderItemWhere(businessId: string, query: SalesAnalyticsQuery) {
  const filters = [
    Prisma.sql`o."businessId" = ${businessId}`,
    Prisma.sql`o."createdAt" >= ${query.from}`,
    Prisma.sql`o."createdAt" <= ${query.to}`,
    orderStatusFilter(query),
    ...analyticsFilters(query),
  ];

  return Prisma.sql`${Prisma.join(filters, " AND ")}`;
}

function orderCogsCte(businessId: string) {
  return Prisma.sql`
    SELECT
      sm."sourceId" AS "orderId",
      COALESCE(SUM(ABS(sm.quantity) * ii."costPerUnit"), 0)::double precision AS cogs
    FROM "StockMovement" sm
    INNER JOIN "InventoryItem" ii ON ii.id = sm."inventoryItemId"
    WHERE sm."businessId" = ${businessId}
      AND sm."sourceId" IS NOT NULL
      AND ii."costPerUnit" > 0
      AND sm.reason = ${StockMovementReason.RECIPE_USAGE}
    GROUP BY sm."sourceId"
  `;
}

function allocatedItemCogsExpression() {
  return Prisma.sql`COALESCE(oc.cogs, 0) * (oi.subtotal / NULLIF(o.subtotal, 0))`;
}

function salesTransactionOrderBy(query: SalesAnalyticsQuery) {
  const direction = query.sortDirection === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;

  switch (query.sortBy) {
    case "productName":
      return Prisma.sql`mi.name ${direction}, o."createdAt" DESC, oi.id ASC`;
    case "quantity":
      return Prisma.sql`oi.quantity ${direction}, o."createdAt" DESC, oi.id ASC`;
    case "totalRevenue":
      return Prisma.sql`oi.subtotal ${direction}, o."createdAt" DESC, oi.id ASC`;
    case "grossProfit":
      return Prisma.sql`(oi.subtotal - ${allocatedItemCogsExpression()}) ${direction}, o."createdAt" DESC, oi.id ASC`;
    case "margin":
      return Prisma.sql`CASE
        WHEN oi.subtotal > 0 THEN
          ((oi.subtotal - ${allocatedItemCogsExpression()}) / oi.subtotal)
        ELSE 0
      END ${direction}, o."createdAt" DESC, oi.id ASC`;
    case "paymentStatus":
      return Prisma.sql`COALESCE(p.status::text, '') ${direction}, o."createdAt" DESC, oi.id ASC`;
    case "date":
    default:
      return Prisma.sql`o."createdAt" ${direction}, oi.id ASC`;
  }
}

function paginationOffset(query: SalesAnalyticsQuery) {
  return (query.page - 1) * query.pageSize;
}

function stockMovementWhere(businessId: string, query: SalesAnalyticsQuery) {
  const filters = [
    Prisma.sql`sm."businessId" = ${businessId}`,
    Prisma.sql`sm."createdAt" >= ${query.from}`,
    Prisma.sql`sm."createdAt" <= ${query.to}`,
    Prisma.sql`sm.reason = ${StockMovementReason.RECIPE_USAGE}`,
  ];

  return Prisma.sql`${Prisma.join(filters, " AND ")}`;
}

export async function getSalesRevenueSummary(
  prisma: PrismaClient,
  businessId: string,
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
    WHERE ${orderItemWhere(businessId, query)}
  `;

  return row;
}

export async function getSalesCogsSummary(
  prisma: PrismaClient,
  businessId: string,
  query: SalesAnalyticsQuery,
) {
  const [row] = await prisma.$queryRaw<SalesCogsSummaryRow[]>`
    WITH order_cogs AS (${orderCogsCte(businessId)})
    SELECT
      COALESCE(SUM(${allocatedItemCogsExpression()}), 0)::double precision AS cogs
    FROM "OrderItem" oi
    INNER JOIN "Order" o ON o.id = oi."orderId"
    INNER JOIN "MenuItem" mi ON mi.id = oi."menuItemId"
    LEFT JOIN order_cogs oc ON oc."orderId" = o.id
    WHERE ${orderItemWhere(businessId, query)}
  `;

  return row;
}

export async function getSalesDailyTrend(
  prisma: PrismaClient,
  businessId: string,
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
    WHERE ${orderItemWhere(businessId, query)}
    GROUP BY date_trunc('day', o."createdAt")
    ORDER BY date_trunc('day', o."createdAt") ASC
  `;
}

export async function getSalesBusyHours(
  prisma: PrismaClient,
  businessId: string,
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
    WHERE ${orderItemWhere(businessId, query)}
    GROUP BY EXTRACT(HOUR FROM o."createdAt")
    ORDER BY EXTRACT(HOUR FROM o."createdAt") ASC
  `;
}

export async function getSalesBestSellingProducts(
  prisma: PrismaClient,
  businessId: string,
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
    WHERE ${orderItemWhere(businessId, query)}
    GROUP BY mi.id, mi.name
    ORDER BY COALESCE(SUM(oi.quantity), 0) DESC, COALESCE(SUM(oi.subtotal), 0) DESC
    LIMIT 10
  `;
}

export async function countSalesTransactionRows(
  prisma: PrismaClient,
  businessId: string,
  query: SalesAnalyticsQuery,
) {
  const [row] = await prisma.$queryRaw<SalesTransactionRowCount[]>`
    SELECT COUNT(oi.id)::int AS "totalRows"
    FROM "OrderItem" oi
    INNER JOIN "Order" o ON o.id = oi."orderId"
    INNER JOIN "MenuItem" mi ON mi.id = oi."menuItemId"
    WHERE ${orderItemWhere(businessId, query)}
  `;

  return row;
}

export async function listSalesTransactionRows(
  prisma: PrismaClient,
  businessId: string,
  query: SalesAnalyticsQuery,
) {
  return prisma.$queryRaw<SalesTransactionRow[]>`
    WITH order_cogs AS (${orderCogsCte(businessId)})
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
    LEFT JOIN order_cogs oc ON oc."orderId" = o.id
    WHERE ${orderItemWhere(businessId, query)}
    ORDER BY ${salesTransactionOrderBy(query)}
    LIMIT ${query.pageSize}
    OFFSET ${paginationOffset(query)}
  `;
}

export async function getCogsByOrderIds(
  prisma: PrismaClient,
  businessId: string,
  orderIds: string[],
) {
  if (orderIds.length === 0) return [];

  return prisma.$queryRaw<SalesCogsByOrderRow[]>`
    SELECT
      sm."sourceId" AS "orderId",
      COALESCE(SUM(ABS(sm.quantity) * ii."costPerUnit"), 0)::double precision AS cogs
    FROM "StockMovement" sm
    INNER JOIN "InventoryItem" ii ON ii.id = sm."inventoryItemId"
    WHERE sm."businessId" = ${businessId}
      AND sm."sourceId" IN (${Prisma.join(orderIds)})
      AND ii."costPerUnit" > 0
      AND sm.reason = ${StockMovementReason.RECIPE_USAGE}
    GROUP BY sm."sourceId"
  `;
}

export async function getSalesSourceHealth(
  prisma: PrismaClient,
  businessId: string,
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
        WHERE ${stockMovementWhere(businessId, query)}
      ) AS "stockMovements",
      COUNT(DISTINCT o.id) FILTER (WHERE p.id IS NULL OR p.status <> ${PaymentStatus.PAID})::int AS "ordersWithoutPayment",
      (
        SELECT COUNT(sm.id)::int
        FROM "StockMovement" sm
        LEFT JOIN "InventoryItem" ii ON ii.id = sm."inventoryItemId"
        WHERE ${stockMovementWhere(businessId, query)}
          AND (ii.id IS NULL OR ii."costPerUnit" <= 0)
      ) AS "stockMovementsMissingCostSnapshot",
      (
        SELECT COUNT(sm.id)::int
        FROM "StockMovement" sm
        WHERE ${stockMovementWhere(businessId, query)}
          AND sm."sourceId" IS NULL
      ) AS "stockMovementsWithoutOrderSource"
    FROM "OrderItem" oi
    INNER JOIN "Order" o ON o.id = oi."orderId"
    INNER JOIN "MenuItem" mi ON mi.id = oi."menuItemId"
    LEFT JOIN "Payment" p ON p."orderId" = o.id
    WHERE ${orderItemWhere(businessId, query)}
  `;

  return row;
}

export async function listSalesAnalyticsFilterOptions(
  prisma: PrismaClient,
  businessId: string,
): Promise<SalesAnalyticsFilterOptionsDto> {
  const [products, categories, paymentMethods] = await Promise.all([
    prisma.$queryRaw<FilterOptionRow[]>`
      SELECT mi.id AS value, mi.name AS label
      FROM "MenuItem" mi
      WHERE mi."businessId" = ${businessId}
        AND mi."isAvailable" = true
      ORDER BY mi.name ASC
    `,
    prisma.$queryRaw<FilterOptionRow[]>`
      SELECT c.id AS value, c.name AS label
      FROM "Category" c
      WHERE c."businessId" = ${businessId}
      ORDER BY c.name ASC
    `,
    prisma.$queryRaw<FilterOptionRow[]>`
      SELECT DISTINCT o."paymentMethod" AS value, o."paymentMethod" AS label
      FROM "Order" o
      WHERE o."businessId" = ${businessId}
        AND o."paymentMethod" IS NOT NULL
        AND o."paymentMethod" <> ''
      ORDER BY o."paymentMethod" ASC
    `,
  ]);

  return {
    products,
    categories,
    paymentMethods,
    orderStatuses: PAID_ORDER_STATUSES.map((status) => ({
      value: status,
      label: status,
    })),
  };
}
