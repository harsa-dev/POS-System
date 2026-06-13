import type { Prisma } from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/index.js";
import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import { prisma } from "../../lib/prisma.js";
import { toRawMaterialSupplierDto } from "./raw-material-supplier.dto.js";
import type { RawMaterialActor } from "./raw-material-supplier.types.js";
import {
  parseIntegerRange,
  parseOptionalBoolean,
  parseOptionalString,
  parseRequiredString,
  parseSupplierCategory,
} from "./raw-material-supplier.validation.js";

type SupplierMutationInput = Record<string, unknown>;

function assertCanManageRawMaterialSuppliers(actor: RawMaterialActor) {
  if (["OWNER", "MANAGER", "ADMIN", "OPERATOR"].includes(actor.role)) return;

  throw new AppError({
    statusCode: 403,
    code: errorCodes.forbidden,
    message: "You do not have permission to manage raw material suppliers.",
  });
}

function assertCanViewRawMaterialSuppliers(actor: RawMaterialActor) {
  if (["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF", "VIEWER"].includes(actor.role)) return;

  throw new AppError({
    statusCode: 403,
    code: errorCodes.forbidden,
    message: "You do not have permission to view raw material suppliers.",
  });
}

function getSupplierWhere(businessContext: BusinessContext, id: string) {
  return {
    id,
    businessId: businessContext.businessId,
  } satisfies Prisma.RawMaterialSupplierWhereInput;
}

async function loadSupplierOrThrow(businessContext: BusinessContext, id: string) {
  const supplier = await prisma.rawMaterialSupplier.findFirst({
    where: getSupplierWhere(businessContext, id),
  });

  if (!supplier) {
    throw new AppError({
      statusCode: 404,
      code: errorCodes.notFound,
      message: "Raw material supplier not found.",
    });
  }

  return supplier;
}

async function assertSupplierNameAvailable(params: {
  businessContext: BusinessContext;
  name: string;
  excludeId?: string;
}) {
  const duplicate = await prisma.rawMaterialSupplier.findFirst({
    where: {
      businessId: params.businessContext.businessId,
      name: params.name,
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
    },
    select: { id: true },
  });

  if (!duplicate) return;

  throw new AppError({
    statusCode: 409,
    code: errorCodes.conflict,
    message: "Raw material supplier name already exists.",
    details: { name: params.name },
  });
}

function parseSupplierPayload(input: SupplierMutationInput) {
  return {
    name: parseRequiredString(input.name, "name"),
    contactPerson: parseOptionalString(input.contactPerson),
    phone: parseOptionalString(input.phone),
    email: parseOptionalString(input.email),
    address: parseOptionalString(input.address),
    category: parseSupplierCategory(input.category),
    reliabilityScore: parseIntegerRange(input.reliabilityScore, "reliabilityScore", 0, 0, 100),
    leadTimeDays: parseIntegerRange(input.leadTimeDays, "leadTimeDays", 0, 0, 365),
    isActive: parseOptionalBoolean(input.isActive),
    notes: parseOptionalString(input.notes),
  };
}

export async function listRawMaterialSuppliers(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  includeInactive?: boolean;
  search?: string;
}) {
  const { actor, businessContext, includeInactive, search } = params;

  assertCanViewRawMaterialSuppliers(actor);

  const trimmedSearch = search?.trim();
  const suppliers = await prisma.rawMaterialSupplier.findMany({
    where: {
      businessId: businessContext.businessId,
      ...(includeInactive ? {} : { isActive: true }),
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

  return suppliers.map(toRawMaterialSupplierDto);
}

export async function createRawMaterialSupplier(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  input: SupplierMutationInput;
}) {
  const { actor, businessContext, input } = params;

  assertCanManageRawMaterialSuppliers(actor);

  const payload = parseSupplierPayload(input);
  await assertSupplierNameAvailable({ businessContext, name: payload.name });

  const supplier = await prisma.rawMaterialSupplier.create({
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

  return toRawMaterialSupplierDto(supplier);
}

export async function updateRawMaterialSupplier(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  id: string;
  input: SupplierMutationInput;
}) {
  const { actor, businessContext, id, input } = params;

  assertCanManageRawMaterialSuppliers(actor);
  await loadSupplierOrThrow(businessContext, id);

  const payload = parseSupplierPayload(input);
  await assertSupplierNameAvailable({
    businessContext,
    name: payload.name,
    excludeId: id,
  });

  const supplier = await prisma.rawMaterialSupplier.update({
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

  return toRawMaterialSupplierDto(supplier);
}

export async function deactivateRawMaterialSupplier(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  id: string;
}) {
  const { actor, businessContext, id } = params;

  assertCanManageRawMaterialSuppliers(actor);
  await loadSupplierOrThrow(businessContext, id);

  const supplier = await prisma.rawMaterialSupplier.update({
    where: { id },
    data: { isActive: false },
  });

  return toRawMaterialSupplierDto(supplier);
}
