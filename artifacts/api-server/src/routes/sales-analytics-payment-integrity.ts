import { OrderStatus, PaymentStatus, Prisma, type Role } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { ALL_ROLES } from "../lib/constants.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { successResponse } from "../lib/responses/success-response.js";
import {
  parseSalesAnalyticsRequest,
  type SalesAnalyticsQuery,
} from "../services/sales-analytics/index.js";

const router = Router();

const PAID_ORDER_STATUSES = [
  OrderStatus.PAID,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.SERVED,
  OrderStatus.COMPLETED,
] as const;

const PAYMENT_INTEGRITY_ISSUES = [
  "orders_without_paid_payment",
  "payment_total_mismatch",
  "all",
] as const;

type PaymentIntegrityIssue = (typeof PAYMENT_INTEGRITY_ISSUES)[number];

type PaymentIntegrityRow = {
  id: string;
  issueType: "orders_without_paid_payment" | "payment_total_mismatch";
  severity: "critical";
  orderId: string;
  orderNumber: number;
  orderDate: Date;
  orderStatus: string;
  paymentMethod: string;
  orderTotal: bigint | number | string | null;
  amountPaid: bigint | number | string | null;
  difference: bigint | number | string | null;
  paymentId: string | null;
  paymentStatus: string | null;
  paymentProvider: string | null;
  paidAt: Date | null;
  recommendedAction: string;
};

type CountRow = {
  issueType: "orders_without_paid_payment" | "payment_total_mismatch";
  count: bigint | number | string | null;
  totalValue: bigint | number | string | null;
};

function toNumber(value: bigint | number | string | null | undefined) {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;

  return 0;
}

