import type { Prisma } from "@prisma/client";
import { RawMaterialBatchQualityStatus } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import type {
  NormalizedRawMaterialBatchPayload,
  RawMaterialBatchQuery,
  RawMaterialBatchUpdatePayload,
} from "./raw-material-batch.types.js";

export function getRawMaterialBatchInclude() {
  return {
    intake: {
      select: {
        referenceNumber: true,
        materialName: true,
      },
    },
    storageLocation: {
      select: {
        code: true,
        name: true,
      },
    },
  } satisfies Prisma.RawMaterialBatchInclude;
}

export function findRawMaterialBatchLotConflict(params: {
  businessId: string;
  lotCode: string;
  currentBatchId?: string;
}) {
  return prisma.rawMaterialBatch.findFirst({
    where: {
      businessId: params.businessId,
      lotCode: params.lotCode,
      ...(params.currentBatchId ? { id: { not: params.currentBatchId } } : {}),
    },
    select: { id: true },
  });
}

export function loadRawMaterialIntakeForBatch(businessId: string, intakeId: string) {
  return prisma.rawMaterialIntake.findFirst({
    where: {
      id: intakeId,
      businessId,
    },
    select: {
      id: true,
      materialName: true,
      unit: true,
      acceptedQuantity: true,
      qualityStatus: true,
    },
  });
}

export function loadRawMaterialStorageLocationForBatch(
  businessId: string,
  storageLocationId: string,
) {
  return prisma.rawMaterialStorageLocation.findFirst({
    where: {
      id: storageLocationId,
      businessId,
      isActive: true,
    },
    select: {
      id: true,
      code: true,
      capacityKg: true,
      usedKg: true,
    },
  });
}

export async function sumActiveRawMaterialBatchQuantityForIntake(params: {
  businessId: string;
  intakeId: string;
  currentBatchId?: string;
}) {
  const aggregate = await prisma.rawMaterialBatch.aggregate({
    where: {
      businessId: params.businessId,
      intakeId: params.intakeId,
      isActive: true,
      ...(params.currentBatchId ? { id: { not: params.currentBatchId } } : {}),
    },
    _sum: {
      quantity: true,
    },
  });

  return aggregate._sum.quantity ?? 0;
}

export function listRawMaterialBatchRows(businessId: string, query: RawMaterialBatchQuery = {}) {
  const where: Prisma.RawMaterialBatchWhereInput = {
    businessId,
    ...(query.intakeId ? { intakeId: query.intakeId } : {}),
    ...(query.storageLocationId ? { storageLocationId: query.storageLocationId } : {}),
    ...(query.qualityStatus ? { qualityStatus: query.qualityStatus } : {}),
    ...(typeof query.isActive === "boolean" ? { isActive: query.isActive } : {}),
    ...(query.search
      ? {
          OR: [
            { lotCode: { contains: query.search, mode: "insensitive" } },
            { materialName: { contains: query.search, mode: "insensitive" } },
            { notes: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return prisma.rawMaterialBatch.findMany({
    where,
    include: getRawMaterialBatchInclude(),
    orderBy: [
      { isActive: "desc" },
      { expiryDate: "asc" },
      { createdAt: "desc" },
    ],
  });
}

export function createRawMaterialBatchRecord(
  businessId: string,
  payload: NormalizedRawMaterialBatchPayload,
) {
  return prisma.rawMaterialBatch.create({
    data: {
      businessId,
      lotCode: payload.lotCode,
      intakeId: payload.intakeId,
      storageLocationId: payload.storageLocationId,
      materialName: payload.materialName,
      unit: payload.unit,
      quantity: payload.quantity,
      remainingQuantity: payload.remainingQuantity,
      qualityStatus: payload.qualityStatus,
      expiryDate: payload.expiryDate,
      isActive: payload.isActive,
      notes: payload.notes,
    },
    include: getRawMaterialBatchInclude(),
  });
}

export function findRawMaterialBatchById(businessId: string, id: string) {
  return prisma.rawMaterialBatch.findFirst({
    where: {
      id,
      businessId,
    },
    include: getRawMaterialBatchInclude(),
  });
}

export function updateRawMaterialBatchRecord(
  id: string,
  payload: RawMaterialBatchUpdatePayload,
) {
  return prisma.rawMaterialBatch.update({
    where: { id },
    data: {
      ...(payload.lotCode !== undefined ? { lotCode: payload.lotCode } : {}),
      ...(payload.intakeId !== undefined ? { intakeId: payload.intakeId } : {}),
      ...(payload.storageLocationId !== undefined ? { storageLocationId: payload.storageLocationId } : {}),
      ...(payload.materialName !== undefined ? { materialName: payload.materialName } : {}),
      ...(payload.unit !== undefined ? { unit: payload.unit } : {}),
      ...(payload.quantity !== undefined ? { quantity: payload.quantity } : {}),
      ...(payload.remainingQuantity !== undefined ? { remainingQuantity: payload.remainingQuantity } : {}),
      ...(payload.qualityStatus !== undefined ? { qualityStatus: payload.qualityStatus } : {}),
      ...(payload.expiryDate !== undefined ? { expiryDate: payload.expiryDate } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
    },
    include: getRawMaterialBatchInclude(),
  });
}

export function deactivateRawMaterialBatchRecord(id: string) {
  return prisma.rawMaterialBatch.update({
    where: { id },
    data: {
      isActive: false,
      qualityStatus: RawMaterialBatchQualityStatus.QUARANTINED,
    },
    include: getRawMaterialBatchInclude(),
  });
}
