import { AuditAction } from "@prisma/client";

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
import {
  requireSalesAnalyticsExport,
  requireSalesAnalyticsView,
} from "./sales-analytics.permissions.js";
import {
  getCogsByOrderIds,
  getSalesBestSellingProducts,
  getSalesBusyHours,
  getSalesCogsSummary,
  getSalesDailyTrend,
  getSalesRevenueSummary,
  getSalesSourceHealth,
  listSalesAnalyticsFilterOptions,
  listSalesTransactionRows,
} from "./repository.js";
import type {
  SalesAnalyticsActor,
  SalesAnalyticsDto,
  SalesAnalyticsExportFileDto,
  SalesAnalyticsExportFormat,
  SalesAnalyticsFilterOptionsDto,
  SalesAnalyticsQuery,
} from "./sales-analytics.types.js";
import {
  parseSalesAnalyticsExportFormat,
  parseSalesAnalyticsQuery,
} from "./sales-analytics.validation.js";

type CsvCell = string | number | boolean | null | undefined;

type SalesAnalyticsExportRequest = {
  query: SalesAnalyticsQuery;
  format: SalesAnalyticsExportFormat;
};

export function parseSalesAnalyticsRequest(rawQuery: Record<string, unknown>) {
  return parseSalesAnalyticsQuery(rawQuery);
}

export function parseSalesAnalyticsExportRequest(
  rawQuery: Record<string, unknown>,
): SalesAnalyticsExportRequest {
  return {
    query: parseSalesAnalyticsQuery(rawQuery),
    format: parseSalesAnalyticsExportFormat(rawQuery.format),
  };
}

function hasScopedCogsFilter(query: SalesAnalyticsQuery) {
  return Boolean(
    query.productId ||
      query.categoryId ||
      query.paymentMethod ||
      query.orderStatus ||
      query.q,
  );
}

