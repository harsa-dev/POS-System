import { randomUUID } from "node:crypto";

import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import type {
  RawMaterialStockMovementReason,
  RawMaterialStockMovementRow,
  RawMaterialStockMovementSource,
  RawMaterialStockMovementType,
} from "./raw-material-stock-movement.types.js";

export type RawMaterialRepositoryTx = Prisma.TransactionClient;

export type RawMaterialStockMovementInsert = Readonly<{
  businessId: string;
  batchId: string;
  sourceStorageLocationId?: string | null;
  targetStorageLocationId?: string | null;
  type: RawMaterialStockMovementType;
  reason: RawMaterialStockMovementReason;
  source: RawMaterialStockMovementSource;
  sourceId?: string | null;
  quantity: number;
  beforeQuantity?: number | null;
  afterQuantity?: number | null;
  note?: string | null;
  createdById?: string | null;
}>;

export type RawMaterialStockMovementListQuery = Readonly<{
  businessId: string;
  batchId?: string;
  type?: RawMaterialStockMovementType;
  reason?: RawMaterialStockMovementReason;
  source?: RawMaterialStockMovementSource;
  sourceId?: string;
  storageLocationId?: string;
  search?: string;
}>;

export async function loadRawMaterialBatchForMutation(
  tx: RawMaterialRepositoryTx,
  businessId: string,
  batchId: string,
) {
  return tx.rawMaterialBatch.findFirst({
    where: { id: batchId, businessId },
    include: { storageLocation: true },
  });
}

export async function loadRawMaterialStorageForMutation(
  tx: RawMaterialRepositoryTx,
  businessId: string,
  storageLocationId: string,
) {
  return tx.rawMaterialStorageLocation.findFirst({
    where: { id: storageLocationId, businessId, isActive: true },
  });
}

export async function createRawMaterialStockMovementRecord(
  tx: RawMaterialRepositoryTx,
  input: RawMaterialStockMovementInsert,
) {
  const id = randomUUID();

  await tx.$executeRaw`
    INSERT INTO "RawMaterialStockMovement" (
      "id",
      "businessId",
      "batchId",
      "sourceStorageLocationId",
      "targetStorageLocationId",
      "type",
      "reason",
      "source",
      "sourceId",
      "quantity",
      "beforeQuantity",
      "afterQuantity",
      "note",
      "createdById"
    ) VALUES (
      ${id},
      ${input.businessId},
      ${input.batchId},
      ${input.sourceStorageLocationId ?? null},
      ${input.targetStorageLocationId ?? null},
      ${input.type}::"RawMaterialStockMovementType",
      ${input.reason}::"RawMaterialStockMovementReason",
      ${input.source}::"RawMaterialStockMovementSource",
      ${input.sourceId ?? null},
      ${input.quantity},
      ${input.beforeQuantity ?? null},
      ${input.afterQuantity ?? null},
      ${input.note ?? null},
      ${input.createdById ?? null}
    )
  `;

  return id;
}

export async function findRawMaterialStockMovementRowById(
  tx: RawMaterialRepositoryTx,
  businessId: string,
  id: string,
) {
  const rows = await tx.$queryRaw<RawMaterialStockMovementRow[]>`
    SELECT
      movement."id",
      movement."businessId",
      movement."batchId",
      batch."lotCode" AS "batchLotCode",
      batch."materialName" AS "materialName",
      movement."sourceStorageLocationId",
      source_storage."code" AS "sourceStorageCode",
      movement."targetStorageLocationId",
      target_storage."code" AS "targetStorageCode",
      movement."type",
      movement."reason",
      movement."source",
      movement."sourceId",
      movement."quantity",
      movement."beforeQuantity",
      movement."afterQuantity",
      movement."note",
      movement."createdById",
      movement."createdAt"
    FROM "RawMaterialStockMovement" movement
    JOIN "RawMaterialBatch" batch ON batch."id" = movement."batchId"
    LEFT JOIN "RawMaterialStorageLocation" source_storage ON source_storage."id" = movement."sourceStorageLocationId"
    LEFT JOIN "RawMaterialStorageLocation" target_storage ON target_storage."id" = movement."targetStorageLocationId"
    WHERE movement."businessId" = ${businessId} AND movement."id" = ${id}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function listRawMaterialStockMovementRows(query: RawMaterialStockMovementListQuery) {
  const search = query.search?.trim();

  return prisma.$queryRaw<RawMaterialStockMovementRow[]>`
    SELECT
      movement."id",
      movement."businessId",
      movement."batchId",
      batch."lotCode" AS "batchLotCode",
      batch."materialName" AS "materialName",
      movement."sourceStorageLocationId",
      source_storage."code" AS "sourceStorageCode",
      movement."targetStorageLocationId",
      target_storage."code" AS "targetStorageCode",
      movement."type",
      movement."reason",
      movement."source",
      movement."sourceId",
      movement."quantity",
      movement."beforeQuantity",
      movement."afterQuantity",
      movement."note",
      movement."createdById",
      movement."createdAt"
    FROM "RawMaterialStockMovement" movement
    JOIN "RawMaterialBatch" batch ON batch."id" = movement."batchId"
    LEFT JOIN "RawMaterialStorageLocation" source_storage ON source_storage."id" = movement."sourceStorageLocationId"
    LEFT JOIN "RawMaterialStorageLocation" target_storage ON target_storage."id" = movement."targetStorageLocationId"
    WHERE movement."businessId" = ${query.businessId}
      AND (${query.batchId ?? null}::text IS NULL OR movement."batchId" = ${query.batchId ?? null})
      AND (${query.type ?? null}::"RawMaterialStockMovementType" IS NULL OR movement."type" = ${query.type ?? null}::"RawMaterialStockMovementType")
      AND (${query.reason ?? null}::"RawMaterialStockMovementReason" IS NULL OR movement."reason" = ${query.reason ?? null}::"RawMaterialStockMovementReason")
      AND (${query.source ?? null}::"RawMaterialStockMovementSource" IS NULL OR movement."source" = ${query.source ?? null}::"RawMaterialStockMovementSource")
      AND (${query.sourceId ?? null}::text IS NULL OR movement."sourceId" = ${query.sourceId ?? null})
      AND (${query.storageLocationId ?? null}::text IS NULL OR movement."sourceStorageLocationId" = ${query.storageLocationId ?? null} OR movement."targetStorageLocationId" = ${query.storageLocationId ?? null})
      AND (${search ?? null}::text IS NULL OR batch."lotCode" ILIKE ${`%${search ?? ""}%`} OR batch."materialName" ILIKE ${`%${search ?? ""}%`} OR movement."note" ILIKE ${`%${search ?? ""}%`})
    ORDER BY movement."createdAt" DESC
    LIMIT 200
  `;
}

export async function findRawMaterialStockAdjustmentReversalMovement(
  tx: RawMaterialRepositoryTx,
  businessId: string,
  originalMovementId: string,
) {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "RawMaterialStockMovement"
    WHERE "businessId" = ${businessId}
      AND "type" = 'ADJUSTMENT'::"RawMaterialStockMovementType"
      AND "source" = 'SYSTEM'::"RawMaterialStockMovementSource"
      AND "sourceId" = ${originalMovementId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function findRawMaterialProcessingConsumptionMovement(
  tx: RawMaterialRepositoryTx,
  businessId: string,
  processingRunId: string,
) {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "RawMaterialStockMovement"
    WHERE "businessId" = ${businessId}
      AND "source" = 'PROCESSING_RUN'::"RawMaterialStockMovementSource"
      AND "sourceId" = ${processingRunId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}
