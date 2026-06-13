import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  StockMovementReason,
  type PrismaClient,
} from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/business-context.types.js";
import { prisma } from "../../lib/prisma.js";
import { requireSalesAnalyticsView } from "./sales-analytics.permissions.js";
import type {
  SalesAnalyticsActor,
  SalesAnalyticsQuery,
  SalesAnalyticsReconciliationDetailRowDto,
  SalesAnalyticsReconciliationDto,
  SalesAnalyticsReconciliationIssueDto,
} from "./sales-analytics.types.js";

const PAID_ORDER_STATUSES = [
  OrderStatus.PAID,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.SERVED,
  OrderStatus.COMPLETED,
] as const;

const DETAIL_LIMIT = 50;

type Money = bigint | number | string | null | undefined;

type CountRow = {
  count: number | string | bigint | null;
};

type DetailRow = {
  id: string;
  date: Date;
  sourceType: string;
  reference: string | null;
  description: string | null;
  amount: Money;
  status: string;
};

function toNumber(value: Money) {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;

  return 0;
}

function toCount(rows: CountRow[]) {
  return toNumber(rows[0]?.count);
}

function toDetailRow(row: DetailRow): SalesAnalyticsReconciliationDetailRowDto {
  return {
    id: row.id,
    date: row.date.toISOString(),
    sourceType: row.sourceType,
    reference: row.reference ?? "-",
    description: row.description ?? "-",
    amount: toNumber(row.amount),
    status: row.status,
  };
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

  if (query.orderStatus) {
    filters.push(Prisma.sql`o.status = ${query.orderStatus}`);
  }

  if (query.q) {
    filters.push(Prisma.sql`mi.name ILIKE ${`%${query.q}%`}`);
  }

  return filters;
}

function paidOrderWhere(restaurantId: string, query: SalesAnalyticsQuery) {
  return Prisma.sql`
    o."restaurantId" = ${restaurantId}
    AND o."createdAt" >= ${query.from}
    AND o."createdAt" <= ${query.to}
    AND o.status IN (${Prisma.join(PAID_ORDER_STATUSES)})
  `;
}

function orderItemWhere(restaurantId: string, query: SalesAnalyticsQuery) {
  const filters = [
    Prisma.sql`o."restaurantId" = ${restaurantId}`,
    Prisma.sql`o."createdAt" >= ${query.from}`,
    Prisma.sql`o."createdAt" <= ${query.to}`,
    Prisma.sql`o.status IN (${Prisma.join(PAID_ORDER_STATUSES)})`,
    ...analyticsFilters(query),
  ];

  return Prisma.sql`${Prisma.join(filters, " AND ")}`;
}

async function countOrdersWithoutPaidPayment(
  db: PrismaClient,
  restaurantId: string,
  query: SalesAnalyticsQuery,
) {
  const rows = await db.$queryRaw<CountRow[]>`
    SELECT COUNT(DISTINCT o.id)::int AS "count"
    FROM "Order" o
    LEFT JOIN "Payment" p
      ON p."orderId" = o.id
      AND p.status = ${PaymentStatus.PAID}
    WHERE ${paidOrderWhere(restaurantId, query)}
      AND p.id IS NULL;
  `;

  return toCount(rows);
}

async function countPaymentTotalMismatches(
  db: PrismaClient,
  restaurantId: string,
  query: SalesAnalyticsQuery,
) {
  const rows = await db.$queryRaw<CountRow[]>`
    SELECT COUNT(DISTINCT o.id)::int AS "count"
    FROM "Order" o
    INNER JOIN "Payment" p
      ON p."orderId" = o.id
      AND p.status = ${PaymentStatus.PAID}
    WHERE ${paidOrderWhere(restaurantId, query)}
      AND o."amountPaid" <> o.total;
  `;

  return toCount(rows);
}

