import { RawMaterialProcessingStatus, Role } from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/index.js";
import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import { prisma } from "../../lib/prisma.js";
import { writeRawMaterialAuditLog } from "./raw-material.audit.js";
import { toRawMaterialStockMovementDto } from "./raw-material-ledger.dto.js";
import { toRawMaterialProcessingRunDto } from "./raw-material-processing-run.presenter.js";
import type { RawMaterialActor } from "./raw-material-supplier.types.js";
import {
  assertRawMaterialKgBatch,
  assertRawMaterialPositiveMovementQuantity,
  assertRawMaterialQuantityRange,
  assertRawMaterialStorageUsage,
} from "./raw-material.stock-rules.js";
import {
  assertRawMaterialProcessingStatusTransition,
} from "./raw-material.workflow.js";
import {
  createRawMaterialStockMovementRecord,
  findRawMaterialProcessingConsumptionMovement,
  findRawMaterialStockMovementRowById,
  type RawMaterialRepositoryTx,
} from "./raw-material-stock-movement.repository.js";
import type { RawMaterialStockMovementRow } from "./raw-material-stock-movement.types.js";

const manageRoles = new Set<Role>([Role.OWNER, Role.MANAGER, Role.ADMIN, Role.OPERATOR]);

type ProcessingCancellationReversalInput = Readonly<{
  note?: unknown;
}>;

function appError(statusCode: number, code: string, message: string, details?: Record<string, unknown>): never {
  throw new AppError({ statusCode, code, message, details });
}

function assertCanManage(actor: RawMaterialActor) {
  if (manageRoles.has(actor.role)) return;
  appError(403, errorCodes.forbidden, "You do not have permission to manage raw material processing cancellations.");
}

function readCancellationNote(input?: ProcessingCancellationReversalInput) {
  const rawNote = typeof input?.note === "string" ? input.note.trim() : "";
  return rawNote || "Processing run cancelled through Raw Material workflow status delegate.";
}

function assertProcessingConsumptionCanBeReversed(consumption: RawMaterialStockMovementRow, processingRunId: string) {
  if (consumption.type !== "PRODUCTION_USAGE" || consumption.reason !== "PRODUCTION_USAGE") {
    appError(400, errorCodes.validationError, "Only processing usage stock movements can be reversed by processing cancellation.", {
      movementId: consumption.id,
      type: consumption.type,
      reason: consumption.reason,
    });
  }

  if (consumption.source !== "PROCESSING_RUN" || consumption.sourceId !== processingRunId) {
    appError(400, errorCodes.validationError, "Processing consumption movement is not linked to the requested processing run.", {
      movementId: consumption.id,
      source: consumption.source,
      sourceId: consumption.sourceId,
      processingRunId,
    });
  }

  if (consumption.quantity <= 0 || consumption.beforeQuantity === null || consumption.afterQuantity === null) {
    appError(400, errorCodes.validationError, "Processing consumption movement is missing reversible quantity metadata.", {
      movementId: consumption.id,
    });
  }

  if (!consumption.sourceStorageLocationId) {
    appError(400, errorCodes.validationError, "Processing consumption movement is missing source storage metadata.", {
      movementId: consumption.id,
    });
  }
}

