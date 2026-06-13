import type { Prisma, RawMaterialIntakeStatus, RawMaterialUnit } from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/index.js";
import { prisma } from "../../lib/prisma.js";

export const rawMaterialIntakeInclude = {
  supplier: { select: { id: true, name: true } },
  targetStorageLocation: { select: { id: true, code: true } },
} satisfies Prisma.RawMaterialIntakeInclude;

export type RawMaterialIntakeRecordPayload = Readonly<{
  referenceNumber: string;
  supplierId: string;
  targetStorageLocationId: string;
  materialName: string;
  unit: RawMaterialUnit;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  qualityStatus: RawMaterialIntakeStatus;
  receivedAt: Date;
  notes: string | null;
}>;

export function getRawMaterialIntakeWhere(businessContext: BusinessContext, id: string) {
  return {
    id,
    businessId: businessContext.businessId,
  } satisfies Prisma.RawMaterialIntakeWhereInput;
}

export function findRawMaterialIntakeById(businessContext: BusinessContext, id: string) {
  return prisma.rawMaterialIntake.findFirst({
    where: getRawMaterialIntakeWhere(businessContext, id),
    include: rawMaterialIntakeInclude,
  });
}

export function findRawMaterialIntakeReferenceConflict(params: {
  businessContext: BusinessContext;
  referenceNumber: string;
  excludeId?: string;
}) {
  return prisma.rawMaterialIntake.findFirst({
    where: {
      businessId: params.businessContext.businessId,
      referenceNumber: params.referenceNumber,
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
    },
    select: { id: true },
  });
}

export function findActiveRawMaterialSupplier(businessContext: BusinessContext, supplierId: string) {
  return prisma.rawMaterialSupplier.findFirst({
    where: {
      id: supplierId,
      businessId: businessContext.businessId,
      isActive: true,
    },
    select: { id: true },
  });
}

export function findActiveRawMaterialStorageLocation(
  businessContext: BusinessContext,
  targetStorageLocationId: string,
) {
  return prisma.rawMaterialStorageLocation.findFirst({
    where: {
      id: targetStorageLocationId,
      businessId: businessContext.businessId,
      isActive: true,
    },
    select: { id: true },
  });
}

export function listRawMaterialIntakeRows(params: {
  businessContext: BusinessContext;
  status?: RawMaterialIntakeStatus;
  supplierId?: string;
  targetStorageLocationId?: string;
  search?: string;
}) {
  const trimmedSearch = params.search?.trim();

  return prisma.rawMaterialIntake.findMany({
    where: {
      businessId: params.businessContext.businessId,
      ...(params.status ? { qualityStatus: params.status } : {}),
      ...(params.supplierId ? { supplierId: params.supplierId } : {}),
      ...(params.targetStorageLocationId ? { targetStorageLocationId: params.targetStorageLocationId } : {}),
      ...(trimmedSearch
        ? {
            OR: [
              { referenceNumber: { contains: trimmedSearch, mode: "insensitive" } },
              { materialName: { contains: trimmedSearch, mode: "insensitive" } },
              { notes: { contains: trimmedSearch, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: rawMaterialIntakeInclude,
    orderBy: [{ receivedAt: "desc" }, { createdAt: "desc" }],
  });
}

export function createRawMaterialIntakeRecord(
  businessContext: BusinessContext,
  payload: RawMaterialIntakeRecordPayload,
) {
  return prisma.rawMaterialIntake.create({
    data: {
      businessId: businessContext.businessId,
      referenceNumber: payload.referenceNumber,
      supplierId: payload.supplierId,
      targetStorageLocationId: payload.targetStorageLocationId,
      materialName: payload.materialName,
      unit: payload.unit,
      receivedQuantity: payload.receivedQuantity,
      acceptedQuantity: payload.acceptedQuantity,
      rejectedQuantity: payload.rejectedQuantity,
      qualityStatus: payload.qualityStatus,
      receivedAt: payload.receivedAt,
      notes: payload.notes,
    },
    include: rawMaterialIntakeInclude,
  });
}

export function updateRawMaterialIntakeRecord(id: string, payload: RawMaterialIntakeRecordPayload) {
  return prisma.rawMaterialIntake.update({
    where: { id },
    data: {
      referenceNumber: payload.referenceNumber,
      supplierId: payload.supplierId,
      targetStorageLocationId: payload.targetStorageLocationId,
      materialName: payload.materialName,
      unit: payload.unit,
      receivedQuantity: payload.receivedQuantity,
      acceptedQuantity: payload.acceptedQuantity,
      rejectedQuantity: payload.rejectedQuantity,
      qualityStatus: payload.qualityStatus,
      receivedAt: payload.receivedAt,
      notes: payload.notes,
    },
    include: rawMaterialIntakeInclude,
  });
}

export function cancelRawMaterialIntakeRecord(id: string) {
  return prisma.rawMaterialIntake.update({
    where: { id },
    data: { qualityStatus: "CANCELLED" },
    include: rawMaterialIntakeInclude,
  });
}
