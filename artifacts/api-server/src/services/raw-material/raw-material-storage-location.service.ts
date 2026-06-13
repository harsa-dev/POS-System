import type { Prisma } from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/index.js";
import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import { prisma } from "../../lib/prisma.js";
import { toRawMaterialStorageLocationDto } from "./raw-material-storage-location.dto.js";
import type { RawMaterialActor } from "./raw-material-storage-location.types.js";
import {
  parseStorageNonNegativeNumber,
  parseStorageOptionalBoolean,
  parseStorageOptionalNumber,
  parseStorageOptionalString,
  parseStorageRequiredString,
  parseStorageType,
} from "./raw-material-storage-location.validation.js";

type StorageLocationMutationInput = Record<string, unknown>;

function assertCanManageRawMaterialStorage(actor: RawMaterialActor) {
  if (["OWNER", "MANAGER", "ADMIN", "OPERATOR"].includes(actor.role)) return;

  throw new AppError({
    statusCode: 403,
    code: errorCodes.forbidden,
    message: "You do not have permission to manage raw material storage locations.",
  });
}

function assertCanViewRawMaterialStorage(actor: RawMaterialActor) {
  if (["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF", "VIEWER"].includes(actor.role)) return;

  throw new AppError({
    statusCode: 403,
    code: errorCodes.forbidden,
    message: "You do not have permission to view raw material storage locations.",
  });
}

function getStorageWhere(businessContext: BusinessContext, id: string) {
  return {
    id,
    businessId: businessContext.businessId,
  } satisfies Prisma.RawMaterialStorageLocationWhereInput;
}

async function loadStorageOrThrow(businessContext: BusinessContext, id: string) {
  const storageLocation = await prisma.rawMaterialStorageLocation.findFirst({
    where: getStorageWhere(businessContext, id),
  });

  if (!storageLocation) {
    throw new AppError({
      statusCode: 404,
      code: errorCodes.notFound,
      message: "Raw material storage location not found.",
    });
  }

  return storageLocation;
}

async function assertStorageCodeAvailable(params: {
  businessContext: BusinessContext;
  code: string;
  excludeId?: string;
}) {
  const duplicate = await prisma.rawMaterialStorageLocation.findFirst({
    where: {
      businessId: params.businessContext.businessId,
      code: params.code,
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
    },
    select: { id: true },
  });

  if (!duplicate) return;

  throw new AppError({
    statusCode: 409,
    code: errorCodes.conflict,
    message: "Raw material storage code already exists.",
    details: { code: params.code },
  });
}

function parseStoragePayload(input: StorageLocationMutationInput) {
  const capacityKg = parseStorageNonNegativeNumber(input.capacityKg, "capacityKg", 0);
  const usedKg = parseStorageNonNegativeNumber(input.usedKg, "usedKg", 0);

  if (capacityKg > 0 && usedKg > capacityKg) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: "usedKg cannot be greater than capacityKg.",
      details: { capacityKg, usedKg },
    });
  }

  return {
    code: parseStorageRequiredString(input.code, "code").toUpperCase(),
    name: parseStorageRequiredString(input.name, "name"),
    type: parseStorageType(input.type),
    capacityKg,
    usedKg,
    temperatureCelsius: parseStorageOptionalNumber(input.temperatureCelsius, "temperatureCelsius"),
    isActive: parseStorageOptionalBoolean(input.isActive),
    notes: parseStorageOptionalString(input.notes),
  };
}

export async function listRawMaterialStorageLocations(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  includeInactive?: boolean;
  search?: string;
}) {
  const { actor, businessContext, includeInactive, search } = params;

  assertCanViewRawMaterialStorage(actor);

  const trimmedSearch = search?.trim();
  const storageLocations = await prisma.rawMaterialStorageLocation.findMany({
    where: {
      businessId: businessContext.businessId,
      ...(includeInactive ? {} : { isActive: true }),
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

  return storageLocations.map(toRawMaterialStorageLocationDto);
}

export async function createRawMaterialStorageLocation(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  input: StorageLocationMutationInput;
}) {
  const { actor, businessContext, input } = params;

  assertCanManageRawMaterialStorage(actor);

  const payload = parseStoragePayload(input);
  await assertStorageCodeAvailable({ businessContext, code: payload.code });

  const storageLocation = await prisma.rawMaterialStorageLocation.create({
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

  return toRawMaterialStorageLocationDto(storageLocation);
}

export async function updateRawMaterialStorageLocation(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  id: string;
  input: StorageLocationMutationInput;
}) {
  const { actor, businessContext, id, input } = params;

  assertCanManageRawMaterialStorage(actor);
  await loadStorageOrThrow(businessContext, id);

  const payload = parseStoragePayload(input);
  await assertStorageCodeAvailable({
    businessContext,
    code: payload.code,
    excludeId: id,
  });

  const storageLocation = await prisma.rawMaterialStorageLocation.update({
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

  return toRawMaterialStorageLocationDto(storageLocation);
}

export async function deactivateRawMaterialStorageLocation(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  id: string;
}) {
  const { actor, businessContext, id } = params;

  assertCanManageRawMaterialStorage(actor);
  await loadStorageOrThrow(businessContext, id);

  const storageLocation = await prisma.rawMaterialStorageLocation.update({
    where: { id },
    data: { isActive: false },
  });

  return toRawMaterialStorageLocationDto(storageLocation);
}
