import { Prisma, RawMaterialBatchQualityStatus, RawMaterialIntakeStatus, Role } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import type { AuthenticatedUser } from "../../types/auth";
import { toRawMaterialBatchDto } from "./raw-material-batch.dto";
import type { RawMaterialBatchPayload, RawMaterialBatchQuery } from "./raw-material-batch.types";
import {
  assertRawMaterialBatchQuantityShape,
  normalizeRawMaterialBatchPayload,
  normalizeRawMaterialBatchUpdatePayload,
} from "./raw-material-batch.validation";

const viewRoles = new Set<Role>([
  Role.OWNER,
  Role.MANAGER,
  Role.ADMIN,
  Role.OPERATOR,
  Role.STAFF,
  Role.VIEWER,
]);

const manageRoles = new Set<Role>([
  Role.OWNER,
  Role.MANAGER,
  Role.ADMIN,
  Role.OPERATOR,
]);

function assertBusinessAccess(user: AuthenticatedUser): string {
  if (!user.businessId) {
    throw new Error("Business context is required");
  }

  return user.businessId;
}

function assertCanView(user: AuthenticatedUser) {
  if (!viewRoles.has(user.role)) {
    throw new Error("You are not allowed to view raw material batches");
  }
}

function assertCanManage(user: AuthenticatedUser) {
  if (!manageRoles.has(user.role)) {
    throw new Error("You are not allowed to manage raw material batches");
  }
}

