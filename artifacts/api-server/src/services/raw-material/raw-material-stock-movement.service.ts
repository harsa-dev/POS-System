import { Role } from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/index.js";
import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import { prisma } from "../../lib/prisma.js";
import { writeRawMaterialAuditLog } from "./raw-material.audit.js";
import { toRawMaterialStockMovementDto } from "./raw-material-ledger.dto.js";
import type { RawMaterialActor } from "./raw-material-supplier.types.js";
import {
  assertRawMaterialDifferentStorage,
  assertRawMaterialKgBatch,
  assertRawMaterialManualAdjustmentNote,
  assertRawMaterialManualAdjustmentReason,
  assertRawMaterialPositiveMovementQuantity,
  assertRawMaterialQuantityRange,
  assertRawMaterialStockMovementLedger,
  assertRawMaterialStorageContainsQuantity,
  assertRawMaterialStorageUsage,
} from "./raw-material.stock-rules.js";
import {
  createRawMaterialStockMovementRecord,
  findRawMaterialProcessingConsumptionMovement,
  findRawMaterialStockAdjustmentReversalMovement,
  findRawMaterialStockMovementRowById,
  listRawMaterialStockMovementRows,
  loadRawMaterialBatchForMutation,
  loadRawMaterialStorageForMutation,
  type RawMaterialRepositoryTx,
} from "./raw-material-stock-movement.repository.js";
import type {
  RawMaterialAdjustmentInput,
  RawMaterialAdjustmentReversalInput,
  RawMaterialProcessingConsumptionInput,
  RawMaterialStockMovementQuery,
  RawMaterialStockMovementRow,
  RawMaterialTransferInput,
} from "./raw-material-stock-movement.types.js";
import {
  normalizeRawMaterialStockMovementReason,
  normalizeRawMaterialStockMovementSource,
  normalizeRawMaterialStockMovementType,
  validateRawMaterialAdjustmentInput,
  validateRawMaterialAdjustmentReversalInput,
  validateRawMaterialProcessingConsumptionInput,
  validateRawMaterialTransferInput,
} from "./raw-material-stock-movement.validation.js";
import { assertRawMaterialProcessingCanConsumeStock } from "./raw-material.workflow.js";

const viewRoles = new Set<Role>([Role.OWNER, Role.MANAGER, Role.ADMIN, Role.OPERATOR, Role.STAFF, Role.VIEWER]);
const manageRoles = new Set<Role>([Role.OWNER, Role.MANAGER, Role.ADMIN, Role.OPERATOR]);

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

async function getBatchForMutation(tx: RawMaterialRepositoryTx, businessId: string, batchId: string) {
  const batch = await loadRawMaterialBatchForMutation(tx, businessId, batchId);

  if (!batch) appError(404, errorCodes.notFound, "Raw material batch not found.");
  if (!batch.isActive) appError(400, errorCodes.validationError, "Raw material batch is inactive.");
  assertRawMaterialKgBatch(batch.unit);
  return batch;
}

async function getStorageForMutation(tx: RawMaterialRepositoryTx, businessId: string, storageLocationId: string) {
  const storage = await loadRawMaterialStorageForMutation(tx, businessId, storageLocationId);

  if (!storage) appError(404, errorCodes.notFound, "Raw material storage location not found or inactive.");
  return storage;
}

async function getMovementDto(tx: RawMaterialRepositoryTx, businessId: string, movementId: string) {
  const row = await findRawMaterialStockMovementRowById(tx, businessId, movementId);

  if (!row) appError(404, errorCodes.notFound, "Raw material stock movement not found.");
  return toRawMaterialStockMovementDto(row);
}

