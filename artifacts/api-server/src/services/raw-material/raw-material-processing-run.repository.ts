import { Prisma, RawMaterialProcessingStatus, type RawMaterialProcessingRun } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import type { RawMaterialProcessingRunQuery } from "./raw-material-processing-run.types.js";

export type RawMaterialProcessingInputBatchForMutation = Readonly<{
  id: string;
  remainingQuantity: number;
  qualityStatus: string;
  isActive: boolean;
}>;

export type RawMaterialProcessingRunWithInputBatch = Prisma.RawMaterialProcessingRunGetPayload<{
  include: { inputBatch: true };
}>;

export type RawMaterialProcessingRunCreateData = Readonly<{
  businessId: string;
  runNumber: string;
  inputBatchId: string;
  outputName: string;
  inputQuantity: number;
  outputQuantity?: number;
  byproductQuantity?: number;
  wasteQuantity?: number;
  status: RawMaterialProcessingStatus;
  startedAt?: Date;
  completedAt?: Date;
  notes?: string | null;
}>;

export type RawMaterialProcessingRunUpdateData = Readonly<{
  id: string;
  runNumber?: string;
  inputBatchId: string;
  outputName?: string;
  inputQuantity: number;
  outputQuantity: number;
  byproductQuantity: number;
  wasteQuantity: number;
  status: RawMaterialProcessingStatus;
  startedAt?: Date | null;
  completedAt?: Date | null;
  notes?: string | null;
  updateStartedAt: boolean;
  updateCompletedAt: boolean;
  updateNotes: boolean;
}>;

function buildProcessingRunWhere(
  businessId: string,
  query: RawMaterialProcessingRunQuery,
): Prisma.RawMaterialProcessingRunWhereInput {
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

export async function listRawMaterialProcessingRunRows(params: {
  businessId: string;
  query: RawMaterialProcessingRunQuery;
}) {
  return prisma.rawMaterialProcessingRun.findMany({
    where: buildProcessingRunWhere(params.businessId, params.query),
    include: { inputBatch: true },
    orderBy: [{ createdAt: "desc" }, { runNumber: "asc" }],
  });
}

export async function findRawMaterialProcessingRunById(params: {
  businessId: string;
  id: string;
}): Promise<RawMaterialProcessingRunWithInputBatch | null> {
  return prisma.rawMaterialProcessingRun.findFirst({
    where: {
      id: params.id,
      businessId: params.businessId,
    },
    include: { inputBatch: true },
  });
}

export async function findRawMaterialProcessingRunNumberConflict(params: {
  businessId: string;
  runNumber: string;
  excludeId?: string;
}): Promise<Pick<RawMaterialProcessingRun, "id"> | null> {
  return prisma.rawMaterialProcessingRun.findFirst({
    where: {
      businessId: params.businessId,
      runNumber: params.runNumber,
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
    },
    select: { id: true },
  });
}

export async function loadRawMaterialProcessingInputBatch(params: {
  businessId: string;
  inputBatchId: string;
}): Promise<RawMaterialProcessingInputBatchForMutation | null> {
  return prisma.rawMaterialBatch.findFirst({
    where: {
      id: params.inputBatchId,
      businessId: params.businessId,
    },
    select: {
      id: true,
      remainingQuantity: true,
      qualityStatus: true,
      isActive: true,
    },
  });
}

export async function createRawMaterialProcessingRunRecord(data: RawMaterialProcessingRunCreateData) {
  return prisma.rawMaterialProcessingRun.create({
    data: {
      businessId: data.businessId,
      runNumber: data.runNumber,
      inputBatchId: data.inputBatchId,
      outputName: data.outputName,
      inputQuantity: data.inputQuantity,
      outputQuantity: data.outputQuantity,
      byproductQuantity: data.byproductQuantity,
      wasteQuantity: data.wasteQuantity,
      status: data.status,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      notes: data.notes,
    },
    include: { inputBatch: true },
  });
}

export async function updateRawMaterialProcessingRunRecord(data: RawMaterialProcessingRunUpdateData) {
  return prisma.rawMaterialProcessingRun.update({
    where: { id: data.id },
    data: {
      ...(data.runNumber ? { runNumber: data.runNumber } : {}),
      ...(data.outputName ? { outputName: data.outputName } : {}),
      inputBatch: { connect: { id: data.inputBatchId } },
      inputQuantity: data.inputQuantity,
      outputQuantity: data.outputQuantity,
      byproductQuantity: data.byproductQuantity,
      wasteQuantity: data.wasteQuantity,
      status: data.status,
      ...(data.updateStartedAt ? { startedAt: data.startedAt ?? null } : {}),
      ...(data.updateCompletedAt ? { completedAt: data.completedAt ?? null } : {}),
      ...(data.updateNotes ? { notes: data.notes ?? null } : {}),
    },
    include: { inputBatch: true },
  });
}

export async function cancelRawMaterialProcessingRunRecord(id: string) {
  return prisma.rawMaterialProcessingRun.update({
    where: { id },
    data: { status: RawMaterialProcessingStatus.CANCELLED },
    include: { inputBatch: true },
  });
}