function escapeCsv(value: unknown) {
  const normalized = value === null || value === undefined ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

function getIssueFilter(value: unknown): PaymentIntegrityIssue {
  if (typeof value !== "string") return "all";
  if (PAYMENT_INTEGRITY_ISSUES.includes(value as PaymentIntegrityIssue)) {
    return value as PaymentIntegrityIssue;
  }

  return "all";
}

function getLimit(value: unknown, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;

  return Math.min(Math.floor(parsed), max);
}

function buildScopedOrderFilters(query: SalesAnalyticsQuery) {
  const filters: Prisma.Sql[] = [];

  if (query.paymentMethod) {
    filters.push(Prisma.sql`o."paymentMethod" = ${query.paymentMethod}`);
  }

  if (query.orderStatus) {
    filters.push(Prisma.sql`o.status = ${query.orderStatus}`);
  }

  if (query.productId || query.categoryId || query.q) {
    const itemFilters: Prisma.Sql[] = [Prisma.sql`oi."orderId" = o.id`];

    if (query.productId) {
      itemFilters.push(Prisma.sql`oi."menuItemId" = ${query.productId}`);
    }

    if (query.categoryId) {
      itemFilters.push(Prisma.sql`mi."categoryId" = ${query.categoryId}`);
    }

    if (query.q) {
      itemFilters.push(
        Prisma.sql`(
          mi.name ILIKE ${`%${query.q}%`}
          OR CAST(o."orderNumber" AS TEXT) ILIKE ${`%${query.q}%`}
        )`,
      );
    }

    filters.push(Prisma.sql`
      EXISTS (
        SELECT 1
        FROM "OrderItem" oi
        INNER JOIN "MenuItem" mi ON mi.id = oi."menuItemId"
        WHERE ${Prisma.join(itemFilters, " AND ")}
      )
    `);
  }

  return filters;
}

function buildBaseWhere(restaurantId: string, query: SalesAnalyticsQuery) {
  const filters = [
    Prisma.sql`o."restaurantId" = ${restaurantId}`,
    Prisma.sql`o."createdAt" >= ${query.from}`,
    Prisma.sql`o."createdAt" <= ${query.to}`,
    Prisma.sql`o.status IN (${Prisma.join(PAID_ORDER_STATUSES)})`,
    ...buildScopedOrderFilters(query),
  ];

  return Prisma.sql`${Prisma.join(filters, " AND ")}`;
}

function rowToDto(row: PaymentIntegrityRow) {
  return {
    id: row.id,
    issueType: row.issueType,
    severity: row.severity,
    orderId: row.orderId,
    orderNumber: row.orderNumber,
    orderDate: row.orderDate.toISOString(),
    orderStatus: row.orderStatus,
    paymentMethod: row.paymentMethod,
    orderTotal: toNumber(row.orderTotal),
    amountPaid: toNumber(row.amountPaid),
    difference: toNumber(row.difference),
    paymentId: row.paymentId,
    paymentStatus: row.paymentStatus,
    paymentProvider: row.paymentProvider,
    paidAt: row.paidAt?.toISOString() ?? null,
    recommendedAction: row.recommendedAction,
  };
}

function countToDto(row: CountRow) {
  return {
    issueType: row.issueType,
    count: toNumber(row.count),
    totalValue: toNumber(row.totalValue),
  };
}

async function listPaymentIntegrityRows(params: {
  restaurantId: string;
  query: SalesAnalyticsQuery;
  issue: PaymentIntegrityIssue;
  limit: number;
}) {
  const baseWhere = buildBaseWhere(params.restaurantId, params.query);
  const issueFilters: Prisma.Sql[] = [];

  if (params.issue === "orders_without_paid_payment") {
    issueFilters.push(Prisma.sql`issue_type = 'orders_without_paid_payment'`);
  }

  if (params.issue === "payment_total_mismatch") {
    issueFilters.push(Prisma.sql`issue_type = 'payment_total_mismatch'`);
  }

  const issueWhere =
    issueFilters.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(issueFilters, " AND ")}`
      : Prisma.empty;

  const rows = await prisma.$queryRaw<PaymentIntegrityRow[]>`
    WITH integrity_rows AS (
      SELECT
        o.id AS id,
        'orders_without_paid_payment' AS "issueType",
        'critical' AS severity,
        o.id AS "orderId",
        o."orderNumber" AS "orderNumber",
        o."createdAt" AS "orderDate",
        o.status::text AS "orderStatus",
        o."paymentMethod" AS "paymentMethod",
        o.total AS "orderTotal",
        o."amountPaid" AS "amountPaid",
        o."amountPaid" - o.total AS difference,
        NULL::text AS "paymentId",
        NULL::text AS "paymentStatus",
        NULL::text AS "paymentProvider",
        NULL::timestamp AS "paidAt",
        'Create or reconcile a PAID payment record before trusting this order in sales analytics.' AS "recommendedAction",
        'orders_without_paid_payment' AS issue_type
      FROM "Order" o
      LEFT JOIN "Payment" p
        ON p."orderId" = o.id
        AND p.status = ${PaymentStatus.PAID}
      WHERE ${baseWhere}
        AND p.id IS NULL

      UNION ALL

      SELECT
        o.id AS id,
        'payment_total_mismatch' AS "issueType",
        'critical' AS severity,
        o.id AS "orderId",
        o."orderNumber" AS "orderNumber",
        o."createdAt" AS "orderDate",
        o.status::text AS "orderStatus",
        o."paymentMethod" AS "paymentMethod",
        o.total AS "orderTotal",
        o."amountPaid" AS "amountPaid",
        o."amountPaid" - o.total AS difference,
        p.id AS "paymentId",
        p.status::text AS "paymentStatus",
        p.provider AS "paymentProvider",
        p."paidAt" AS "paidAt",
        'Review order amountPaid against total and reconcile the payment/order source before reporting revenue.' AS "recommendedAction",
        'payment_total_mismatch' AS issue_type
      FROM "Order" o
      INNER JOIN "Payment" p
        ON p."orderId" = o.id
        AND p.status = ${PaymentStatus.PAID}
      WHERE ${baseWhere}
        AND o."amountPaid" <> o.total
    )
    SELECT *
    FROM integrity_rows
    ${issueWhere}
    ORDER BY "orderDate" DESC
    LIMIT ${params.limit};
  `;

  return rows.map(rowToDto);
}

async function summarizePaymentIntegrity(params: {
  restaurantId: string;
  query: SalesAnalyticsQuery;
}) {
  const baseWhere = buildBaseWhere(params.restaurantId, params.query);

  const rows = await prisma.$queryRaw<CountRow[]>`
    WITH integrity_rows AS (
      SELECT
        'orders_without_paid_payment' AS "issueType",
        o.total AS value
      FROM "Order" o
      LEFT JOIN "Payment" p
        ON p."orderId" = o.id
        AND p.status = ${PaymentStatus.PAID}
      WHERE ${baseWhere}
        AND p.id IS NULL

      UNION ALL

      SELECT
        'payment_total_mismatch' AS "issueType",
        ABS(o."amountPaid" - o.total) AS value
      FROM "Order" o
      INNER JOIN "Payment" p
        ON p."orderId" = o.id
        AND p.status = ${PaymentStatus.PAID}
      WHERE ${baseWhere}
        AND o."amountPaid" <> o.total
    )
    SELECT
      "issueType",
      COUNT(*)::int AS count,
      COALESCE(SUM(value), 0)::bigint AS "totalValue"
    FROM integrity_rows
    GROUP BY "issueType";
  `;

  const buckets = rows.map(countToDto);
  const totalIssues = buckets.reduce((total, bucket) => total + bucket.count, 0);
  const totalValueAtRisk = buckets.reduce((total, bucket) => total + bucket.totalValue, 0);

  return {
    totalIssues,
    totalValueAtRisk,
    buckets,
  };
}

function buildCsv(rows: ReturnType<typeof rowToDto>[]) {
  const header = [
    "Issue Type",
    "Order ID",
    "Order Number",
    "Order Date",
    "Order Status",
    "Payment Method",
    "Order Total",
    "Amount Paid",
    "Difference",
    "Payment ID",
    "Payment Status",
    "Payment Provider",
    "Paid At",
    "Recommended Action",
  ];

  const body = rows.map((row) =>
    [
      row.issueType,
      row.orderId,
      row.orderNumber,
      row.orderDate,
      row.orderStatus,
      row.paymentMethod,
      row.orderTotal,
      row.amountPaid,
      row.difference,
      row.paymentId,
      row.paymentStatus,
      row.paymentProvider,
      row.paidAt,
      row.recommendedAction,
    ]
      .map(escapeCsv)
      .join(","),
  );

  return [header.map(escapeCsv).join(","), ...body].join("\n");
}

function getExportFormat(value: unknown) {
  return value === "json" ? "json" : "csv";
}

function getQuery(query: unknown) {
  return parseSalesAnalyticsRequest(query as Record<string, unknown>);
}

function getActor(user: { id: string; role: Role }) {
  return {
    id: user.id,
    role: user.role,
  };
}

router.get("/sales-analytics/payment-integrity", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const query = getQuery(req.query);
    const issue = getIssueFilter(req.query.issue);
    const limit = getLimit(req.query.limit, 100, 500);
    const actor = getActor(user);
    void actor;

    const [summary, rows] = await Promise.all([
      summarizePaymentIntegrity({ restaurantId: businessContext.restaurantId, query }),
      listPaymentIntegrityRows({
        restaurantId: businessContext.restaurantId,
        query,
        issue,
        limit,
      }),
    ]);

    res.setHeader("Cache-Control", "no-store");
    return successResponse(res, {
      data: {
        generatedAt: new Date().toISOString(),
        period: {
          from: query.from.toISOString(),
          to: query.to.toISOString(),
        },
        issue,
        limit,
        summary,
        rows,
      },
      message: "Sales payment integrity workbench retrieved.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/sales-analytics/payment-integrity/export", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const query = getQuery(req.query);
    const issue = getIssueFilter(req.query.issue);
    const format = getExportFormat(req.query.format);
    const limit = getLimit(req.query.limit, 5000, 5000);

    const rows = await listPaymentIntegrityRows({
      restaurantId: businessContext.restaurantId,
      query,
      issue,
      limit,
    });

    const exportedAt = new Date().toISOString();
    const filename = `sales-payment-integrity-${issue}-${exportedAt.slice(0, 10)}.${format}`;
    const contentType = format === "json" ? "application/json" : "text/csv";

    const data =
      format === "json"
        ? {
            exportedAt,
            format,
            filename,
            contentType,
            rows,
            meta: {
              issue,
              rowCount: rows.length,
              period: {
                from: query.from.toISOString(),
                to: query.to.toISOString(),
              },
            },
          }
        : {
            exportedAt,
            format,
            filename,
            contentType,
            content: buildCsv(rows),
            meta: {
              issue,
              rowCount: rows.length,
              period: {
                from: query.from.toISOString(),
                to: query.to.toISOString(),
              },
            },
          };

    res.setHeader("Cache-Control", "no-store");
    return successResponse(res, {
      data,
      message: "Sales payment integrity export prepared.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
