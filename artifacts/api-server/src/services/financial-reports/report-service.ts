import type { BusinessContext } from "../../lib/business-context/business-context.types.js";
import { prisma } from "../../lib/prisma.js";
import {
  buildFinancialSummary,
  buildProfitLossLines,
  toBestSellerDto,
  toCashflowReportRow,
  toPeriodDto,
  toReceivableDto,
  toTrendPoint,
  type TrendInput,
} from "./financial-reports.dto.js";
import { requireFinancialReportExport, requireFinancialReportView } from "./financial-reports.permissions.js";
import {
  getBestSellingProducts,
  getCashflowSummary,
  getCashflowTrend,
  getCogsSummary,
  getCogsTrend,
  getFinancialSourceHealth,
  getReceivableSummary,
  getRevenueSummary,
  getRevenueTrend,
  listCashflowRowsForReport,
  listReceivablesForReport,
  type TrendRow,
} from "./repository.js";
import type { FinancialReportActor, FinancialReportDto, FinancialReportExportDto, FinancialReportQuery, FinancialSourceHealthDto } from "./financial-reports.types.js";
import { parseFinancialReportQuery } from "./financial-reports.validation.js";

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

function bucketFor(map: Map<string, TrendInput>, date: Date) {
  const periodStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const key = monthKey(periodStart);
  const existing = map.get(key);
  if (existing) return existing;
  const next = { label: monthLabel(periodStart), periodStart, revenue: 0, cogs: 0, expenses: 0, cashIn: 0, cashOut: 0 };
  map.set(key, next);
  return next;
}

function mergeTrendRows(query: FinancialReportQuery, revenueRows: TrendRow[], cogsRows: TrendRow[], flowRows: TrendRow[]) {
  const map = new Map<string, TrendInput>();
  for (const row of revenueRows) bucketFor(map, row.period).revenue = row.revenue ?? 0;
  for (const row of cogsRows) bucketFor(map, row.period).cogs = row.cogs ?? 0;
  for (const row of flowRows) {
    const bucket = bucketFor(map, row.period);
    bucket.cashIn = row.cashIn ?? 0;
    bucket.cashOut = row.cashOut ?? 0;
    bucket.expenses = row.expenses ?? 0;
  }

  return Array.from(map.values())
    .sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime())
    .map((bucket) => {
      if (query.basis === "cashflow") return toTrendPoint({ ...bucket, revenue: bucket.cashIn, cogs: 0, expenses: bucket.cashOut });
      if (query.basis === "orders") return toTrendPoint({ ...bucket, expenses: 0, cashIn: 0, cashOut: 0 });
      return toTrendPoint(bucket);
    });
}

function buildWarnings(
  health: Omit<FinancialSourceHealthDto, "warnings">,
  receivables: number,
) {
  const warnings: string[] = [];
  if (health.paidOrders > 0 && health.cashflowEntries === 0) warnings.push("Paid orders exist without ledger entries.");
  if (health.ordersWithoutCashflow > 0) warnings.push("Some paid orders are not synced into cashflow.");
  if (health.stockMovementsMissingCostSnapshot > 0) warnings.push("Some COGS movements are missing cost snapshots.");
  if (health.pendingCashflowEntries > 0) warnings.push("Pending cashflow entries are excluded from posted totals.");
  if (health.voidedCashflowEntries > 0) warnings.push("Voided cashflow entries exist in this period.");
  if (receivables > 0) warnings.push("Open invoice receivables exist in this period.");
  return warnings;
}

export function parseFinancialReportRequest(rawQuery: Record<string, unknown>) {
  return parseFinancialReportQuery(rawQuery);
}

export async function getFinancialReport(params: { actor: FinancialReportActor; businessContext: BusinessContext; query: FinancialReportQuery }): Promise<FinancialReportDto> {
  requireFinancialReportView(params.actor.role);
  const restaurantId = params.businessContext.restaurantId;
  const [revenue, flow, cogs, receivable, revenueTrend, cogsTrend, flowTrend, bestSellers, cashInRows, cashOutRows, receivables, healthBase] = await Promise.all([
    getRevenueSummary(prisma, restaurantId, params.query),
    getCashflowSummary(prisma, restaurantId, params.query),
    getCogsSummary(prisma, restaurantId, params.query),
    getReceivableSummary(prisma, restaurantId, params.query),
    getRevenueTrend(prisma, restaurantId, params.query),
    getCogsTrend(prisma, restaurantId, params.query),
    getCashflowTrend(prisma, restaurantId, params.query),
    getBestSellingProducts(prisma, restaurantId, params.query),
    listCashflowRowsForReport(prisma, restaurantId, params.query, "in"),
    listCashflowRowsForReport(prisma, restaurantId, params.query, "out"),
    listReceivablesForReport(prisma, restaurantId, params.query),
    getFinancialSourceHealth(prisma, restaurantId, params.query),
  ]);
  const totalRevenue = params.query.basis === "cashflow" ? flow.cashIn : revenue.totalRevenue;
  const reportCogs = params.query.basis === "cashflow" ? 0 : cogs.cogs;
  const totalExpenses = params.query.basis === "orders" ? 0 : flow.cashOut;
  const cashIn = params.query.basis === "orders" ? 0 : flow.cashIn;
  const cashOut = params.query.basis === "orders" ? 0 : flow.cashOut;
  const summary = buildFinancialSummary({ totalRevenue, cogs: reportCogs, totalExpenses, receivables: receivable.receivables, cashIn, cashOut, orderCount: revenue.orderCount });
  const sourceHealth = {
    ...healthBase,
    warnings: buildWarnings(healthBase, receivable.receivables),
  };
  return {
    period: toPeriodDto(params.query.from, params.query.to),
    basis: params.query.basis,
    generatedAt: new Date().toISOString(),
    summary,
    profitLoss: buildProfitLossLines(summary),
    trend: mergeTrendRows(params.query, revenueTrend, cogsTrend, flowTrend),
    bestSellingProducts: bestSellers.map(toBestSellerDto),
    cashIn: params.query.basis === "orders" ? [] : cashInRows.map(toCashflowReportRow),
    cashOut: params.query.basis === "orders" ? [] : cashOutRows.map(toCashflowReportRow),
    receivables: receivables.map(toReceivableDto),
    sourceHealth,
  };
}

export async function exportFinancialReport(params: { actor: FinancialReportActor; businessContext: BusinessContext; query: FinancialReportQuery }): Promise<FinancialReportExportDto> {
  requireFinancialReportExport(params.actor.role);
  const report = await getFinancialReport(params);
  return { exportedAt: new Date().toISOString(), format: "json", report };
}