function toDateLabel(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildSalesAnalyticsExportFilename(params: {
  query: SalesAnalyticsQuery;
  format: SalesAnalyticsExportFormat;
}) {
  const from = toDateLabel(params.query.from);
  const to = toDateLabel(params.query.to);

  return `sales-analytics-${from}-${to}-${params.query.basis}.${params.format}`;
}

function getExportContentType(format: SalesAnalyticsExportFormat) {
  if (format === "csv") return "text/csv;charset=utf-8";

  return "application/json";
}

function serializeQuery(query: SalesAnalyticsQuery) {
  return {
    from: query.from.toISOString(),
    to: query.to.toISOString(),
    basis: query.basis,
    productId: query.productId ?? null,
    categoryId: query.categoryId ?? null,
    paymentMethod: query.paymentMethod ?? null,
    orderStatus: query.orderStatus ?? null,
    q: query.q ?? null,
    limit: query.limit,
  };
}

function buildSalesAnalyticsExportEntityId(params: {
  query: SalesAnalyticsQuery;
  format: SalesAnalyticsExportFormat;
}) {
  const from = toDateLabel(params.query.from);
  const to = toDateLabel(params.query.to);

  return `EXPORT:${from}:${to}:${params.query.basis}:${params.format}`;
}

async function logSalesAnalyticsExport(params: {
  actor: SalesAnalyticsActor;
  businessContext: BusinessContext;
  query: SalesAnalyticsQuery;
  format: SalesAnalyticsExportFormat;
  filename: string;
  contentType: string;
}) {
  await prisma.auditLog.create({
    data: {
      restaurantId: params.businessContext.restaurantId,
      userId: params.actor.id,
      action: AuditAction.CREATE,
      entityType: "SalesAnalyticsExport",
      entityId: buildSalesAnalyticsExportEntityId({
        query: params.query,
        format: params.format,
      }),
      changes: {
        query: serializeQuery(params.query),
        format: params.format,
        filename: params.filename,
        contentType: params.contentType,
      },
    },
  });
}

function escapeCsvCell(cell: CsvCell) {
  if (cell === null || cell === undefined) return "";

  const value = String(cell);
  if (!/[",\n\r]/.test(value)) return value;

  return `"${value.replaceAll('"', '""')}"`;
}

function toCsvRow(cells: CsvCell[]) {
  return cells.map(escapeCsvCell).join(",");
}

function appendCsvSection(params: {
  lines: string[];
  title: string;
  headers: string[];
  rows: CsvCell[][];
}) {
  if (params.lines.length > 0) params.lines.push("");

  params.lines.push(params.title);
  params.lines.push(toCsvRow(params.headers));

  for (const row of params.rows) {
    params.lines.push(toCsvRow(row));
  }
}

function buildSalesAnalyticsCsv(report: SalesAnalyticsDto) {
  const lines: string[] = [];

  appendCsvSection({
    lines,
    title: "Report Metadata",
    headers: ["Field", "Value"],
    rows: [
      ["Generated At", report.generatedAt],
      ["Period From", report.period.from],
      ["Period To", report.period.to],
      ["Period Label", report.period.label],
      ["Basis", report.basis],
    ],
  });

  appendCsvSection({
    lines,
    title: "Summary",
    headers: ["Metric", "Value"],
    rows: [
      ["Gross Revenue", report.summary.grossRevenue],
      ["Total Discount", report.summary.totalDiscount],
      ["Total Revenue", report.summary.totalRevenue],
      ["COGS", report.summary.cogs],
      ["Gross Profit", report.summary.grossProfit],
      ["Margin", report.summary.margin],
      ["Net Profit", report.summary.netProfit],
      ["Quantity", report.summary.quantity],
      ["Transaction Count", report.summary.transactionCount],
      ["Order Count", report.summary.orderCount],
      ["Average Order Value", report.summary.averageOrderValue],
      ["Receivables", report.summary.receivables],
    ],
  });

  appendCsvSection({
    lines,
    title: "Sales Rows",
    headers: [
      "Order ID",
      "Order Number",
      "Date",
      "Menu Item ID",
      "Product",
      "Category",
      "Quantity",
      "Selling Price",
      "Gross Revenue",
      "Discount",
      "Total Revenue",
      "COGS",
      "Gross Profit",
      "Margin",
      "Payment Method",
      "Payment Status",
      "Order Status",
    ],
    rows: report.rows.map((row) => [
      row.orderId,
      row.orderNumber,
      row.date,
      row.menuItemId,
      row.productName,
      row.categoryName,
      row.quantity,
      row.sellingPrice,
      row.grossRevenue,
      row.discount,
      row.totalRevenue,
      row.cogs,
      row.grossProfit,
      row.margin,
      row.paymentMethod,
      row.paymentStatus,
      row.orderStatus,
    ]),
  });

  appendCsvSection({
    lines,
    title: "Daily Trend",
    headers: ["Label", "Value", "Revenue", "Quantity"],
    rows: report.dailyTrend.map((item) => [
      item.label,
      item.value,
      item.revenue,
      item.quantity,
    ]),
  });

  appendCsvSection({
    lines,
    title: "Busy Hours",
    headers: ["Label", "Value", "Revenue", "Quantity"],
    rows: report.busyHours.map((item) => [
      item.label,
      item.value,
      item.revenue,
      item.quantity,
    ]),
  });

  appendCsvSection({
    lines,
    title: "Best Selling Products",
    headers: ["Label", "Value", "Revenue", "Quantity"],
    rows: report.bestSellingProducts.map((item) => [
      item.label,
      item.value,
      item.revenue,
      item.quantity,
    ]),
  });

  appendCsvSection({
    lines,
    title: "Source Health",
    headers: ["Metric", "Value"],
    rows: [
      ["Paid Orders", report.sourceHealth.paidOrders],
      ["Order Items", report.sourceHealth.orderItems],
      ["Paid Payments", report.sourceHealth.paidPayments],
      ["Stock Movements", report.sourceHealth.stockMovements],
      ["Orders Without Payment", report.sourceHealth.ordersWithoutPayment],
      [
        "Stock Movements Missing Cost Snapshot",
        report.sourceHealth.stockMovementsMissingCostSnapshot,
      ],
    ],
  });

  appendCsvSection({
    lines,
    title: "Source Health Warnings",
    headers: ["Warning"],
    rows:
      report.sourceHealth.warnings.length > 0
        ? report.sourceHealth.warnings.map((warning) => [warning])
        : [["No warnings"]],
  });

  return `${lines.join("\n")}\n`;
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
  const scopedCogsFilter = hasScopedCogsFilter(params.query);
  const sourceHealthDto = toSalesAnalyticsSourceHealthDto(sourceHealth);

  if (scopedCogsFilter) {
    sourceHealthDto.warnings.push(
      "COGS is hidden for scoped sales analytics filters until item-level cost allocation is implemented.",
    );
  }

  return {
    period: toSalesAnalyticsPeriodDto(params.query.from, params.query.to),
    basis: params.query.basis,
    generatedAt: new Date().toISOString(),
    summary: toSalesAnalyticsSummaryDto({
      revenue,
      cogs: scopedCogsFilter ? 0 : Number(cogs?.cogs ?? 0),
    }),
    rows: rows.map((row) =>
      toSalesTransactionDto(
        row,
        scopedCogsFilter ? 0 : (cogsByOrder.get(row.orderId) ?? 0),
      ),
    ),
    dailyTrend: dailyTrend.map(toSalesAnalyticsDataPoint),
    busyHours: busyHours.map(toSalesAnalyticsDataPoint),
    bestSellingProducts: bestSellingProducts.map(toBestSellerPoint),
    sourceHealth: sourceHealthDto,
  };
}


export async function getSalesAnalyticsFilterOptions(params: {
  actor: SalesAnalyticsActor;
  businessContext: BusinessContext;
}): Promise<SalesAnalyticsFilterOptionsDto> {
  requireSalesAnalyticsView(params.actor.role);

  return listSalesAnalyticsFilterOptions(
    prisma,
    params.businessContext.restaurantId,
  );
}

export async function exportSalesAnalytics(params: {
  actor: SalesAnalyticsActor;
  businessContext: BusinessContext;
  query: SalesAnalyticsQuery;
  format: SalesAnalyticsExportFormat;
}): Promise<SalesAnalyticsExportFileDto> {
  requireSalesAnalyticsExport(params.actor.role);

  const report = await getSalesAnalytics(params);
  const filename = buildSalesAnalyticsExportFilename({
    query: params.query,
    format: params.format,
  });
  const contentType = getExportContentType(params.format);

  await logSalesAnalyticsExport({
    actor: params.actor,
    businessContext: params.businessContext,
    query: params.query,
    format: params.format,
    filename,
    contentType,
  });

  if (params.format === "csv") {
    return {
      exportedAt: new Date().toISOString(),
      format: params.format,
      filename,
      contentType,
      auditLogged: true,
      content: buildSalesAnalyticsCsv(report),
    };
  }

  return {
    exportedAt: new Date().toISOString(),
    format: params.format,
    filename,
    contentType,
    auditLogged: true,
    report,
  };
}