async function countMissingCostSnapshots(
  db: PrismaClient,
  restaurantId: string,
  query: SalesAnalyticsQuery,
) {
  const rows = await db.$queryRaw<CountRow[]>`
    SELECT COUNT(sm.id)::int AS "count"
    FROM "StockMovement" sm
    WHERE sm."restaurantId" = ${restaurantId}
      AND sm."createdAt" >= ${query.from}
      AND sm."createdAt" <= ${query.to}
      AND sm.reason = ${StockMovementReason.RECIPE_USAGE}
      AND (
        sm."unitCostSnapshot" IS NULL
        OR sm."unitCostSnapshot" <= 0
      );
  `;

  return toCount(rows);
}

async function countZeroRevenueRows(
  db: PrismaClient,
  restaurantId: string,
  query: SalesAnalyticsQuery,
) {
  const rows = await db.$queryRaw<CountRow[]>`
    SELECT COUNT(oi.id)::int AS "count"
    FROM "OrderItem" oi
    INNER JOIN "Order" o ON o.id = oi."orderId"
    INNER JOIN "MenuItem" mi ON mi.id = oi."menuItemId"
    WHERE ${orderItemWhere(restaurantId, query)}
      AND (
        oi.subtotal <= 0
        OR oi.price <= 0
        OR oi.quantity <= 0
      );
  `;

  return toCount(rows);
}

async function countCancelledOrders(
  db: PrismaClient,
  restaurantId: string,
  query: SalesAnalyticsQuery,
) {
  const rows = await db.$queryRaw<CountRow[]>`
    SELECT COUNT(o.id)::int AS "count"
    FROM "Order" o
    WHERE o."restaurantId" = ${restaurantId}
      AND o."createdAt" >= ${query.from}
      AND o."createdAt" <= ${query.to}
      AND o.status = ${OrderStatus.CANCELLED};
  `;

  return toCount(rows);
}

async function listOrdersWithoutPaidPayment(
  db: PrismaClient,
  restaurantId: string,
  query: SalesAnalyticsQuery,
) {
  const rows = await db.$queryRaw<DetailRow[]>`
    SELECT
      o.id AS id,
      o."createdAt" AS date,
      'ORDER_PAYMENT' AS "sourceType",
      ('Order #' || o."orderNumber") AS reference,
      'Paid lifecycle order without PAID payment record' AS description,
      o.total::bigint AS amount,
      o.status::text AS status
    FROM "Order" o
    LEFT JOIN "Payment" p
      ON p."orderId" = o.id
      AND p.status = ${PaymentStatus.PAID}
    WHERE ${paidOrderWhere(restaurantId, query)}
      AND p.id IS NULL
    ORDER BY o."createdAt" DESC
    LIMIT ${DETAIL_LIMIT};
  `;

  return rows.map(toDetailRow);
}

async function listPaymentTotalMismatches(
  db: PrismaClient,
  restaurantId: string,
  query: SalesAnalyticsQuery,
) {
  const rows = await db.$queryRaw<DetailRow[]>`
    SELECT
      o.id AS id,
      o."createdAt" AS date,
      'PAYMENT_TOTAL' AS "sourceType",
      ('Order #' || o."orderNumber") AS reference,
      ('amountPaid ' || o."amountPaid" || ' does not match order total ' || o.total) AS description,
      (o."amountPaid" - o.total)::bigint AS amount,
      p.status::text AS status
    FROM "Order" o
    INNER JOIN "Payment" p
      ON p."orderId" = o.id
      AND p.status = ${PaymentStatus.PAID}
    WHERE ${paidOrderWhere(restaurantId, query)}
      AND o."amountPaid" <> o.total
    ORDER BY o."createdAt" DESC
    LIMIT ${DETAIL_LIMIT};
  `;

  return rows.map(toDetailRow);
}

