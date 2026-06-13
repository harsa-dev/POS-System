import type { RawMaterialIntakeStatus } from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/index.js";
import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import { toRawMaterialIntakeDto } from "./raw-material-intake.presenter.js";
import {
  cancelRawMaterialIntakeRecord,
  createRawMaterialIntakeRecord,
  findActiveRawMaterialStorageLocation,
  findActiveRawMaterialSupplier,
  findRawMaterialIntakeById,
  findRawMaterialIntakeReferenceConflict,
  listRawMaterialIntakeRows,
  updateRawMaterialIntakeRecord,
} from "./raw-material-intake.repository.js";
import type { RawMaterialActor } from "./raw-material-intake.types.js";
import {
  parseIntakeNonNegativeNumber,
  parseIntakeOptionalDate,
  parseIntakeOptionalString,
  parseIntakePositiveNumber,
  parseIntakeRequiredString,
  parseRawMaterialIntakeStatus,
  parseRawMaterialUnit,
} from "./raw-material-intake.validation.js";


type IntakeMutationInput = Record<string, unknown>;

function assertCanManageRawMaterialIntake(actor: RawMaterialActor) {
  if (["OWNER", "MANAGER", "ADMIN", "OPERATOR"].includes(actor.role)) return;

  throw new AppError({
    statusCode: 403,
    code: errorCodes.forbidden,
    message: "You do not have permission to manage raw material intakes.",
  });
}

function assertCanViewRawMaterialIntake(actor: RawMaterialActor) {
  if (["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF", "VIEWER"].includes(actor.role)) return;

  throw new AppError({
    statusCode: 403,
    code: errorCodes.forbidden,
    message: "You do not have permission to view raw material intakes.",
  });
}

async function loadIntakeOrThrow(businessContext: BusinessContext, id: string) {
  const intake = await findRawMaterialIntakeById(businessContext, id);

  if (!intake) {
    throw new AppError({
      statusCode: 404,
      code: errorCodes.notFound,
      message: "Raw material intake not found.",
    });
  }

  return intake;
}

async function assertReferenceAvailable(params: {
  businessContext: BusinessContext;
  referenceNumber: string;
  excludeId?: string;
}) {
  const duplicate = await findRawMaterialIntakeReferenceConflict(params);

  if (!duplicate) return;

  throw new AppError({
    statusCode: 409,
    code: errorCodes.conflict,
    message: "Raw material intake reference number already exists.",
    details: { referenceNumber: params.referenceNumber },
  });
}

async function assertSupplierUsable(businessContext: BusinessContext, supplierId: string) {
  const supplier = await findActiveRawMaterialSupplier(businessContext, supplierId);

  if (supplier) return;

  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message: "Supplier must exist, be active, and belong to the current business.",
    details: { supplierId },
  });
}

async function assertStorageUsable(
  businessContext: BusinessContext,
  targetStorageLocationId: string,
) {
  const storageLocation = await findActiveRawMaterialStorageLocation(
    businessContext,
    targetStorageLocationId,
  );

  if (storageLocation) return;

  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message: "Target storage location must exist, be active, and belong to the current business.",
    details: { targetStorageLocationId },
  });
}

function assertQuantityBalance(params: {
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
}) {
  const allocatedQuantity = params.acceptedQuantity + params.rejectedQuantity;

  if (allocatedQuantity <= params.receivedQuantity) return;

  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message: "acceptedQuantity + rejectedQuantity cannot exceed receivedQuantity.",
    details: params,
  });
}

function inferStatusFromQuantities(params: {
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  explicitStatus: RawMaterialIntakeStatus;
}) {
  if (["CANCELLED", "DRAFT"].includes(params.explicitStatus)) return params.explicitStatus;
  if (params.acceptedQuantity === 0 && params.rejectedQuantity >= params.receivedQuantity) return "REJECTED";
  if (params.acceptedQuantity >= params.receivedQuantity && params.rejectedQuantity === 0) return "ACCEPTED";
  if (params.acceptedQuantity > 0 || params.rejectedQuantity > 0) return "PARTIALLY_REJECTED";

  return params.explicitStatus;
}