function assertAdjustmentCanBeReversed(original: RawMaterialStockMovementRow) {
  if (original.type !== "ADJUSTMENT") {
    appError(400, errorCodes.validationError, "Only adjustment stock movements can be reversed.", {
      movementId: original.id,
      type: original.type,
    });
  }

  if (original.source === "SYSTEM" || original.sourceId) {
    appError(400, errorCodes.validationError, "System-generated or already-linked adjustment movements cannot be reversed.", {
      movementId: original.id,
      source: original.source,
      sourceId: original.sourceId,
    });
  }

  if (original.source !== "MANUAL" && original.source !== "STOCK_COUNT") {
    appError(400, errorCodes.validationError, "Only manual or stock-count adjustment movements can be reversed.", {
      movementId: original.id,
      source: original.source,
    });
  }

  if (original.quantity <= 0 || original.beforeQuantity === null || original.afterQuantity === null) {
    appError(400, errorCodes.validationError, "Adjustment movement is missing reversible quantity metadata.", {
      movementId: original.id,
    });
  }

  if (!original.sourceStorageLocationId || !original.targetStorageLocationId) {
    appError(400, errorCodes.validationError, "Adjustment movement is missing storage references.", {
      movementId: original.id,
    });
  }

  if (original.sourceStorageLocationId !== original.targetStorageLocationId) {
    appError(400, errorCodes.validationError, "Adjustment reversal requires matching source and target storage references.", {
      movementId: original.id,
    });
  }
}

export async function listRawMaterialStockMovements(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  query?: RawMaterialStockMovementQuery;
}) {
  const { actor, businessContext, query = {} } = params;
  assertCanView(actor);

  const rows = await listRawMaterialStockMovementRows({
    businessId: businessContext.businessId,
    batchId: query.batchId,
    type: normalizeRawMaterialStockMovementType(query.type),
    reason: normalizeRawMaterialStockMovementReason(query.reason),
    source: normalizeRawMaterialStockMovementSource(query.source),
    sourceId: query.sourceId,
    storageLocationId: query.storageLocationId,
    search: query.search,
  });

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
  assertRawMaterialManualAdjustmentReason(data.reason);
  assertRawMaterialManualAdjustmentNote({ reason: data.reason, note: data.note });
  assertRawMaterialPositiveMovementQuantity(Math.abs(data.deltaQuantity), "Adjustment quantity");

  return prisma.$transaction(async (tx) => {
    const batch = await getBatchForMutation(tx, businessContext.businessId, data.batchId);
    const movementQuantity = Math.abs(data.deltaQuantity);
    const nextRemaining = batch.remainingQuantity + data.deltaQuantity;
    assertRawMaterialQuantityRange({ nextRemaining, batchQuantity: batch.quantity });

    if (data.deltaQuantity < 0) {
      assertRawMaterialStorageContainsQuantity({
        storageLocationId: batch.storageLocationId,
        storageUsedKg: batch.storageLocation.usedKg,
        quantity: movementQuantity,
      });
    }

    const nextUsedKg = batch.storageLocation.usedKg + data.deltaQuantity;
    assertRawMaterialStorageUsage({ nextUsedKg, capacityKg: batch.storageLocation.capacityKg });
    assertRawMaterialStockMovementLedger({
      type: "ADJUSTMENT",
      reason: data.reason,
      source: "MANUAL",
      sourceStorageLocationId: batch.storageLocationId,
      targetStorageLocationId: batch.storageLocationId,
      quantity: movementQuantity,
      beforeQuantity: batch.remainingQuantity,
      afterQuantity: nextRemaining,
    });

    await tx.rawMaterialBatch.update({
      where: { id: batch.id },
      data: { remainingQuantity: nextRemaining },
    });
    await tx.rawMaterialStorageLocation.update({
      where: { id: batch.storageLocationId },
      data: { usedKg: nextUsedKg },
    });

    const movementId = await createRawMaterialStockMovementRecord(tx, {
      businessId: businessContext.businessId,
      batchId: batch.id,
      sourceStorageLocationId: batch.storageLocationId,
      targetStorageLocationId: batch.storageLocationId,
      type: "ADJUSTMENT",
      reason: data.reason,
      source: "MANUAL",
      quantity: movementQuantity,
      beforeQuantity: batch.remainingQuantity,
      afterQuantity: nextRemaining,
      note: data.note,
      createdById: actor.id,
    });

    await writeRawMaterialAuditLog({
      businessId: businessContext.businessId,
      userId: actor.id,
      action: "CREATE",
      entityType: "RawMaterialStockMovement",
      entityId: movementId,
      changes: {
        operation: "adjust",
        input: data,
        batchId: batch.id,
        beforeQuantity: batch.remainingQuantity,
        afterQuantity: nextRemaining,
        beforeStorageUsedKg: batch.storageLocation.usedKg,
        afterStorageUsedKg: nextUsedKg,
      },
    }, tx);

    return getMovementDto(tx, businessContext.businessId, movementId);
  });
}