async function listMissingCostSnapshots(
  db: PrismaClient,
  restaurantId: string,
  query: SalesAnalyticsQuery,
) {
  const rows = await db.$queryRaw<DetailRow[]>`
    SELECT
      sm.id AS id,
      sm."createdAt" AS date,
      COALESCE(sm."sourceType"::text, 'STOCK_MOVEMENT') AS "sourceType",
      COALESCE(ii.name, sm."inventoryItemId") AS reference,
      COALESCE(sm.note, 'Recipe usage stock movement without unitCostSnapshot') AS description,
      ROUND(ABS(sm.quantity) * COALESCE(ii."costPerUnit", 0))::bigint AS amount,
      COALESCE(sm.reason::text, sm.type::text) AS status
    FROM "StockMovement" sm
    LEFT JOIN "InventoryItem" ii ON ii.id = sm."inventoryItemId"
    WHERE sm."restaurantId" = ${restaurantId}
      AND sm."createdAt" >= ${query.from}
      AND sm."createdAt" <= ${query.to}
      AND sm.reason = ${StockMovementReason.RECIPE_USAGE}
      AND (
        sm."unitCostSnapshot" IS NULL
        OR sm."unitCostSnapshot" <= 0
      )
    ORDER BY sm."createdAt" DESC
    LIMIT ${DETAIL_LIMIT};
  `;

  return rows.map(toDetailRow);
}

async function listZeroRevenueRows(
  db: PrismaClient,
  restaurantId: string,
  query: SalesAnalyticsQuery,
) {
  const rows = await db.$queryRaw<DetailRow[]>`
    SELECT
      oi.id AS id,
      o."createdAt" AS date,
      'ORDER_ITEM' AS "sourceType",
      ('Order #' || o."orderNumber" || ' / ' || mi.name) AS reference,
      ('Invalid order item value: price=' || oi.price || ', quantity=' || oi.quantity || ', subtotal=' || oi.subtotal) AS description,
      oi.subtotal::bigint AS amount,
      o.status::text AS status
    FROM "OrderItem" oi
    INNER JOIN "Order" o ON o.id = oi."orderId"
    INNER JOIN "MenuItem" mi ON mi.id = oi."menuItemId"
    WHERE ${orderItemWhere(restaurantId, query)}
      AND (
        oi.subtotal <= 0
        OR oi.price <= 0
        OR oi.quantity <= 0
      )
    ORDER BY o."createdAt" DESC
    LIMIT ${DETAIL_LIMIT};
  `;

  return rows.map(toDetailRow);
}

async function listCancelledOrders(
  db: PrismaClient,
  restaurantId: string,
  query: SalesAnalyticsQuery,
) {
  const rows = await db.$queryRaw<DetailRow[]>`
    SELECT
      o.id AS id,
      o."createdAt" AS date,
      'CANCELLED_ORDER' AS "sourceType",
      ('Order #' || o."orderNumber") AS reference,
      COALESCE(o."cancelReason", 'Cancelled order is excluded from paid sales analytics totals') AS description,
      o.total::bigint AS amount,
      o.status::text AS status
    FROM "Order" o
    WHERE o."restaurantId" = ${restaurantId}
      AND o."createdAt" >= ${query.from}
      AND o."createdAt" <= ${query.to}
      AND o.status = ${OrderStatus.CANCELLED}
    ORDER BY o."createdAt" DESC
    LIMIT ${DETAIL_LIMIT};
  `;

  return rows.map(toDetailRow);
}

function hasScopedAnalyticsFilter(query: SalesAnalyticsQuery) {
  return Boolean(
    query.productId ||
      query.categoryId ||
      query.paymentMethod ||
      query.orderStatus ||
      query.q,
  );
}

