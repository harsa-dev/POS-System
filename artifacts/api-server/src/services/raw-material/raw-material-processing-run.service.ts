import { Prisma, RawMaterialProcessingStatus, Role } from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/index.js";
import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import { prisma } from "../../lib/prisma.js";
import { toRawMaterialProcessingRunDto } from "./raw-material-processing-run.dto.js";
import type {
  RawMaterialProcessingRunInput,
  RawMaterialProcessingRunQuery,
} from "./raw-material-processing-run.types.js";
import type { RawMaterialActor } from "./raw-material-supplier.types.js";
import { validateRawMaterialProcessingRunInput } from "./raw-material-processing-run.validation.js";
import {
  assertRawMaterialBatchAcceptedForProcessing,
  assertRawMaterialProcessingInitialStatus,
  assertRawMaterialProcessingOutputWithinInput,
  assertRawMaterialProcessingStatusTransition,
} from "./raw-material.workflow.js";

const viewRoles = new Set<Role>([Role.OWNER, Role.MANAGER, Role.ADMIN, Role.OPERATOR, Role.STAFF, Role.VIEWER]);
const manageRoles = new Set<Role>([Role.OWNER, Role.MANAGER, Role.ADMIN, Role.OPERATOR]);

function appError(statusCode: number, code: string, message: string, details?: Record<string, unknown>): never {
  throw new AppError({ statusCode, code, message, details });
}

function assertCanView(actor: RawMaterialActor) {
  if (viewRoles.has(actor.role)) return;
  appError(403, errorCodes.forbidden, "You do not have permission to view raw material processing runs.");
}

function assertCanManage(actor: RawMaterialActor) {
  if (manageRoles.has(actor.role)) return;
  appError(403, errorCodes.forbidden, "You do not have permission to manage raw material processing runs.");
}

