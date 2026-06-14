import { Prisma } from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/business-context.types.js";
import { prisma } from "../../lib/prisma.js";
import { requireCashflowSync } from "./cashflow.permissions.js";
import type { CashflowActor } from "./cashflow.types.js";

const DEFAULT_SYNC_SOURCE_LIMIT = 12;
const MAX_SYNC_SOURCE_LIMIT = 50;

type UnsyncedOrderRow = {
  id: string;
  orderNumber: number;
  total: number;
  paymentMethod: string;
  status: string;
  paymentStatus: string | null;
  paidAt: Date | null;
  createdAt: Date;
};

type UnsyncedShiftRow = {
  id: string;
  cashierName: string | null;
  openedAt: Date;
  closedAt: Date | null;
  expectedCash: number;
  closingCash: number | null;
  cashDifference: number | null;
};

export type CashflowSyncOrderSourceDto = {
  id: string;
  orderNumber: number;
  total: number;
  paymentMethod: string;
  status: string;
  paymentStatus: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type CashflowSyncShiftSourceDto = {
  id: string;
  cashierName: string | null;
  openedAt: string;
  closedAt: string | null;
  expectedCash: number;
  closingCash: number | null;
  cashDifference: number | null;
};

export type CashflowSyncSourcesDto = {
  generatedAt: string;
  limit: number;
  unsyncedOrders: CashflowSyncOrderSourceDto[];
  unsyncedShifts: CashflowSyncShiftSourceDto[];
};

function normalizeLimit(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_SYNC_SOURCE_LIMIT;
  return Math.min(Math.floor(parsed), MAX_SYNC_SOURCE_LIMIT);
}

function toOrderSourceDto(row: UnsyncedOrderRow): CashflowSyncOrderSourceDto {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    total: row.total,
    paymentMethod: row.paymentMethod,
    status: row.status,
    paymentStatus: row.paymentStatus,
    paidAt: row.paidAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function toShiftSourceDto(row: UnsyncedShiftRow): CashflowSyncShiftSourceDto {
  return {
    id: row.id,
    cashierName: row.cashierName,
    openedAt: row.openedAt.toISOString(),
    closedAt: row.closedAt?.toISOString() ?? null,
    expectedCash: row.expectedCash,
    closingCash: row.closingCash,
    cashDifference: row.cashDifference,
  };
}

export async function getCashflowSyncSources(params: {
  actor: CashflowActor;
  businessContext: BusinessContext;
  limit?: unknown;
}): Promise<CashflowSyncSourcesDto> {
  requireCashflowSync(params.actor.role);

  const businessId = params.businessContext.businessId;
  const limit = normalizeLimit(params.limit);

  const [unsyncedOrders, unsyncedShifts] = await Promise.all([
    prisma.$queryRaw<UnsyncedOrderRow[]>(Prisma.sql`
      SELECT
        o."id",
        o."orderNumber",
        o."total",
        o."paymentMethod",
        o."status"::text AS "status",
        p."status"::text AS "paymentStatus",
        p."paidAt",
        o."createdAt"
      FROM "Order" o
      LEFT JOIN "Payment" p ON p."orderId" = o."id"
      WHERE o."businessId" = ${businessId}
        AND o."status"::text NOT IN ('PENDING_PAYMENT', 'CANCELLED')
        AND (p."id" IS NULL OR p."status"::text = 'PAID')
        AND NOT EXISTS (
          SELECT 1
          FROM "CashflowEntry" c
          WHERE c."businessId" = o."businessId"
            AND c."sourceType"::text = 'ORDER_PAYMENT'
            AND c."sourceId" = o."id"
            AND c."status"::text != 'VOIDED'
        )
      ORDER BY COALESCE(p."paidAt", o."createdAt") DESC
      LIMIT ${limit}
    `),
    prisma.$queryRaw<UnsyncedShiftRow[]>(Prisma.sql`
      SELECT
        s."id",
        u."name" AS "cashierName",
        s."openedAt",
        s."closedAt",
        s."expectedCash",
        s."closingCash",
        s."cashDifference"
      FROM "Shift" s
      LEFT JOIN "User" u ON u."id" = s."userId"
      WHERE s."businessId" = ${businessId}
        AND s."status"::text = 'CLOSED'
        AND s."closedAt" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM "CashflowEntry" c
          WHERE c."businessId" = s."businessId"
            AND c."sourceType"::text = 'SHIFT_CLOSE'
            AND c."sourceId" = s."id"
            AND c."status"::text != 'VOIDED'
        )
      ORDER BY s."closedAt" DESC
      LIMIT ${limit}
    `),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    limit,
    unsyncedOrders: unsyncedOrders.map(toOrderSourceDto),
    unsyncedShifts: unsyncedShifts.map(toShiftSourceDto),
  };
}