export async function reverseRawMaterialStockAdjustment(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  input: RawMaterialAdjustmentReversalInput;
}) {
  const { actor, businessContext } = params;
  assertCanManage(actor);
  const data = validateRawMaterialAdjustmentReversalInput(params.input);

  return prisma.$transaction(async (tx) => {
    const original = await findRawMaterialStockMovementRowById(tx, businessContext.businessId, data.movementId);
    if (!original) appError(404, errorCodes.notFound, "Raw material adjustment movement not found.");
    assertAdjustmentCanBeReversed(original);

    const existingReversal = await findRawMaterialStockAdjustmentReversalMovement(tx, businessContext.businessId, original.id);
    if (existingReversal) {
      appError(409, errorCodes.conflict, "Raw material stock adjustment has already been reversed.", {
        originalMovementId: original.id,
        reversalMovementId: existingReversal.id,
      });
    }

    const batch = await getBatchForMutation(tx, businessContext.businessId, original.batchId);
    if (batch.storageLocationId !== original.sourceStorageLocationId) {
      appError(409, errorCodes.conflict, "Batch storage changed after the original adjustment. Move it back or apply a new correction instead.", {
        originalMovementId: original.id,
        originalStorageLocationId: original.sourceStorageLocationId,
        currentStorageLocationId: batch.storageLocationId,
      });
    }

    const reverseDelta = Number(original.beforeQuantity) - Number(original.afterQuantity);
    const movementQuantity = Math.abs(reverseDelta);
    const nextRemaining = batch.remainingQuantity + reverseDelta;
    const nextUsedKg = batch.storageLocation.usedKg + reverseDelta;
    assertRawMaterialPositiveMovementQuantity(movementQuantity, "Adjustment reversal quantity");
    assertRawMaterialQuantityRange({ nextRemaining, batchQuantity: batch.quantity });
    if (reverseDelta < 0) {
      assertRawMaterialStorageContainsQuantity({
        storageLocationId: batch.storageLocationId,
        storageUsedKg: batch.storageLocation.usedKg,
        quantity: movementQuantity,
      });
    }
    assertRawMaterialStorageUsage({ nextUsedKg, capacityKg: batch.storageLocation.capacityKg });
    assertRawMaterialStockMovementLedger({
      type: "ADJUSTMENT",
      reason: "CORRECTION",
      source: "SYSTEM",
      sourceId: original.id,
      sourceStorageLocationId: batch.storageLocationId,
      targetStorageLocationId: batch.storageLocationId,
      quantity: movementQuantity,
      beforeQuantity: batch.remainingQuantity,
      afterQuantity: nextRemaining,
    });

    await tx.rawMaterialBatch.update({ where: { id: batch.id }, data: { remainingQuantity: nextRemaining } });
    await tx.rawMaterialStorageLocation.update({ where: { id: batch.storageLocationId }, data: { usedKg: nextUsedKg } });

    const movementId = await createRawMaterialStockMovementRecord(tx, {
      businessId: businessContext.businessId,
      batchId: batch.id,
      sourceStorageLocationId: batch.storageLocationId,
      targetStorageLocationId: batch.storageLocationId,
      type: "ADJUSTMENT",
      reason: "CORRECTION",
      source: "SYSTEM",
      sourceId: original.id,
      quantity: movementQuantity,
      beforeQuantity: batch.remainingQuantity,
      afterQuantity: nextRemaining,
      note: `Reversal of raw material stock adjustment ${original.id}: ${data.note}`,
      createdById: actor.id,
    });

    await writeRawMaterialAuditLog({
      businessId: businessContext.businessId,
      userId: actor.id,
      action: "CREATE",
      entityType: "RawMaterialStockMovement",
      entityId: movementId,
      changes: {
        operation: "reverse-adjustment",
        input: data,
        originalMovementId: original.id,
        reversalMovementId: movementId,
        batchId: batch.id,
        reverseDelta,
        beforeQuantity: batch.remainingQuantity,
        afterQuantity: nextRemaining,
        beforeStorageUsedKg: batch.storageLocation.usedKg,
        afterStorageUsedKg: nextUsedKg,
      },
    }, tx);

    return getMovementDto(tx, businessContext.businessId, movementId);
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
    const batch = await getBatchForMutation(tx, businessContext.businessId, data.batchId);
    const targetStorage = await getStorageForMutation(tx, businessContext.businessId, data.targetStorageLocationId);

    assertRawMaterialDifferentStorage({
      sourceStorageLocationId: batch.storageLocationId,
      targetStorageLocationId: targetStorage.id,
    });
    assertRawMaterialPositiveMovementQuantity(batch.remainingQuantity, "Transfer quantity");
    assertRawMaterialStorageContainsQuantity({
      storageLocationId: batch.storageLocationId,
      storageUsedKg: batch.storageLocation.usedKg,
      quantity: batch.remainingQuantity,
    });

    const nextSourceUsedKg = batch.storageLocation.usedKg - batch.remainingQuantity;
    const nextTargetUsedKg = targetStorage.usedKg + batch.remainingQuantity;
    assertRawMaterialStorageUsage({ nextUsedKg: nextSourceUsedKg, capacityKg: batch.storageLocation.capacityKg });
    assertRawMaterialStorageUsage({ nextUsedKg: nextTargetUsedKg, capacityKg: targetStorage.capacityKg });
    assertRawMaterialStockMovementLedger({
      type: "TRANSFER_OUT",
      reason: "TRANSFER_OUT",
      source: "TRANSFER",
      sourceStorageLocationId: batch.storageLocationId,
      targetStorageLocationId: targetStorage.id,
      quantity: batch.remainingQuantity,
      beforeQuantity: batch.remainingQuantity,
      afterQuantity: batch.remainingQuantity,
    });
    assertRawMaterialStockMovementLedger({
      type: "TRANSFER_IN",
      reason: "TRANSFER_IN",
      source: "TRANSFER",
      sourceStorageLocationId: batch.storageLocationId,
      targetStorageLocationId: targetStorage.id,
      quantity: batch.remainingQuantity,
      beforeQuantity: batch.remainingQuantity,
      afterQuantity: batch.remainingQuantity,
    });

    await tx.rawMaterialStorageLocation.update({ where: { id: batch.storageLocationId }, data: { usedKg: nextSourceUsedKg } });
    await tx.rawMaterialStorageLocation.update({ where: { id: targetStorage.id }, data: { usedKg: nextTargetUsedKg } });
    await tx.rawMaterialBatch.update({ where: { id: batch.id }, data: { storageLocationId: targetStorage.id } });

    const outId = await createRawMaterialStockMovementRecord(tx, {
      businessId: businessContext.businessId,
      batchId: batch.id,
      sourceStorageLocationId: batch.storageLocationId,
      targetStorageLocationId: targetStorage.id,
      type: "TRANSFER_OUT",
      reason: "TRANSFER_OUT",
      source: "TRANSFER",
      quantity: batch.remainingQuantity,
      beforeQuantity: batch.remainingQuantity,
      afterQuantity: batch.remainingQuantity,
      note: data.note,
      createdById: actor.id,
    });
    const inId = await createRawMaterialStockMovementRecord(tx, {
      businessId: businessContext.businessId,
      batchId: batch.id,
      sourceStorageLocationId: batch.storageLocationId,
      targetStorageLocationId: targetStorage.id,
      type: "TRANSFER_IN",
      reason: "TRANSFER_IN",
      source: "TRANSFER",
      quantity: batch.remainingQuantity,
      beforeQuantity: batch.remainingQuantity,
      afterQuantity: batch.remainingQuantity,
      note: data.note,
      createdById: actor.id,
    });

    await writeRawMaterialAuditLog({
      businessId: businessContext.businessId,
      userId: actor.id,
      action: "CREATE",
      entityType: "RawMaterialStockMovement",
      entityId: outId,
      changes: {
        operation: "transfer",
        input: data,
        batchId: batch.id,
        outMovementId: outId,
        inMovementId: inId,
        sourceStorageLocationId: batch.storageLocationId,
        targetStorageLocationId: targetStorage.id,
        quantity: batch.remainingQuantity,
        beforeSourceUsedKg: batch.storageLocation.usedKg,
        afterSourceUsedKg: nextSourceUsedKg,
        beforeTargetUsedKg: targetStorage.usedKg,
        afterTargetUsedKg: nextTargetUsedKg,
      },
    }, tx);

    return getMovementDto(tx, businessContext.businessId, outId);
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
    const existingLedger = await findRawMaterialProcessingConsumptionMovement(
      tx,
      businessContext.businessId,
      data.processingRunId,
    );
    if (existingLedger) {
      appError(409, errorCodes.conflict, "Processing run has already consumed stock.");
    }

    const run = await tx.rawMaterialProcessingRun.findFirst({
      where: { id: data.processingRunId, businessId: businessContext.businessId },
      include: { inputBatch: { include: { storageLocation: true } } },
    });
    if (!run) appError(404, errorCodes.notFound, "Raw material processing run not found.");
    assertRawMaterialProcessingCanConsumeStock({ status: run.status });

    const batch = run.inputBatch;
    if (!batch.isActive) appError(400, errorCodes.validationError, "Input batch is inactive.");
    assertRawMaterialKgBatch(batch.unit);
    if (run.inputQuantity > batch.remainingQuantity) {
      appError(400, errorCodes.validationError, "Processing input quantity exceeds remaining batch quantity.");
    }

    const nextRemaining = batch.remainingQuantity - run.inputQuantity;
    const nextUsedKg = batch.storageLocation.usedKg - run.inputQuantity;
    assertRawMaterialQuantityRange({ nextRemaining, batchQuantity: batch.quantity });
    assertRawMaterialStorageContainsQuantity({
      storageLocationId: batch.storageLocationId,
      storageUsedKg: batch.storageLocation.usedKg,
      quantity: run.inputQuantity,
    });
    assertRawMaterialStorageUsage({ nextUsedKg, capacityKg: batch.storageLocation.capacityKg });
    assertRawMaterialPositiveMovementQuantity(run.inputQuantity, "Processing consumption quantity");
    assertRawMaterialStockMovementLedger({
      type: "PRODUCTION_USAGE",
      reason: "PRODUCTION_USAGE",
      source: "PROCESSING_RUN",
      sourceId: run.id,
      sourceStorageLocationId: batch.storageLocationId,
      targetStorageLocationId: null,
      quantity: run.inputQuantity,
      beforeQuantity: batch.remainingQuantity,
      afterQuantity: nextRemaining,
    });

    await tx.rawMaterialBatch.update({ where: { id: batch.id }, data: { remainingQuantity: nextRemaining } });
    await tx.rawMaterialStorageLocation.update({ where: { id: batch.storageLocationId }, data: { usedKg: nextUsedKg } });

    const movementId = await createRawMaterialStockMovementRecord(tx, {
      businessId: businessContext.businessId,
      batchId: batch.id,
      sourceStorageLocationId: batch.storageLocationId,
      type: "PRODUCTION_USAGE",
      reason: "PRODUCTION_USAGE",
      source: "PROCESSING_RUN",
      sourceId: run.id,
      quantity: run.inputQuantity,
      beforeQuantity: batch.remainingQuantity,
      afterQuantity: nextRemaining,
      note: data.note,
      createdById: actor.id,
    });

    await writeRawMaterialAuditLog({
      businessId: businessContext.businessId,
      userId: actor.id,
      action: "CREATE",
      entityType: "RawMaterialStockMovement",
      entityId: movementId,
      changes: {
        operation: "consume-processing",
        input: data,
        processingRunId: run.id,
        batchId: batch.id,
        beforeQuantity: batch.remainingQuantity,
        afterQuantity: nextRemaining,
        beforeStorageUsedKg: batch.storageLocation.usedKg,
        afterStorageUsedKg: nextUsedKg,
      },
    }, tx);

    return getMovementDto(tx, businessContext.businessId, movementId);
  });
}
