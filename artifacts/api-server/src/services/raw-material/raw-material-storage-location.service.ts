import type { BusinessContext } from "../../lib/business-context/index.js";
import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import { writeRawMaterialAuditLog } from "./raw-material.audit.js";
import { toRawMaterialStorageLocationDto } from "./raw-material-storage-location.dto.js";
import {
  createRawMaterialStorageLocationRecord,
  deactivateRawMaterialStorageLocationRecord,
  findRawMaterialStorageCodeConflict,
  findRawMaterialStorageLocationById,
  listRawMaterialStorageLocationRows,
  updateRawMaterialStorageLocationRecord,
} from "./raw-material-storage-location.repository.js";
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

async function loadStorageOrThrow(businessContext: BusinessContext, id: string) {
  const storageLocation = await findRawMaterialStorageLocationById(businessContext, id);

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
  const duplicate = await findRawMaterialStorageCodeConflict(params);

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

  const storageLocations = await listRawMaterialStorageLocationRows({
    businessContext,
    includeInactive,
    search,
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

  const storageLocation = await createRawMaterialStorageLocationRecord({ businessContext, payload });
  const dto = toRawMaterialStorageLocationDto(storageLocation);

  await writeRawMaterialAuditLog({
    businessId: businessContext.businessId,
    userId: actor.id,
    action: "CREATE",
    entityType: "RawMaterialStorageLocation",
    entityId: storageLocation.id,
    changes: { payload, result: dto },
  });

  return dto;
}

export async function updateRawMaterialStorageLocation(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  id: string;
  input: StorageLocationMutationInput;
}) {
  const { actor, businessContext, id, input } = params;

  assertCanManageRawMaterialStorage(actor);
  const existing = await loadStorageOrThrow(businessContext, id);

  const payload = parseStoragePayload(input);
  await assertStorageCodeAvailable({
    businessContext,
    code: payload.code,
    excludeId: id,
  });

  const storageLocation = await updateRawMaterialStorageLocationRecord({ id, payload });
  const dto = toRawMaterialStorageLocationDto(storageLocation);

  await writeRawMaterialAuditLog({
    businessId: businessContext.businessId,
    userId: actor.id,
    action: "UPDATE",
    entityType: "RawMaterialStorageLocation",
    entityId: storageLocation.id,
    changes: { before: toRawMaterialStorageLocationDto(existing), payload, result: dto },
  });

  return dto;
}

export async function deactivateRawMaterialStorageLocation(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  id: string;
}) {
  const { actor, businessContext, id } = params;

  assertCanManageRawMaterialStorage(actor);
  const existing = await loadStorageOrThrow(businessContext, id);

  const storageLocation = await deactivateRawMaterialStorageLocationRecord(id);
  const dto = toRawMaterialStorageLocationDto(storageLocation);

  await writeRawMaterialAuditLog({
    businessId: businessContext.businessId,
    userId: actor.id,
    action: "DELETE",
    entityType: "RawMaterialStorageLocation",
    entityId: storageLocation.id,
    changes: { before: toRawMaterialStorageLocationDto(existing), result: dto },
  });

  return dto;
}