async function findProcessingConsumptionReversalMovement(
  tx: RawMaterialRepositoryTx,
  businessId: string,
  consumptionMovementId: string,
) {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "RawMaterialStockMovement"
    WHERE "businessId" = ${businessId}
      AND "type" = 'CORRECTION'::"RawMaterialStockMovementType"
      AND "reason" = 'CORRECTION'::"RawMaterialStockMovementReason"
      AND "source" = 'SYSTEM'::"RawMaterialStockMovementSource"
      AND "sourceId" = ${consumptionMovementId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function cancelRawMaterialProcessingRunWithStockReversal(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  id: string;
  input?: ProcessingCancellationReversalInput;
}) {
  const { actor, businessContext, id } = params;
  assertCanManage(actor);
  const note = readCancellationNote(params.input);

  return prisma.$transaction(async (tx) => {
    const run = await tx.rawMaterialProcessingRun.findFirst({
      where: { id, businessId: businessContext.businessId },
      include: { inputBatch: { include: { storageLocation: true } } },
    });

    if (!run) appError(404, errorCodes.notFound, "Raw material processing run not found.");

    assertRawMaterialProcessingStatusTransition({
      currentStatus: run.status,
      nextStatus: RawMaterialProcessingStatus.CANCELLED,
    });

    const consumptionRef = await findRawMaterialProcessingConsumptionMovement(
      tx,
      businessContext.businessId,
      run.id,
    );

    const beforeProcessingRun = toRawMaterialProcessingRunDto(run);
    let reversalMovement = null;
    let reversalMovementId: string | null = null;
    let beforeQuantity: number | null = null;
    let afterQuantity: number | null = null;
    let beforeStorageUsedKg: number | null = null;
    let afterStorageUsedKg: number | null = null;

    if (consumptionRef) {
      const consumption = await findRawMaterialStockMovementRowById(
        tx,
        businessContext.businessId,
        consumptionRef.id,
      );

      if (!consumption) appError(404, errorCodes.notFound, "Raw material processing consumption movement not found.");
      assertProcessingConsumptionCanBeReversed(consumption, run.id);

      const existingReversal = await findProcessingConsumptionReversalMovement(
        tx,
        businessContext.businessId,
        consumption.id,
      );
      if (existingReversal) {
        appError(409, errorCodes.conflict, "Processing consumption has already been reversed.", {
          processingRunId: run.id,
          consumptionMovementId: consumption.id,
          reversalMovementId: existingReversal.id,
        });
      }

      const batch = await tx.rawMaterialBatch.findFirst({
        where: { id: consumption.batchId, businessId: businessContext.businessId },
        include: { storageLocation: true },
      });

      if (!batch) appError(404, errorCodes.notFound, "Raw material input batch not found for processing reversal.");
      if (!batch.isActive) appError(400, errorCodes.validationError, "Inactive input batch cannot receive processing reversal quantity.");
      assertRawMaterialKgBatch(batch.unit);

      if (batch.storageLocationId !== consumption.sourceStorageLocationId) {
        appError(409, errorCodes.conflict, "Input batch storage changed after processing consumption. Move it back or apply a separate correction instead.", {
          processingRunId: run.id,
          consumptionMovementId: consumption.id,
          originalStorageLocationId: consumption.sourceStorageLocationId,
          currentStorageLocationId: batch.storageLocationId,
        });
      }

      const reversalQuantity = consumption.quantity;
      beforeQuantity = batch.remainingQuantity;
      afterQuantity = batch.remainingQuantity + reversalQuantity;
      beforeStorageUsedKg = batch.storageLocation.usedKg;
      afterStorageUsedKg = batch.storageLocation.usedKg + reversalQuantity;

      assertRawMaterialPositiveMovementQuantity(reversalQuantity, "Processing cancellation reversal quantity");
      assertRawMaterialQuantityRange({ afterQuantity, quantity: batch.quantity });
      assertRawMaterialStorageUsage({ nextUsedKg: afterStorageUsedKg, capacityKg: batch.storageLocation.capacityKg });

      await tx.rawMaterialBatch.update({
        where: { id: batch.id },
        data: { remainingQuantity: afterQuantity },
      });
      await tx.rawMaterialStorageLocation.update({
        where: { id: batch.storageLocationId },
        data: { usedKg: afterStorageUsedKg },
      });

      reversalMovementId = await createRawMaterialStockMovementRecord(tx, {
        businessId: businessContext.businessId,
        batchId: batch.id,
        sourceStorageLocationId: null,
        targetStorageLocationId: batch.storageLocationId,
        type: "CORRECTION",
        reason: "CORRECTION",
        source: "SYSTEM",
        sourceId: consumption.id,
        quantity: reversalQuantity,
        beforeQuantity,
        afterQuantity,
        note: `Reversal of processing consumption ${consumption.id}: ${note}`,
        createdById: actor.id,
      });
      const movementRow = await findRawMaterialStockMovementRowById(tx, businessContext.businessId, reversalMovementId);
      reversalMovement = movementRow ? toRawMaterialStockMovementDto(movementRow) : null;
    }

    const updatedRun = await tx.rawMaterialProcessingRun.update({
      where: { id: run.id },
      data: { status: RawMaterialProcessingStatus.CANCELLED },
      include: { inputBatch: true },
    });
    const processingRun = toRawMaterialProcessingRunDto(updatedRun);

    await writeRawMaterialAuditLog({
      businessId: businessContext.businessId,
      userId: actor.id,
      action: "UPDATE",
      entityType: "RawMaterialProcessingRun",
      entityId: run.id,
      changes: {
        operation: "cancel-processing-with-stock-reversal",
        input: { note },
        before: beforeProcessingRun,
        result: processingRun,
        stockReversal: consumptionRef
          ? {
              consumptionMovementId: consumptionRef.id,
              reversalMovementId,
              beforeQuantity,
              afterQuantity,
              beforeStorageUsedKg,
              afterStorageUsedKg,
            }
          : null,
      },
    }, tx);

    return {
      processingRun,
      reversalMovement,
      reversedStock: Boolean(reversalMovementId),
    };
  });
}
