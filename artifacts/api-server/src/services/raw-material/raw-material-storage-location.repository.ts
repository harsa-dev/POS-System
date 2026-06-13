import type { RawMaterialStorageLocation } from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/index.js";
import { prisma } from "../../lib/prisma.js";

export type RawMaterialStorageLocationRecordPayload = Readonly<{
  code: string;
  name: string;
  type: RawMaterialStorageLocation["type"];
  capacityKg: number;
  usedKg: number;
  temperatureCelsius: number | null;
  isActive?: boolean;
  notes: string | null;
}>;

export function buildRawMaterialStorageScope(businessContext: BusinessContext, id: string) {
  return {
    id,
    businessId: businessContext.businessId,
  };
}

export async function findRawMaterialStorageLocationById(businessContext: BusinessContext, id: string) {
  return prisma.rawMaterialStorageLocation.findFirst({
    where: buildRawMaterialStorageScope(businessContext, id),
  });
}

export async function findRawMaterialStorageCodeConflict(params: {
  businessContext: BusinessContext;
  code: string;
  excludeId?: string;
}) {
  return prisma.rawMaterialStorageLocation.findFirst({
    where: {
      businessId: params.businessContext.businessId,
      code: params.code,
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
    },
    select: { id: true },
  });
}

export async function listRawMaterialStorageLocationRows(params: {
  businessContext: BusinessContext;
  includeInactive?: boolean;
  search?: string;
}) {
  const trimmedSearch = params.search?.trim();

  return prisma.rawMaterialStorageLocation.findMany({
    where: {
      businessId: params.businessContext.businessId,
      ...(params.includeInactive ? {} : { isActive: true }),
      ...(trimmedSearch
        ? {
            OR: [
              { code: { contains: trimmedSearch, mode: "insensitive" } },
              { name: { contains: trimmedSearch, mode: "insensitive" } },
              { notes: { contains: trimmedSearch, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ isActive: "desc" }, { code: "asc" }],
  });
}

export async function createRawMaterialStorageLocationRecord(params: {
  businessContext: BusinessContext;
  payload: RawMaterialStorageLocationRecordPayload;
}) {
  const { businessContext, payload } = params;

  return prisma.rawMaterialStorageLocation.create({
    data: {
      businessId: businessContext.businessId,
      code: payload.code,
      name: payload.name,
      type: payload.type,
      capacityKg: payload.capacityKg,
      usedKg: payload.usedKg,
      temperatureCelsius: payload.temperatureCelsius,
      isActive: payload.isActive ?? true,
      notes: payload.notes,
    },
  });
}

export async function updateRawMaterialStorageLocationRecord(params: {
  id: string;
  payload: RawMaterialStorageLocationRecordPayload;
}) {
  const { id, payload } = params;

  return prisma.rawMaterialStorageLocation.update({
    where: { id },
    data: {
      code: payload.code,
      name: payload.name,
      type: payload.type,
      capacityKg: payload.capacityKg,
      usedKg: payload.usedKg,
      temperatureCelsius: payload.temperatureCelsius,
      ...(payload.isActive === undefined ? {} : { isActive: payload.isActive }),
      notes: payload.notes,
    },
  });
}

export async function deactivateRawMaterialStorageLocationRecord(id: string) {
  return prisma.rawMaterialStorageLocation.update({
    where: { id },
    data: { isActive: false },
  });
}