function parseCreatePayload(input: IntakeMutationInput) {
  const receivedQuantity = parseIntakePositiveNumber(input.receivedQuantity, "receivedQuantity");
  const acceptedQuantity = parseIntakeNonNegativeNumber(input.acceptedQuantity, "acceptedQuantity", 0);
  const rejectedQuantity = parseIntakeNonNegativeNumber(input.rejectedQuantity, "rejectedQuantity", 0);
  const explicitStatus = parseRawMaterialIntakeStatus(input.qualityStatus);

  assertQuantityBalance({ receivedQuantity, acceptedQuantity, rejectedQuantity });

  return {
    referenceNumber: parseIntakeRequiredString(input.referenceNumber, "referenceNumber").toUpperCase(),
    supplierId: parseIntakeRequiredString(input.supplierId, "supplierId"),
    targetStorageLocationId: parseIntakeRequiredString(input.targetStorageLocationId, "targetStorageLocationId"),
    materialName: parseIntakeRequiredString(input.materialName, "materialName"),
    unit: parseRawMaterialUnit(input.unit),
    receivedQuantity,
    acceptedQuantity,
    rejectedQuantity,
    qualityStatus: inferStatusFromQuantities({
      receivedQuantity,
      acceptedQuantity,
      rejectedQuantity,
      explicitStatus,
    }),
    receivedAt: parseIntakeOptionalDate(input.receivedAt),
    notes: parseIntakeOptionalString(input.notes),
  };
}

function parseUpdatePayload(input: IntakeMutationInput) {
  const receivedQuantity = parseIntakePositiveNumber(input.receivedQuantity, "receivedQuantity");
  const acceptedQuantity = parseIntakeNonNegativeNumber(input.acceptedQuantity, "acceptedQuantity", 0);
  const rejectedQuantity = parseIntakeNonNegativeNumber(input.rejectedQuantity, "rejectedQuantity", 0);
  const explicitStatus = parseRawMaterialIntakeStatus(input.qualityStatus);

  assertQuantityBalance({ receivedQuantity, acceptedQuantity, rejectedQuantity });

  return {
    referenceNumber: parseIntakeRequiredString(input.referenceNumber, "referenceNumber").toUpperCase(),
    supplierId: parseIntakeRequiredString(input.supplierId, "supplierId"),
    targetStorageLocationId: parseIntakeRequiredString(input.targetStorageLocationId, "targetStorageLocationId"),
    materialName: parseIntakeRequiredString(input.materialName, "materialName"),
    unit: parseRawMaterialUnit(input.unit),
    receivedQuantity,
    acceptedQuantity,
    rejectedQuantity,
    qualityStatus: inferStatusFromQuantities({
      receivedQuantity,
      acceptedQuantity,
      rejectedQuantity,
      explicitStatus,
    }),
    receivedAt: parseIntakeOptionalDate(input.receivedAt),
    notes: parseIntakeOptionalString(input.notes),
  };
}

export async function listRawMaterialIntakes(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  status?: string;
  supplierId?: string;
  targetStorageLocationId?: string;
  search?: string;
}) {
  const { actor, businessContext, status, supplierId, targetStorageLocationId, search } = params;

  assertCanViewRawMaterialIntake(actor);

  const normalizedStatus = status ? parseRawMaterialIntakeStatus(status) : undefined;
  const intakes = await listRawMaterialIntakeRows({
    businessContext,
    status: normalizedStatus,
    supplierId,
    targetStorageLocationId,
    search,
  });

  return intakes.map(toRawMaterialIntakeDto);
}

export async function createRawMaterialIntake(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  input: IntakeMutationInput;
}) {
  const { actor, businessContext, input } = params;

  assertCanManageRawMaterialIntake(actor);

  const payload = parseCreatePayload(input);
  await assertReferenceAvailable({ businessContext, referenceNumber: payload.referenceNumber });
  await assertSupplierUsable(businessContext, payload.supplierId);
  await assertStorageUsable(businessContext, payload.targetStorageLocationId);

  const intake = await createRawMaterialIntakeRecord(businessContext, payload);

  return toRawMaterialIntakeDto(intake);
}

export async function updateRawMaterialIntake(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  id: string;
  input: IntakeMutationInput;
}) {
  const { actor, businessContext, id, input } = params;

  assertCanManageRawMaterialIntake(actor);
  await loadIntakeOrThrow(businessContext, id);

  const payload = parseUpdatePayload(input);
  await assertReferenceAvailable({
    businessContext,
    referenceNumber: payload.referenceNumber,
    excludeId: id,
  });
  await assertSupplierUsable(businessContext, payload.supplierId);
  await assertStorageUsable(businessContext, payload.targetStorageLocationId);

  const intake = await updateRawMaterialIntakeRecord(id, payload);

  return toRawMaterialIntakeDto(intake);
}

export async function cancelRawMaterialIntake(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  id: string;
}) {
  const { actor, businessContext, id } = params;

  assertCanManageRawMaterialIntake(actor);
  await loadIntakeOrThrow(businessContext, id);

  const intake = await cancelRawMaterialIntakeRecord(id);

  return toRawMaterialIntakeDto(intake);
}
