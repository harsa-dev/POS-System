import { randomUUID } from "node:crypto";

import { Prisma, RawMaterialProcessingStatus, RawMaterialUnit, Role } from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/index.js";
import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import { prisma } from "../../lib/prisma.js";
import { toRawMaterialStockMovementDto } from "./raw-material-ledger.dto.js";
import type { RawMaterialActor } from "./raw-material-supplier.types.js";
import type {
  RawMaterialAdjustmentInput,
  RawMaterialProcessingConsumptionInput,
  RawMaterialStockMovementQuery,
  RawMaterialStockMovementReason,
  RawMaterialStockMovementRow,
  RawMaterialStockMovementSource,
  RawMaterialStockMovementType,
  RawMaterialTransferInput,
} from "./raw-material-stock-movement.types.js";
import {
  normalizeRawMaterialStockMovementReason,
  normalizeRawMaterialStockMovementSource,
  normalizeRawMaterialStockMovementType,
  validateRawMaterialAdjustmentInput,
  validateRawMaterialProcessingConsumptionInput,
  validateRawMaterialTransferInput,
} from "./raw-material-stock-movement.validation.js";

const viewRoles = new Set<Role>([Role.OWNER, Role.MANAGER, Role.ADMIN, Role.OPERATOR, Role.STAFF, Role.VIEWER]);
const manageRoles = new Set<Role>([Role.OWNER, Role.MANAGER, Role.ADMIN, Role.OPERATOR]);
const quantityTolerance = 0.0001;

type Tx = Prisma.TransactionClient;

function appError(statusCode: number, code: string, message: string, details?: Record<string, unknown>): never {
  throw new AppError({ statusCode, code, message, details });
}

function assertCanView(actor: RawMaterialActor) {
  if (viewRoles.has(actor.role)) return;
  appError(403, errorCodes.forbidden, "You do not have permission to view raw material stock movements.");
}

function assertCanManage(actor: RawMaterialActor) {
  if (manageRoles.has(actor.role)) return;
  appError(403, errorCodes.forbidden, "You do not have permission to manage raw material stock movements.");
}

function assertKgBatch(unit: RawMaterialUnit) {
  if (unit === RawMaterialUnit.KG) return;
  appError(400, errorCodes.validationError, "Raw material stock movement currently supports KG batches only.");
}

function assertQuantityRange(nextRemaining: number, batchQuantity: number) {
  if (nextRemaining < -quantityTolerance) {
    appError(400, errorCodes.validationError, "Batch remaining quantity cannot become negative.");
  }
  if (nextRemaining > batchQuantity + quantityTolerance) {
    appError(400, errorCodes.validationError, "Batch remaining quantity cannot exceed batch quantity.");
  }
}

async function loadBatchForMutation(tx: Tx, businessId: string, batchId: string) {
  const batch = await tx.rawMaterialBatch.findFirst({
    where: { id: batchId, businessId },
    include: { storageLocation: true },
  });

  if (!batch) appError(404, errorCodes.notFound, "Raw material batch not found.");
  if (!batch.isActive) appError(400, errorCodes.validationError, "Raw material batch is inactive.");
  assertKgBatch(batch.unit);
  return batch;
}

async function loadStorageForMutation(tx: Tx, businessId: string, storageLocationId: string) {
  const storage = await tx.rawMaterialStorageLocation.findFirst({
    where: { id: storageLocationId, businessId, isActive: true },
  });

  if (!storage) appError(404, errorCodes.notFound, "Raw material storage location not found or inactive.");
  return storage;
}

function assertStorageUsage(nextUsedKg: number, capacityKg: number) {
  if (nextUsedKg < -quantityTolerance) {
    appError(400, errorCodes.validationError, "Storage used quantity cannot become negative.");
  }
  if (capacityKg > 0 && nextUsedKg > capacityKg + quantityTolerance) {
    appError(400, errorCodes.validationError, "Storage capacity would be exceeded.");
  }
}

