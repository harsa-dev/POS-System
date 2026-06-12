import { Prisma, type PrismaClient } from "@prisma/client";

import type {
  CashflowAccount,
  CashflowEntryRecord,
  CashflowEntryStatus,
  CashflowEntryType,
  CashflowQuery,
  CashflowSourceType,
} from "./cashflow.types.js";

type CashflowDb = PrismaClient | Prisma.TransactionClient;

export type CreateCashflowEntryRecord = {
  id: string;
  businessId: string | null;
  restaurantId: string;
  sourceType: CashflowSourceType;
  sourceId?: string | null;
  idempotencyKey?: string | null;
  account: CashflowAccount;
  type: CashflowEntryType;
  status: CashflowEntryStatus;
  category: string;
  counterpartyName?: string | null;
  description?: string | null;
  amount: number;
  occurredAt: Date;
  postedAt?: Date | null;
  createdById?: string | null;
  metadata?: unknown;
};

type CountRow = { count: number };

type SummaryRow = {
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  pendingAmount: number;
  postedCount: number;
  voidedCount: number;
};

export type TrendRow = {
  period: Date;
  income: number;
  expense: number;
  balance: number;
};

export type CategorySummaryRow = {
  category: string;
  amount: number;
  count: number;
};

function getWhereSql(restaurantId: string, query: CashflowQuery) {
  const where: Prisma.Sql[] = [Prisma.sql`"restaurantId" = ${restaurantId}`];

  if (query.from) where.push(Prisma.sql`"occurredAt" >= ${query.from}`);
  if (query.to) where.push(Prisma.sql`"occurredAt" <= ${query.to}`);
  if (query.account) where.push(Prisma.sql`"account" = CAST(${query.account} AS "CashflowAccount")`);
  if (query.type) where.push(Prisma.sql`"type" = CAST(${query.type} AS "CashflowEntryType")`);
  if (query.status) where.push(Prisma.sql`"status" = CAST(${query.status} AS "CashflowEntryStatus")`);
  if (query.sourceType) where.push(Prisma.sql`"sourceType" = CAST(${query.sourceType} AS "CashflowSourceType")`);
  if (query.search) {
    const search = `%${query.search}%`;
    where.push(Prisma.sql`(
      "category" ILIKE ${search}
      OR "counterpartyName" ILIKE ${search}
      OR "description" ILIKE ${search}
      OR "sourceId" ILIKE ${search}
    )`);
  }

  return Prisma.sql`WHERE ${Prisma.join(where, " AND ")}`;
}

export async function createCashflowEntryRecord(
  db: CashflowDb,
  data: CreateCashflowEntryRecord
) {
  const metadata = data.metadata === undefined ? null : JSON.stringify(data.metadata);

  const rows = await db.$queryRaw<CashflowEntryRecord[]>`
    INSERT INTO "CashflowEntry" (
      "id",
      "businessId",
      "restaurantId",
      "sourceType",
      "sourceId",
      "idempotencyKey",
      "account",
      "type",
      "status",
      "category",
      "counterpartyName",
      "description",
      "amount",
      "occurredAt",
      "postedAt",
      "createdById",
      "metadata"
    ) VALUES (
      ${data.id},
      ${data.businessId},
      ${data.restaurantId},
      CAST(${data.sourceType} AS "CashflowSourceType"),
      ${data.sourceId ?? null},
      ${data.idempotencyKey ?? null},
      CAST(${data.account} AS "CashflowAccount"),
      CAST(${data.type} AS "CashflowEntryType"),
      CAST(${data.status} AS "CashflowEntryStatus"),
      ${data.category},
      ${data.counterpartyName ?? null},
      ${data.description ?? null},
      ${data.amount},
      ${data.occurredAt},
      ${data.postedAt ?? null},
      ${data.createdById ?? null},
      CAST(${metadata} AS jsonb)
    )
    ON CONFLICT ("restaurantId", "idempotencyKey") DO NOTHING
    RETURNING *;
  `;

  return rows[0] ?? null;
}

export async function findCashflowEntryById(
  db: CashflowDb,
  restaurantId: string,
  id: string
) {
  const rows = await db.$queryRaw<CashflowEntryRecord[]>`
    SELECT * FROM "CashflowEntry"
    WHERE "restaurantId" = ${restaurantId} AND "id" = ${id}
    LIMIT 1;
  `;

  return rows[0] ?? null;
}

export async function findCashflowEntryByIdempotencyKey(
  db: CashflowDb,
  restaurantId: string,
  idempotencyKey: string
) {
  const rows = await db.$queryRaw<CashflowEntryRecord[]>`
    SELECT * FROM "CashflowEntry"
    WHERE "restaurantId" = ${restaurantId} AND "idempotencyKey" = ${idempotencyKey}
    LIMIT 1;
  `;

  return rows[0] ?? null;
}

export async function listCashflowEntryRecords(
  db: CashflowDb,
  restaurantId: string,
  query: CashflowQuery
) {
  const offset = (query.page - 1) * query.limit;
  const whereSql = getWhereSql(restaurantId, query);

  return db.$queryRaw<CashflowEntryRecord[]>`
    SELECT * FROM "CashflowEntry"
    ${whereSql}
    ORDER BY "occurredAt" DESC, "createdAt" DESC
    LIMIT ${query.limit}
    OFFSET ${offset};
  `;
}

