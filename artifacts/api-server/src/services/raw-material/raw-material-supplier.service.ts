import type { BusinessContext } from "../../lib/business-context/index.js";
import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import { writeRawMaterialAuditLog } from "./raw-material.audit.js";
import { toRawMaterialSupplierDto } from "./raw-material-supplier.dto.js";
import {
  createRawMaterialSupplierRecord,
  deactivateRawMaterialSupplierRecord,
  findRawMaterialSupplierById,
  findRawMaterialSupplierNameConflict,
  listRawMaterialSupplierRows,
  updateRawMaterialSupplierRecord,
} from "./raw-material-supplier.repository.js";
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

async function loadSupplierOrThrow(businessContext: BusinessContext, id: string) {
  const supplier = await findRawMaterialSupplierById(businessContext, id);

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
  const duplicate = await findRawMaterialSupplierNameConflict(params);

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

  const suppliers = await listRawMaterialSupplierRows({
    businessContext,
    includeInactive,
    search,
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

  const supplier = await createRawMaterialSupplierRecord({ businessContext, payload });
  const dto = toRawMaterialSupplierDto(supplier);

  await writeRawMaterialAuditLog({
    businessId: businessContext.businessId,
    userId: actor.id,
    action: "CREATE",
    entityType: "RawMaterialSupplier",
    entityId: supplier.id,
    changes: { payload, result: dto },
  });

  return dto;
}

export async function updateRawMaterialSupplier(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  id: string;
  input: SupplierMutationInput;
}) {
  const { actor, businessContext, id, input } = params;

  assertCanManageRawMaterialSuppliers(actor);
  const existing = await loadSupplierOrThrow(businessContext, id);

  const payload = parseSupplierPayload(input);
  await assertSupplierNameAvailable({
    businessContext,
    name: payload.name,
    excludeId: id,
  });

  const supplier = await updateRawMaterialSupplierRecord({ id, payload });
  const dto = toRawMaterialSupplierDto(supplier);

  await writeRawMaterialAuditLog({
    businessId: businessContext.businessId,
    userId: actor.id,
    action: "UPDATE",
    entityType: "RawMaterialSupplier",
    entityId: supplier.id,
    changes: { before: toRawMaterialSupplierDto(existing), payload, result: dto },
  });

  return dto;
}

export async function deactivateRawMaterialSupplier(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  id: string;
}) {
  const { actor, businessContext, id } = params;

  assertCanManageRawMaterialSuppliers(actor);
  const existing = await loadSupplierOrThrow(businessContext, id);

  const supplier = await deactivateRawMaterialSupplierRecord(id);
  const dto = toRawMaterialSupplierDto(supplier);

  await writeRawMaterialAuditLog({
    businessId: businessContext.businessId,
    userId: actor.id,
    action: "DELETE",
    entityType: "RawMaterialSupplier",
    entityId: supplier.id,
    changes: { before: toRawMaterialSupplierDto(existing), result: dto },
  });

  return dto;
}