async function insertMovement(tx: Tx, input: {
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
}) {
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

async function findMovementById(tx: Tx, businessId: string, id: string) {
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

  const row = rows[0];
  if (!row) appError(404, errorCodes.notFound, "Raw material stock movement not found.");
  return row;
}

export async function listRawMaterialStockMovements(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  query?: RawMaterialStockMovementQuery;
}) {
  const { actor, businessContext, query = {} } = params;
  assertCanView(actor);

  const type = normalizeRawMaterialStockMovementType(query.type);
  const reason = normalizeRawMaterialStockMovementReason(query.reason);
  const source = normalizeRawMaterialStockMovementSource(query.source);
  const search = query.search?.trim();
  const rows = await prisma.$queryRaw<RawMaterialStockMovementRow[]>`
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
    WHERE movement."businessId" = ${businessContext.businessId}
      AND (${query.batchId ?? null}::text IS NULL OR movement."batchId" = ${query.batchId ?? null})
      AND (${type ?? null}::"RawMaterialStockMovementType" IS NULL OR movement."type" = ${type ?? null}::"RawMaterialStockMovementType")
      AND (${reason ?? null}::"RawMaterialStockMovementReason" IS NULL OR movement."reason" = ${reason ?? null}::"RawMaterialStockMovementReason")
      AND (${source ?? null}::"RawMaterialStockMovementSource" IS NULL OR movement."source" = ${source ?? null}::"RawMaterialStockMovementSource")
      AND (${query.sourceId ?? null}::text IS NULL OR movement."sourceId" = ${query.sourceId ?? null})
      AND (${query.storageLocationId ?? null}::text IS NULL OR movement."sourceStorageLocationId" = ${query.storageLocationId ?? null} OR movement."targetStorageLocationId" = ${query.storageLocationId ?? null})
      AND (${search ?? null}::text IS NULL OR batch."lotCode" ILIKE ${`%${search ?? ""}%`} OR batch."materialName" ILIKE ${`%${search ?? ""}%`} OR movement."note" ILIKE ${`%${search ?? ""}%`})
    ORDER BY movement."createdAt" DESC
    LIMIT 200
  `;

  return rows.map(toRawMaterialStockMovementDto);
}

export async function adjustRawMaterialBatchStock(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  input: RawMaterialAdjustmentInput;
}) {
  const { actor, businessContext } = params;
  assertCanManage(actor);
  const data = validateRawMaterialAdjustmentInput(params.input);

  return prisma.$transaction(async (tx) => {
    const batch = await loadBatchForMutation(tx, businessContext.businessId, data.batchId);
    const nextRemaining = batch.remainingQuantity + data.deltaQuantity;
    assertQuantityRange(nextRemaining, batch.quantity);

    const nextUsedKg = batch.storageLocation.usedKg + data.deltaQuantity;
    assertStorageUsage(nextUsedKg, batch.storageLocation.capacityKg);

    await tx.rawMaterialBatch.update({
      where: { id: batch.id },
      data: { remainingQuantity: nextRemaining },
    });
    await tx.rawMaterialStorageLocation.update({
      where: { id: batch.storageLocationId },
      data: { usedKg: nextUsedKg },
    });

    const movementId = await insertMovement(tx, {
      businessId: businessContext.businessId,
      batchId: batch.id,
      sourceStorageLocationId: batch.storageLocationId,
      targetStorageLocationId: batch.storageLocationId,
      type: "ADJUSTMENT",
      reason: data.reason,
      source: "MANUAL",
      quantity: Math.abs(data.deltaQuantity),
      beforeQuantity: batch.remainingQuantity,
      afterQuantity: nextRemaining,
      note: data.note,
      createdById: actor.id,
    });

    return toRawMaterialStockMovementDto(await findMovementById(tx, businessContext.businessId, movementId));
  });
}