export async function countCashflowEntryRecords(
  db: CashflowDb,
  restaurantId: string,
  query: CashflowQuery
) {
  const whereSql = getWhereSql(restaurantId, query);
  const rows = await db.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::int AS "count"
    FROM "CashflowEntry"
    ${whereSql};
  `;

  return rows[0]?.count ?? 0;
}

export async function getCashflowSummary(
  db: CashflowDb,
  restaurantId: string,
  query: CashflowQuery
): Promise<SummaryRow> {
  const whereSql = getWhereSql(restaurantId, {
    ...query,
    page: 1,
    limit: 1,
    status: undefined,
  });

  const rows = await db.$queryRaw<SummaryRow[]>`
    SELECT
      COALESCE(SUM(CASE WHEN "status" = 'POSTED' AND "type" IN ('INCOME', 'TRANSFER_IN') THEN "amount" ELSE 0 END), 0)::int AS "totalIncome",
      COALESCE(SUM(CASE WHEN "status" = 'POSTED' AND "type" IN ('EXPENSE', 'TRANSFER_OUT') THEN "amount" ELSE 0 END), 0)::int AS "totalExpense",
      COALESCE(SUM(CASE
        WHEN "status" != 'POSTED' THEN 0
        WHEN "type" IN ('INCOME', 'TRANSFER_IN') THEN "amount"
        WHEN "type" IN ('EXPENSE', 'TRANSFER_OUT') THEN -"amount"
        WHEN "type" = 'ADJUSTMENT' THEN "amount"
        ELSE 0
      END), 0)::int AS "currentBalance",
      COALESCE(SUM(CASE WHEN "status" = 'PENDING' THEN "amount" ELSE 0 END), 0)::int AS "pendingAmount",
      COUNT(*) FILTER (WHERE "status" = 'POSTED')::int AS "postedCount",
      COUNT(*) FILTER (WHERE "status" = 'VOIDED')::int AS "voidedCount"
    FROM "CashflowEntry"
    ${whereSql};
  `;

  return (
    rows[0] ?? {
      totalIncome: 0,
      totalExpense: 0,
      currentBalance: 0,
      pendingAmount: 0,
      postedCount: 0,
      voidedCount: 0,
    }
  );
}

export async function getCashflowTrend(
  db: CashflowDb,
  restaurantId: string,
  query: CashflowQuery
) {
  const whereSql = getWhereSql(restaurantId, {
    ...query,
    page: 1,
    limit: 1,
    status: undefined,
  });

  return db.$queryRaw<TrendRow[]>`
    SELECT
      date_trunc('month', "occurredAt") AS "period",
      COALESCE(SUM(CASE WHEN "status" = 'POSTED' AND "type" IN ('INCOME', 'TRANSFER_IN') THEN "amount" ELSE 0 END), 0)::int AS "income",
      COALESCE(SUM(CASE WHEN "status" = 'POSTED' AND "type" IN ('EXPENSE', 'TRANSFER_OUT') THEN "amount" ELSE 0 END), 0)::int AS "expense",
      COALESCE(SUM(CASE
        WHEN "status" != 'POSTED' THEN 0
        WHEN "type" IN ('INCOME', 'TRANSFER_IN') THEN "amount"
        WHEN "type" IN ('EXPENSE', 'TRANSFER_OUT') THEN -"amount"
        WHEN "type" = 'ADJUSTMENT' THEN "amount"
        ELSE 0
      END), 0)::int AS "balance"
    FROM "CashflowEntry"
    ${whereSql}
    GROUP BY 1
    ORDER BY 1 ASC;
  `;
}

export async function getCashflowCategorySummary(
  db: CashflowDb,
  restaurantId: string,
  query: CashflowQuery,
  direction: "income" | "expense"
) {
  const whereSql = getWhereSql(restaurantId, {
    ...query,
    page: 1,
    limit: 1,
    status: "POSTED",
  });
  const types = direction === "income" ? ["INCOME", "TRANSFER_IN"] : ["EXPENSE", "TRANSFER_OUT"];

  return db.$queryRaw<CategorySummaryRow[]>`
    SELECT
      "category" AS "category",
      COALESCE(SUM("amount"), 0)::int AS "amount",
      COUNT(*)::int AS "count"
    FROM "CashflowEntry"
    ${whereSql}
    AND "type" IN (${Prisma.join(types)})
    GROUP BY "category"
    ORDER BY "amount" DESC
    LIMIT 10;
  `;
}

export async function voidCashflowEntryRecord(
  db: CashflowDb,
  restaurantId: string,
  id: string
) {
  const rows = await db.$queryRaw<CashflowEntryRecord[]>`
    UPDATE "CashflowEntry"
    SET "status" = 'VOIDED', "voidedAt" = now(), "updatedAt" = now()
    WHERE "restaurantId" = ${restaurantId} AND "id" = ${id}
    RETURNING *;
  `;

  return rows[0] ?? null;
}
