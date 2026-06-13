import type { Prisma, RawMaterialProcessingStatus, Role } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../utils/errors.js";
import { toRawMaterialProcessingRunDto } from "./raw-material-processing-run.dto.js";
import type {
  RawMaterialProcessingRunDto,
  RawMaterialProcessingRunInput,
  RawMaterialProcessingRunQuery,
} from "./raw-material-processing-run.types.js";
import { validateRawMaterialProcessingRunInput } from "./raw-material-processing-run.validation.js";

const VIEW_ROLES: readonly Role[] = ["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF", "VIEWER"];
const MANAGE_ROLES: readonly Role[] = ["OWNER", "MANAGER", "ADMIN", "OPERATOR"];

function assertCanView(role: Role) {
  if (!VIEW_ROLES.includes(role)) throw new ForbiddenError("You cannot view raw material processing runs");
}

function assertCanManage(role: Role) {
  if (!MANAGE_ROLES.includes(role)) throw new ForbiddenError("You cannot manage raw material processing runs");
}

function normalizeSearch(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function buildWhere(businessId: string, query: RawMaterialProcessingRunQuery): Prisma.RawMaterialProcessingRunWhereInput {
  const search = normalizeSearch(query.search);

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

async function assertRunNumberAvailable(businessId: string, runNumber: string, ignoreId?: string) {
  const existing = await prisma.rawMaterialProcessingRun.findFirst({
    where: {
      businessId,
      runNumber,
      ...(ignoreId ? { id: { not: ignoreId } } : {}),
    },
    select: { id: true },
  });

  if (existing) throw new ValidationError("Processing run number already exists");
}

async function getInputBatchOrThrow(businessId: string, inputBatchId: string) {
  const batch = await prisma.rawMaterialBatch.findFirst({
    where: { id: inputBatchId, businessId },
    select: {
      id: true,
      quantity: true,
      remainingQuantity: true,
      qualityStatus: true,
      isActive: true,
    },
  });

  if (!batch) throw new NotFoundError("Input batch not found");
  if (!batch.isActive) throw new ValidationError("Input batch is inactive");
  if (batch.qualityStatus !== "ACCEPTED") throw new ValidationError("Input batch must be accepted before processing");

  return batch;
}

async function getProcessingRunOrThrow(businessId: string, id: string) {
  const run = await prisma.rawMaterialProcessingRun.findFirst({
    where: { id, businessId },
    include: { inputBatch: true },
  });

  if (!run) throw new NotFoundError("Processing run not found");
  return run;
}

export async function listRawMaterialProcessingRuns(
  businessId: string,
  role: Role,
  query: RawMaterialProcessingRunQuery = {},
): Promise<RawMaterialProcessingRunDto[]> {
  assertCanView(role);

  const runs = await prisma.rawMaterialProcessingRun.findMany({
    where: buildWhere(businessId, query),
    include: { inputBatch: true },
    orderBy: [{ createdAt: "desc" }, { runNumber: "asc" }],
  });

  return runs.map(toRawMaterialProcessingRunDto);
}

export async function createRawMaterialProcessingRun(
  businessId: string,
  role: Role,
  input: RawMaterialProcessingRunInput,
): Promise<RawMaterialProcessingRunDto> {
  assertCanManage(role);
  const data = validateRawMaterialProcessingRunInput(input, "create");

  if (!data.runNumber || !data.inputBatchId || !data.outputName || data.inputQuantity === undefined) {
    throw new ValidationError("Invalid processing run payload");
  }

  await assertRunNumberAvailable(businessId, data.runNumber);
  const batch = await getInputBatchOrThrow(businessId, data.inputBatchId);

  if (data.inputQuantity > batch.remainingQuantity) {
    throw new ValidationError("Input quantity cannot exceed remaining batch quantity");
  }

  const created = await prisma.rawMaterialProcessingRun.create({
    data: {
      businessId,
      runNumber: data.runNumber,
      inputBatchId: data.inputBatchId,
      outputName: data.outputName,
      inputQuantity: data.inputQuantity,
      outputQuantity: data.outputQuantity,
      byproductQuantity: data.byproductQuantity,
      wasteQuantity: data.wasteQuantity,
      status: data.status ?? "PLANNED",
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      notes: data.notes,
    },
    include: { inputBatch: true },
  });

  return toRawMaterialProcessingRunDto(created);
}

export async function updateRawMaterialProcessingRun(
  businessId: string,
  role: Role,
  id: string,
  input: RawMaterialProcessingRunInput,
): Promise<RawMaterialProcessingRunDto> {
  assertCanManage(role);
  const existing = await getProcessingRunOrThrow(businessId, id);
  const data = validateRawMaterialProcessingRunInput(input, "update");

  if (data.runNumber) await assertRunNumberAvailable(businessId, data.runNumber, id);

  const inputBatchId = data.inputBatchId ?? existing.inputBatchId;
  const inputQuantity = data.inputQuantity ?? existing.inputQuantity;
  const outputQuantity = data.outputQuantity ?? existing.outputQuantity;
  const byproductQuantity = data.byproductQuantity ?? existing.byproductQuantity;
  const wasteQuantity = data.wasteQuantity ?? existing.wasteQuantity;

  const batch = await getInputBatchOrThrow(businessId, inputBatchId);
  if (inputQuantity > batch.remainingQuantity && inputQuantity !== existing.inputQuantity) {
    throw new ValidationError("Input quantity cannot exceed remaining batch quantity");
  }
  if (outputQuantity + byproductQuantity + wasteQuantity > inputQuantity) {
    throw new ValidationError("Processing output cannot exceed input quantity");
  }

  const updateData: Prisma.RawMaterialProcessingRunUpdateInput = {
    ...(data.runNumber ? { runNumber: data.runNumber } : {}),
    ...(data.outputName ? { outputName: data.outputName } : {}),
    inputBatch: { connect: { id: inputBatchId } },
    inputQuantity,
    outputQuantity,
    byproductQuantity,
    wasteQuantity,
    ...(data.status ? { status: data.status } : {}),
    ...(input.startedAt !== undefined ? { startedAt: data.startedAt ?? null } : {}),
    ...(input.completedAt !== undefined ? { completedAt: data.completedAt ?? null } : {}),
    ...(input.notes !== undefined ? { notes: data.notes ?? null } : {}),
  };

  const updated = await prisma.rawMaterialProcessingRun.update({
    where: { id: existing.id },
    data: updateData,
    include: { inputBatch: true },
  });

  return toRawMaterialProcessingRunDto(updated);
}

export async function cancelRawMaterialProcessingRun(
  businessId: string,
  role: Role,
  id: string,
): Promise<RawMaterialProcessingRunDto> {
  assertCanManage(role);
  const existing = await getProcessingRunOrThrow(businessId, id);

  if (existing.status === "COMPLETED") {
    throw new ValidationError("Completed processing run cannot be cancelled");
  }

  const updated = await prisma.rawMaterialProcessingRun.update({
    where: { id: existing.id },
    data: { status: "CANCELLED" satisfies RawMaterialProcessingStatus },
    include: { inputBatch: true },
  });

  return toRawMaterialProcessingRunDto(updated);
}