export async function transferRawMaterialBatchStorage(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  input: RawMaterialTransferInput;
}) {
  const { actor, businessContext } = params;
  assertCanManage(actor);
  const data = validateRawMaterialTransferInput(params.input);

  return prisma.$transaction(async (tx) => {
    const batch = await loadBatchForMutation(tx, businessContext.businessId, data.batchId);
    const targetStorage = await loadStorageForMutation(tx, businessContext.businessId, data.targetStorageLocationId);

    if (batch.storageLocationId === targetStorage.id) {
      appError(400, errorCodes.validationError, "Target storage location must be different from source storage location.");
    }
    if (batch.remainingQuantity <= 0) {
      appError(400, errorCodes.validationError, "Cannot transfer an empty batch.");
    }

    const nextSourceUsedKg = batch.storageLocation.usedKg - batch.remainingQuantity;
    const nextTargetUsedKg = targetStorage.usedKg + batch.remainingQuantity;
    assertStorageUsage(nextSourceUsedKg, batch.storageLocation.capacityKg);
    assertStorageUsage(nextTargetUsedKg, targetStorage.capacityKg);

    await tx.rawMaterialStorageLocation.update({ where: { id: batch.storageLocationId }, data: { usedKg: nextSourceUsedKg } });
    await tx.rawMaterialStorageLocation.update({ where: { id: targetStorage.id }, data: { usedKg: nextTargetUsedKg } });
    await tx.rawMaterialBatch.update({ where: { id: batch.id }, data: { storageLocationId: targetStorage.id } });

    const outId = await insertMovement(tx, {
      businessId: businessContext.businessId,
      batchId: batch.id,
      sourceStorageLocationId: batch.storageLocationId,
      targetStorageLocationId: targetStorage.id,
      type: "TRANSFER_OUT",
      reason: "TRANSFER",
      source: "TRANSFER",
      quantity: batch.remainingQuantity,
      beforeQuantity: batch.remainingQuantity,
      afterQuantity: batch.remainingQuantity,
      note: data.note,
      createdById: actor.id,
    });
    await insertMovement(tx, {
      businessId: businessContext.businessId,
      batchId: batch.id,
      sourceStorageLocationId: batch.storageLocationId,
      targetStorageLocationId: targetStorage.id,
      type: "TRANSFER_IN",
      reason: "TRANSFER",
      source: "TRANSFER",
      quantity: batch.remainingQuantity,
      beforeQuantity: batch.remainingQuantity,
      afterQuantity: batch.remainingQuantity,
      note: data.note,
      createdById: actor.id,
    });

    return toRawMaterialStockMovementDto(await findMovementById(tx, businessContext.businessId, outId));
  });
}

export async function consumeRawMaterialForProcessingRun(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  input: RawMaterialProcessingConsumptionInput;
}) {
  const { actor, businessContext } = params;
  assertCanManage(actor);
  const data = validateRawMaterialProcessingConsumptionInput(params.input);

  return prisma.$transaction(async (tx) => {
    const existingLedger = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "RawMaterialStockMovement"
      WHERE "businessId" = ${businessContext.businessId}
        AND "source" = 'PROCESSING_RUN'::"RawMaterialStockMovementSource"
        AND "sourceId" = ${data.processingRunId}
      LIMIT 1
    `;
    if (existingLedger.length > 0) {
      appError(409, errorCodes.conflict, "Processing run has already consumed stock.");
    }

    const run = await tx.rawMaterialProcessingRun.findFirst({
      where: { id: data.processingRunId, businessId: businessContext.businessId },
      include: { inputBatch: { include: { storageLocation: true } } },
    });
    if (!run) appError(404, errorCodes.notFound, "Raw material processing run not found.");
    if (run.status === RawMaterialProcessingStatus.PLANNED || run.status === RawMaterialProcessingStatus.CANCELLED) {
      appError(400, errorCodes.validationError, "Only running or completed processing runs can consume stock.");
    }

    const batch = run.inputBatch;
    if (!batch.isActive) appError(400, errorCodes.validationError, "Input batch is inactive.");
    assertKgBatch(batch.unit);
    if (run.inputQuantity > batch.remainingQuantity) {
      appError(400, errorCodes.validationError, "Processing input quantity exceeds remaining batch quantity.");
    }

    const nextRemaining = batch.remainingQuantity - run.inputQuantity;
    const nextUsedKg = batch.storageLocation.usedKg - run.inputQuantity;
    assertQuantityRange(nextRemaining, batch.quantity);
    assertStorageUsage(nextUsedKg, batch.storageLocation.capacityKg);

    await tx.rawMaterialBatch.update({ where: { id: batch.id }, data: { remainingQuantity: nextRemaining } });
    await tx.rawMaterialStorageLocation.update({ where: { id: batch.storageLocationId }, data: { usedKg: nextUsedKg } });

    const movementId = await insertMovement(tx, {
      businessId: businessContext.businessId,
      batchId: batch.id,
      sourceStorageLocationId: batch.storageLocationId,
      type: "PRODUCTION_USAGE",
      reason: "PROCESSING_USAGE",
      source: "PROCESSING_RUN",
      sourceId: run.id,
      quantity: run.inputQuantity,
      beforeQuantity: batch.remainingQuantity,
      afterQuantity: nextRemaining,
      note: data.note,
      createdById: actor.id,
    });

    return toRawMaterialStockMovementDto(await findMovementById(tx, businessContext.businessId, movementId));
  });
}
