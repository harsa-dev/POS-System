import type { RawMaterialSupplier } from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/index.js";
import { prisma } from "../../lib/prisma.js";

export type RawMaterialSupplierRecordPayload = Readonly<{
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  category: RawMaterialSupplier["category"];
  reliabilityScore: number;
  leadTimeDays: number;
  isActive?: boolean;
  notes: string | null;
}>;

export function buildRawMaterialSupplierScope(businessContext: BusinessContext, id: string) {
  return {
    id,
    businessId: businessContext.businessId,
  };
}

export async function findRawMaterialSupplierById(businessContext: BusinessContext, id: string) {
  return prisma.rawMaterialSupplier.findFirst({
    where: buildRawMaterialSupplierScope(businessContext, id),
  });
}

export async function findRawMaterialSupplierNameConflict(params: {
  businessContext: BusinessContext;
  name: string;
  excludeId?: string;
}) {
  return prisma.rawMaterialSupplier.findFirst({
    where: {
      businessId: params.businessContext.businessId,
      name: params.name,
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
    },
    select: { id: true },
  });
}

export async function listRawMaterialSupplierRows(params: {
  businessContext: BusinessContext;
  includeInactive?: boolean;
  search?: string;
}) {
  const trimmedSearch = params.search?.trim();

  return prisma.rawMaterialSupplier.findMany({
    where: {
      businessId: params.businessContext.businessId,
      ...(params.includeInactive ? {} : { isActive: true }),
      ...(trimmedSearch
        ? {
            OR: [
              { name: { contains: trimmedSearch, mode: "insensitive" } },
              { contactPerson: { contains: trimmedSearch, mode: "insensitive" } },
              { phone: { contains: trimmedSearch, mode: "insensitive" } },
              { email: { contains: trimmedSearch, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
}

export async function createRawMaterialSupplierRecord(params: {
  businessContext: BusinessContext;
  payload: RawMaterialSupplierRecordPayload;
}) {
  const { businessContext, payload } = params;

  return prisma.rawMaterialSupplier.create({
    data: {
      businessId: businessContext.businessId,
      name: payload.name,
      contactPerson: payload.contactPerson,
      phone: payload.phone,
      email: payload.email,
      address: payload.address,
      category: payload.category,
      reliabilityScore: payload.reliabilityScore,
      leadTimeDays: payload.leadTimeDays,
      isActive: payload.isActive ?? true,
      notes: payload.notes,
    },
  });
}

export async function updateRawMaterialSupplierRecord(params: {
  id: string;
  payload: RawMaterialSupplierRecordPayload;
}) {
  const { id, payload } = params;

  return prisma.rawMaterialSupplier.update({
    where: { id },
    data: {
      name: payload.name,
      contactPerson: payload.contactPerson,
      phone: payload.phone,
      email: payload.email,
      address: payload.address,
      category: payload.category,
      reliabilityScore: payload.reliabilityScore,
      leadTimeDays: payload.leadTimeDays,
      ...(payload.isActive === undefined ? {} : { isActive: payload.isActive }),
      notes: payload.notes,
    },
  });
}

export async function deactivateRawMaterialSupplierRecord(id: string) {
  return prisma.rawMaterialSupplier.update({
    where: { id },
    data: { isActive: false },
  });
}
