import { randomUUID } from "node:crypto";

import { Prisma } from "@prisma/client";

import { prisma } from "./prisma.js";

export type ShiftSyncAttemptStatus = "RUNNING" | "SUCCESS" | "FAILED";

export type ShiftSyncAttemptLogRecord = {
  id: string;
  businessId: string;
  shiftId: string;
  attemptNumber: number;
  status: ShiftSyncAttemptStatus;
  errorCode: string | null;
  errorMessage: string | null;
  cashflowEntryId: string | null;
  actorId: string | null;
  actorRole: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function ensureShiftSyncAttemptTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ShiftCashflowSyncAttempt" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "businessId" TEXT NOT NULL,
      "shiftId" TEXT NOT NULL,
      "attemptNumber" INTEGER NOT NULL,
      "status" TEXT NOT NULL,
      "errorCode" TEXT,
      "errorMessage" TEXT,
      "cashflowEntryId" TEXT,
      "actorId" TEXT,
      "actorRole" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "ShiftCashflowSyncAttempt_business_shift_attempt_key"
      ON "ShiftCashflowSyncAttempt" ("businessId", "shiftId", "attemptNumber")
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ShiftCashflowSyncAttempt_business_shift_created_idx"
      ON "ShiftCashflowSyncAttempt" ("businessId", "shiftId", "createdAt" DESC)
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ShiftCashflowSyncAttempt_business_status_idx"
      ON "ShiftCashflowSyncAttempt" ("businessId", "status")
  `);
}

export async function createShiftSyncAttempt(params: {
  businessId: string;
  shiftId: string;
  actorId: string;
  actorRole: string;
}) {
  await ensureShiftSyncAttemptTable();

  const countRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS "count"
    FROM "ShiftCashflowSyncAttempt"
    WHERE "businessId" = ${params.businessId}
      AND "shiftId" = ${params.shiftId}
  `;
  const attemptNumber = Number(countRows[0]?.count ?? 0) + 1;
  const id = randomUUID();

  const rows = await prisma.$queryRaw<ShiftSyncAttemptLogRecord[]>`
    INSERT INTO "ShiftCashflowSyncAttempt" (
      "id",
      "businessId",
      "shiftId",
      "attemptNumber",
      "status",
      "actorId",
      "actorRole",
      "createdAt",
      "updatedAt"
    ) VALUES (
      ${id},
      ${params.businessId},
      ${params.shiftId},
      ${attemptNumber},
      ${"RUNNING"},
      ${params.actorId},
      ${params.actorRole},
      NOW(),
      NOW()
    )
    RETURNING *
  `;
  const attempt = rows[0];

  if (!attempt) {
    throw new Error("Failed to create shift cashflow sync attempt log.");
  }

  return attempt;
}

export async function markShiftSyncAttemptSuccess(params: {
  attemptId: string;
  cashflowEntryId: string | null;
}) {
  await prisma.$executeRaw`
    UPDATE "ShiftCashflowSyncAttempt"
    SET
      "status" = ${"SUCCESS"},
      "cashflowEntryId" = ${params.cashflowEntryId},
      "errorCode" = NULL,
      "errorMessage" = NULL,
      "updatedAt" = NOW()
    WHERE "id" = ${params.attemptId}
  `;
}

export async function markShiftSyncAttemptFailed(params: {
  attemptId: string;
  errorCode: string | null;
  errorMessage: string;
}) {
  await prisma.$executeRaw`
    UPDATE "ShiftCashflowSyncAttempt"
    SET
      "status" = ${"FAILED"},
      "errorCode" = ${params.errorCode},
      "errorMessage" = ${params.errorMessage},
      "updatedAt" = NOW()
    WHERE "id" = ${params.attemptId}
  `;
}

export async function listLatestShiftSyncAttempts(params: {
  businessId: string;
  shiftIds: string[];
}) {
  await ensureShiftSyncAttemptTable();

  if (params.shiftIds.length === 0) return new Map<string, ShiftSyncAttemptLogRecord>();

  const rows = await prisma.$queryRaw<ShiftSyncAttemptLogRecord[]>`
    SELECT DISTINCT ON ("shiftId") *
    FROM "ShiftCashflowSyncAttempt"
    WHERE "businessId" = ${params.businessId}
      AND "shiftId" IN (${Prisma.join(params.shiftIds)})
    ORDER BY "shiftId", "createdAt" DESC
  `;

  return new Map(rows.map((row) => [row.shiftId, row]));
}

export async function listShiftSyncAttemptHistory(params: {
  businessId: string;
  shiftId: string;
  limit?: number;
}) {
  await ensureShiftSyncAttemptTable();

  const limit = Math.min(Math.max(params.limit ?? 50, 1), 500);

  return prisma.$queryRaw<ShiftSyncAttemptLogRecord[]>`
    SELECT *
    FROM "ShiftCashflowSyncAttempt"
    WHERE "businessId" = ${params.businessId}
      AND "shiftId" = ${params.shiftId}
    ORDER BY "attemptNumber" DESC
    LIMIT ${limit}
  `;
}