function buildIssues(input: {
  ordersWithoutPaidPaymentCount: number;
  paymentTotalMismatchCount: number;
  missingCostSnapshotCount: number;
  zeroRevenueRowCount: number;
  cancelledOrderCount: number;
  hasScopedAnalyticsFilter: boolean;
}): SalesAnalyticsReconciliationIssueDto[] {
  const issues: SalesAnalyticsReconciliationIssueDto[] = [];

  if (input.ordersWithoutPaidPaymentCount > 0) {
    issues.push({
      key: "orders_without_paid_payment",
      title: "Paid lifecycle orders without PAID payment",
      description:
        "Orders included in paid sales analytics exist without a PAID payment record.",
      severity: "critical",
      count: input.ordersWithoutPaidPaymentCount,
    });
  }

  if (input.paymentTotalMismatchCount > 0) {
    issues.push({
      key: "payment_total_mismatch",
      title: "Payment amount mismatch",
      description:
        "Some paid orders have amountPaid values that do not match their order total.",
      severity: "critical",
      count: input.paymentTotalMismatchCount,
    });
  }

  if (input.missingCostSnapshotCount > 0) {
    issues.push({
      key: "missing_cost_snapshots",
      title: "COGS movements missing unit cost snapshot",
      description:
        "Some recipe usage stock movements do not have a usable unitCostSnapshot.",
      severity: "warning",
      count: input.missingCostSnapshotCount,
    });
  }

  if (input.zeroRevenueRowCount > 0) {
    issues.push({
      key: "zero_revenue_rows",
      title: "Invalid or zero-value order items",
      description:
        "Some included order items have zero or negative price, quantity, or subtotal values.",
      severity: "warning",
      count: input.zeroRevenueRowCount,
    });
  }

  if (input.hasScopedAnalyticsFilter) {
    issues.push({
      key: "scoped_cogs_hidden",
      title: "Product-scoped COGS is hidden",
      description:
        "Product/search filtered sales analytics intentionally hides COGS until item-level cost allocation exists.",
      severity: "info",
      count: 1,
    });
  }

  if (input.cancelledOrderCount > 0) {
    issues.push({
      key: "cancelled_orders_excluded",
      title: "Cancelled orders excluded from paid sales analytics",
      description:
        "Cancelled orders exist in this period and are excluded from paid sales totals.",
      severity: "info",
      count: input.cancelledOrderCount,
    });
  }

  return issues;
}

export async function getSalesAnalyticsReconciliation(params: {
  actor: SalesAnalyticsActor;
  businessContext: BusinessContext;
  query: SalesAnalyticsQuery;
}): Promise<SalesAnalyticsReconciliationDto> {
  requireSalesAnalyticsView(params.actor.role);

  const restaurantId = params.businessContext.restaurantId;

  const [
    ordersWithoutPaidPaymentCount,
    paymentTotalMismatchCount,
    missingCostSnapshotCount,
    zeroRevenueRowCount,
    cancelledOrderCount,
    ordersWithoutPaidPayment,
    paymentTotalMismatches,
    missingCostSnapshots,
    zeroRevenueRows,
    cancelledOrdersInPeriod,
  ] = await Promise.all([
    countOrdersWithoutPaidPayment(prisma, restaurantId, params.query),
    countPaymentTotalMismatches(prisma, restaurantId, params.query),
    countMissingCostSnapshots(prisma, restaurantId, params.query),
    countZeroRevenueRows(prisma, restaurantId, params.query),
    countCancelledOrders(prisma, restaurantId, params.query),
    listOrdersWithoutPaidPayment(prisma, restaurantId, params.query),
    listPaymentTotalMismatches(prisma, restaurantId, params.query),
    listMissingCostSnapshots(prisma, restaurantId, params.query),
    listZeroRevenueRows(prisma, restaurantId, params.query),
    listCancelledOrders(prisma, restaurantId, params.query),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    period: {
      from: params.query.from.toISOString(),
      to: params.query.to.toISOString(),
    },
    issues: buildIssues({
      ordersWithoutPaidPaymentCount,
      paymentTotalMismatchCount,
      missingCostSnapshotCount,
      zeroRevenueRowCount,
      cancelledOrderCount,
      hasScopedAnalyticsFilter: hasScopedAnalyticsFilter(params.query),
    }),
    ordersWithoutPaidPayment,
    paymentTotalMismatches,
    missingCostSnapshots,
    zeroRevenueRows,
    cancelledOrdersInPeriod,
  };
}
