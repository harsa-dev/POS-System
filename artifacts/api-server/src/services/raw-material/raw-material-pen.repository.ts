import { randomUUID } from "node:crypto";

import { Prisma } from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/index.js";
import { prisma } from "../../lib/prisma.js";
import type { RawMaterialPenHealthStatus, RawMaterialPenQuery, RawMaterialPenRow } from "./raw-material-pen.types.js";

export type RawMaterialPenRecordPayload = Readonly<{
  code: string;
  flockName: string;
  capacity: number;
  occupancy: number;
  feedBatchId: string | null;
  healthStatus: RawMaterialPenHealthStatus;
  isActive: boolean;
  notes: string | null;
}>;

export type RawMaterialPenFeedBatchGuardRow = Readonly<{
  id: string;
  isActive: boolean;
  qualityStatus: "INSPECTION" | "ACCEPTED" | "REJECTED" | "QUARANTINED" | "EXPIRED";
  remainingQuantity: number;
}>;

function buildPenFilterSql(query: RawMaterialPenQuery) {
  const search = query.search?.trim();

  return Prisma.sql`
    ${query.feedBatchId ? Prisma.sql`AND p."feedBatchId" = ${query.feedBatchId}` : Prisma.empty}
    ${query.healthStatus ? Prisma.sql`AND p."healthStatus" = ${query.healthStatus}::"RawMaterialKandangHealthStatus"` : Prisma.empty}
    ${typeof query.isActive === "boolean" ? Prisma.sql`AND p."isActive" = ${query.isActive}` : Prisma.empty}
    ${search ? Prisma.sql`AND (p."code" ILIKE ${`%${search}%`} OR p."flockName" ILIKE ${`%${search}%`} OR p."notes" ILIKE ${`%${search}%`})` : Prisma.empty}
  `;
}

export async function findRawMaterialPenCodeConflict(params: {
  businessContext: BusinessContext;
  code: string;
  excludeId?: string;
}) {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id"
    FROM "RawMaterialKandangPen"
    WHERE "businessId" = ${params.businessContext.businessId}
      AND "code" = ${params.code}
      ${params.excludeId ? Prisma.sql`AND "id" <> ${params.excludeId}` : Prisma.empty}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function loadRawMaterialFeedBatchForPen(
  businessContext: BusinessContext,
  feedBatchId: string,
): Promise<RawMaterialPenFeedBatchGuardRow | null> {
  return prisma.rawMaterialBatch.findFirst({
    where: {
      id: feedBatchId,
      businessId: businessContext.businessId,
    },
    select: {
      id: true,
      isActive: true,
      qualityStatus: true,
      remainingQuantity: true,
    },
  });
}

export async function loadRawMaterialPenRow(
  businessContext: BusinessContext,
  id: string,
) {
  const rows = await prisma.$queryRaw<RawMaterialPenRow[]>`
    SELECT
      p."id",
      p."businessId",
      p."code",
      p."flockName",
      p."capacity",
      p."occupancy",
      p."feedBatchId",
      b."lotCode" AS "feedBatchLotCode",
      b."materialName" AS "feedBatchMaterialName",
      p."healthStatus"::text AS "healthStatus",
      p."isActive",
      p."notes",
      p."createdAt",
      p."updatedAt"
    FROM "RawMaterialKandangPen" p
    LEFT JOIN "RawMaterialBatch" b ON b."id" = p."feedBatchId"
    WHERE p."id" = ${id}
      AND p."businessId" = ${businessContext.businessId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function listRawMaterialPenRows(params: {
  businessContext: BusinessContext;
  query?: RawMaterialPenQuery;
}) {
  const query = params.query ?? {};

  return prisma.$queryRaw<RawMaterialPenRow[]>`
    SELECT
      p."id",
      p."businessId",
      p."code",
      p."flockName",
      p."capacity",
      p."occupancy",
      p."feedBatchId",
      b."lotCode" AS "feedBatchLotCode",
      b."materialName" AS "feedBatchMaterialName",
      p."healthStatus"::text AS "healthStatus",
      p."isActive",
      p."notes",
      p."createdAt",
      p."updatedAt"
    FROM "RawMaterialKandangPen" p
    LEFT JOIN "RawMaterialBatch" b ON b."id" = p."feedBatchId"
    WHERE p."businessId" = ${params.businessContext.businessId}
      ${buildPenFilterSql(query)}
    ORDER BY p."isActive" DESC, p."code" ASC
  `;
}

export async function createRawMaterialPenRecord(params: {
  businessContext: BusinessContext;
  payload: RawMaterialPenRecordPayload;
}) {
  const id = randomUUID();
  const { businessContext, payload } = params;

  await prisma.$executeRaw`
    INSERT INTO "RawMaterialKandangPen" (
      "id",
      "businessId",
      "code",
      "flockName",
      "capacity",
      "occupancy",
      "feedBatchId",
      "healthStatus",
      "isActive",
      "notes",
      "updatedAt"
    ) VALUES (
      ${id},
      ${businessContext.businessId},
      ${payload.code},
      ${payload.flockName},
      ${payload.capacity},
      ${payload.occupancy},
      ${payload.feedBatchId},
      ${payload.healthStatus}::"RawMaterialKandangHealthStatus",
      ${payload.isActive},
      ${payload.notes},
      CURRENT_TIMESTAMP
    )
  `;

  return id;
}

export async function updateRawMaterialPenRecord(params: {
  businessContext: BusinessContext;
  id: string;
  payload: RawMaterialPenRecordPayload;
}) {
  const { businessContext, id, payload } = params;

  await prisma.$executeRaw`
    UPDATE "RawMaterialKandangPen"
    SET
      "code" = ${payload.code},
      "flockName" = ${payload.flockName},
      "capacity" = ${payload.capacity},
      "occupancy" = ${payload.occupancy},
      "feedBatchId" = ${payload.feedBatchId},
      "healthStatus" = ${payload.healthStatus}::"RawMaterialKandangHealthStatus",
      "isActive" = ${payload.isActive},
      "notes" = ${payload.notes},
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${id}
      AND "businessId" = ${businessContext.businessId}
  `;
}

export async function deactivateRawMaterialPenRecord(params: {
  businessContext: BusinessContext;
  id: string;
}) {
  await prisma.$executeRaw`
    UPDATE "RawMaterialKandangPen"
    SET "isActive" = false,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${params.id}
      AND "businessId" = ${params.businessContext.businessId}
  `;
}