function buildWhere(businessId: string, query: RawMaterialProcessingRunQuery): Prisma.RawMaterialProcessingRunWhereInput {
  const search = query.search?.trim();

  return {
    businessId,
    ...(query.inputBatchId ? { inputBatchId: query.inputBatchId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(search
      ? {
          OR: [
            { runNumber: { contains: search, mode: "insensitive" } },
            { outputName: { contains: search, mode: "insensitive" } },
            { notes: { contains: search, mode: "insensitive" } },
            { inputBatch: { lotCode: { contains: search, mode: "insensitive" } } },
            { inputBatch: { materialName: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

async function assertRunNumberAvailable(params: {
  businessContext: BusinessContext;
  runNumber: string;
  excludeId?: string;
}) {
  const duplicate = await prisma.rawMaterialProcessingRun.findFirst({
    where: {
      businessId: params.businessContext.businessId,
      runNumber: params.runNumber,
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
    },
    select: { id: true },
  });

  if (!duplicate) return;
  appError(409, errorCodes.conflict, "Raw material processing run number already exists.", {
    runNumber: params.runNumber,
  });
}

async function loadInputBatchOrThrow(businessContext: BusinessContext, inputBatchId: string) {
  const batch = await prisma.rawMaterialBatch.findFirst({
    where: {
      id: inputBatchId,
      businessId: businessContext.businessId,
    },
    select: {
      id: true,
      remainingQuantity: true,
      qualityStatus: true,
      isActive: true,
    },
  });

  if (!batch) appError(404, errorCodes.notFound, "Raw material input batch not found.");
  assertRawMaterialBatchAcceptedForProcessing(batch);

  return batch;
}

async function loadProcessingRunOrThrow(businessContext: BusinessContext, id: string) {
  const run = await prisma.rawMaterialProcessingRun.findFirst({
    where: {
      id,
      businessId: businessContext.businessId,
    },
    include: { inputBatch: true },
  });

  if (!run) appError(404, errorCodes.notFound, "Raw material processing run not found.");
  return run;
}

export async function listRawMaterialProcessingRuns(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  inputBatchId?: string;
  status?: RawMaterialProcessingStatus | string;
  search?: string;
}) {
  const { actor, businessContext } = params;
  assertCanView(actor);

  const status = typeof params.status === "string"
    ? (params.status.toUpperCase() as RawMaterialProcessingStatus)
    : params.status;

  const runs = await prisma.rawMaterialProcessingRun.findMany({
    where: buildWhere(businessContext.businessId, {
      inputBatchId: params.inputBatchId,
      status,
      search: params.search,
    }),
    include: { inputBatch: true },
    orderBy: [{ createdAt: "desc" }, { runNumber: "asc" }],
  });

  return runs.map(toRawMaterialProcessingRunDto);
}

export async function createRawMaterialProcessingRun(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  input: RawMaterialProcessingRunInput;
}) {
  const { actor, businessContext, input } = params;
  assertCanManage(actor);
  const data = validateRawMaterialProcessingRunInput(input, "create");

  if (!data.runNumber || !data.inputBatchId || !data.outputName || data.inputQuantity === undefined) {
    appError(400, errorCodes.validationError, "Invalid raw material processing run payload.");
  }

  await assertRunNumberAvailable({ businessContext, runNumber: data.runNumber });
  const batch = await loadInputBatchOrThrow(businessContext, data.inputBatchId);

  if (data.inputQuantity > batch.remainingQuantity) {
    appError(400, errorCodes.validationError, "Input quantity cannot exceed remaining batch quantity.");
  }

  const nextStatus = data.status ?? RawMaterialProcessingStatus.PLANNED;
  assertRawMaterialProcessingInitialStatus(nextStatus);
  assertRawMaterialProcessingOutputWithinInput({
    inputQuantity: data.inputQuantity,
    outputQuantity: data.outputQuantity,
    byproductQuantity: data.byproductQuantity,
    wasteQuantity: data.wasteQuantity,
  });

  const run = await prisma.rawMaterialProcessingRun.create({
    data: {
      businessId: businessContext.businessId,
      runNumber: data.runNumber,
      inputBatchId: data.inputBatchId,
      outputName: data.outputName,
      inputQuantity: data.inputQuantity,
      outputQuantity: data.outputQuantity,
      byproductQuantity: data.byproductQuantity,
      wasteQuantity: data.wasteQuantity,
      status: nextStatus,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      notes: data.notes,
    },
    include: { inputBatch: true },
  });

  return toRawMaterialProcessingRunDto(run);
}

export async function updateRawMaterialProcessingRun(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  id: string;
  input: RawMaterialProcessingRunInput;
}) {
  const { actor, businessContext, id, input } = params;
  assertCanManage(actor);

  const existing = await loadProcessingRunOrThrow(businessContext, id);
  const data = validateRawMaterialProcessingRunInput(input, "update");

  if (data.runNumber) {
    await assertRunNumberAvailable({ businessContext, runNumber: data.runNumber, excludeId: id });
  }

  const inputBatchId = data.inputBatchId ?? existing.inputBatchId;
  const inputQuantity = data.inputQuantity ?? existing.inputQuantity;
  const outputQuantity = data.outputQuantity ?? existing.outputQuantity;
  const byproductQuantity = data.byproductQuantity ?? existing.byproductQuantity;
  const wasteQuantity = data.wasteQuantity ?? existing.wasteQuantity;
  const nextStatus = data.status ?? existing.status;

  assertRawMaterialProcessingStatusTransition({
    currentStatus: existing.status,
    nextStatus,
  });
  assertRawMaterialProcessingOutputWithinInput({
    inputQuantity,
    outputQuantity,
    byproductQuantity,
    wasteQuantity,
  });

  const batch = await loadInputBatchOrThrow(businessContext, inputBatchId);
  if (inputQuantity > batch.remainingQuantity && inputQuantity !== existing.inputQuantity) {
    appError(400, errorCodes.validationError, "Input quantity cannot exceed remaining batch quantity.");
  }

  const updated = await prisma.rawMaterialProcessingRun.update({
    where: { id: existing.id },
    data: {
      ...(data.runNumber ? { runNumber: data.runNumber } : {}),
      ...(data.outputName ? { outputName: data.outputName } : {}),
      inputBatch: { connect: { id: inputBatchId } },
      inputQuantity,
      outputQuantity,
      byproductQuantity,
      wasteQuantity,
      status: nextStatus,
      ...(input.startedAt !== undefined ? { startedAt: data.startedAt ?? null } : {}),
      ...(input.completedAt !== undefined ? { completedAt: data.completedAt ?? null } : {}),
      ...(input.notes !== undefined ? { notes: data.notes ?? null } : {}),
    },
    include: { inputBatch: true },
  });

  return toRawMaterialProcessingRunDto(updated);
}

export async function cancelRawMaterialProcessingRun(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  id: string;
}) {
  const { actor, businessContext, id } = params;
  assertCanManage(actor);

  const existing = await loadProcessingRunOrThrow(businessContext, id);
  assertRawMaterialProcessingStatusTransition({
    currentStatus: existing.status,
    nextStatus: RawMaterialProcessingStatus.CANCELLED,
  });

  const updated = await prisma.rawMaterialProcessingRun.update({
    where: { id: existing.id },
    data: { status: RawMaterialProcessingStatus.CANCELLED },
    include: { inputBatch: true },
  });

  return toRawMaterialProcessingRunDto(updated);
}