function getBatchInclude() {
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

async function assertUniqueLotCode(
  businessId: string,
  lotCode: string,
  currentBatchId?: string,
) {
  const existing = await prisma.rawMaterialBatch.findFirst({
    where: {
      businessId,
      lotCode,
      ...(currentBatchId ? { id: { not: currentBatchId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Raw material batch lot code already exists");
  }
}

async function assertValidIntake(businessId: string, intakeId: string) {
  const intake = await prisma.rawMaterialIntake.findFirst({
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

  if (!intake) {
    throw new Error("Raw material intake was not found");
  }

  if (intake.qualityStatus === RawMaterialIntakeStatus.CANCELLED) {
    throw new Error("Cannot create batch from cancelled intake");
  }

  return intake;
}

async function assertValidStorageLocation(businessId: string, storageLocationId: string) {
  const storageLocation = await prisma.rawMaterialStorageLocation.findFirst({
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

  if (!storageLocation) {
    throw new Error("Raw material storage location was not found or inactive");
  }

  return storageLocation;
}

async function assertBatchQuantityWithinIntake(
  businessId: string,
  intakeId: string,
  quantity: number,
  currentBatchId?: string,
) {
  const aggregate = await prisma.rawMaterialBatch.aggregate({
    where: {
      businessId,
      intakeId,
      isActive: true,
      ...(currentBatchId ? { id: { not: currentBatchId } } : {}),
    },
    _sum: {
      quantity: true,
    },
  });

  const intake = await assertValidIntake(businessId, intakeId);
  const existingBatchQuantity = aggregate._sum.quantity ?? 0;
  const nextTotal = existingBatchQuantity + quantity;

  if (nextTotal > intake.acceptedQuantity) {
    throw new Error("Batch quantity cannot exceed accepted intake quantity");
  }

  return intake;
}

export async function listRawMaterialBatches(user: AuthenticatedUser, query: RawMaterialBatchQuery = {}) {
  assertCanView(user);
  const businessId = assertBusinessAccess(user);

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

  const batches = await prisma.rawMaterialBatch.findMany({
    where,
    include: getBatchInclude(),
    orderBy: [
      { isActive: "desc" },
      { expiryDate: "asc" },
      { createdAt: "desc" },
    ],
  });

  return batches.map(toRawMaterialBatchDto);
}

export async function createRawMaterialBatch(user: AuthenticatedUser, payload: RawMaterialBatchPayload) {
  assertCanManage(user);
  const businessId = assertBusinessAccess(user);
  const normalized = normalizeRawMaterialBatchPayload(payload);

  await assertUniqueLotCode(businessId, normalized.lotCode);
  await assertValidStorageLocation(businessId, normalized.storageLocationId);
  const intake = await assertBatchQuantityWithinIntake(
    businessId,
    normalized.intakeId,
    normalized.quantity,
  );

  if (normalized.unit !== intake.unit) {
    throw new Error("Batch unit must match intake unit");
  }

  const batch = await prisma.rawMaterialBatch.create({
    data: {
      businessId,
      lotCode: normalized.lotCode,
      intakeId: normalized.intakeId,
      storageLocationId: normalized.storageLocationId,
      materialName: normalized.materialName,
      unit: normalized.unit,
      quantity: normalized.quantity,
      remainingQuantity: normalized.remainingQuantity,
      qualityStatus: normalized.qualityStatus,
      expiryDate: normalized.expiryDate,
      isActive: normalized.isActive,
      notes: normalized.notes,
    },
    include: getBatchInclude(),
  });

  return toRawMaterialBatchDto(batch);
}

export async function updateRawMaterialBatch(
  user: AuthenticatedUser,
  batchId: string,
  payload: RawMaterialBatchPayload,
) {
  assertCanManage(user);
  const businessId = assertBusinessAccess(user);
  const existing = await prisma.rawMaterialBatch.findFirst({
    where: {
      id: batchId,
      businessId,
    },
    include: getBatchInclude(),
  });

  if (!existing) {
    throw new Error("Raw material batch was not found");
  }

  const normalized = normalizeRawMaterialBatchUpdatePayload(payload);
  const nextLotCode = normalized.lotCode ?? existing.lotCode;
  const nextIntakeId = normalized.intakeId ?? existing.intakeId;
  const nextStorageLocationId = normalized.storageLocationId ?? existing.storageLocationId;
  const nextQuantity = normalized.quantity ?? existing.quantity;
  const nextRemainingQuantity = normalized.remainingQuantity ?? existing.remainingQuantity;
  const nextUnit = normalized.unit ?? existing.unit;

  await assertUniqueLotCode(businessId, nextLotCode, batchId);
  await assertValidStorageLocation(businessId, nextStorageLocationId);
  const intake = await assertBatchQuantityWithinIntake(
    businessId,
    nextIntakeId,
    nextQuantity,
    batchId,
  );

  if (nextUnit !== intake.unit) {
    throw new Error("Batch unit must match intake unit");
  }

  assertRawMaterialBatchQuantityShape(nextQuantity, nextRemainingQuantity);

  const updated = await prisma.rawMaterialBatch.update({
    where: { id: existing.id },
    data: {
      ...(normalized.lotCode !== undefined ? { lotCode: normalized.lotCode } : {}),
      ...(normalized.intakeId !== undefined ? { intakeId: normalized.intakeId } : {}),
      ...(normalized.storageLocationId !== undefined ? { storageLocationId: normalized.storageLocationId } : {}),
      ...(normalized.materialName !== undefined ? { materialName: normalized.materialName } : {}),
      ...(normalized.unit !== undefined ? { unit: normalized.unit } : {}),
      ...(normalized.quantity !== undefined ? { quantity: normalized.quantity } : {}),
      ...(normalized.remainingQuantity !== undefined ? { remainingQuantity: normalized.remainingQuantity } : {}),
      ...(normalized.qualityStatus !== undefined ? { qualityStatus: normalized.qualityStatus } : {}),
      ...(normalized.expiryDate !== undefined ? { expiryDate: normalized.expiryDate } : {}),
      ...(normalized.isActive !== undefined ? { isActive: normalized.isActive } : {}),
      ...(normalized.notes !== undefined ? { notes: normalized.notes } : {}),
    },
    include: getBatchInclude(),
  });

  return toRawMaterialBatchDto(updated);
}

export async function deactivateRawMaterialBatch(user: AuthenticatedUser, batchId: string) {
  assertCanManage(user);
  const businessId = assertBusinessAccess(user);
  const existing = await prisma.rawMaterialBatch.findFirst({
    where: {
      id: batchId,
      businessId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Raw material batch was not found");
  }

  const updated = await prisma.rawMaterialBatch.update({
    where: { id: existing.id },
    data: {
      isActive: false,
      qualityStatus: RawMaterialBatchQualityStatus.QUARANTINED,
    },
    include: getBatchInclude(),
  });

  return toRawMaterialBatchDto(updated);
}
