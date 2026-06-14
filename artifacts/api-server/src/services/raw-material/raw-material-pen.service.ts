import { Role } from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/index.js";
import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import { writeRawMaterialAuditLog } from "./raw-material.audit.js";
import { toRawMaterialPenDto } from "./raw-material-pen.dto.js";
import {
  createRawMaterialPenRecord,
  deactivateRawMaterialPenRecord,
  findRawMaterialPenCodeConflict,
  listRawMaterialPenRows,
  loadRawMaterialFeedBatchForPen,
  loadRawMaterialPenRow,
  updateRawMaterialPenRecord,
} from "./raw-material-pen.repository.js";
import type { RawMaterialPenInput, RawMaterialPenQuery } from "./raw-material-pen.types.js";
import type { RawMaterialActor } from "./raw-material-supplier.types.js";
import { validateRawMaterialPenInput } from "./raw-material-pen.validation.js";
import {
  assertRawMaterialFeedBatchAllowed,
  assertRawMaterialKandangCapacity,
  assertRawMaterialKandangHealthCanBeSet,
} from "./raw-material.workflow.js";

const viewRoles = new Set<Role>([Role.OWNER, Role.MANAGER, Role.ADMIN, Role.OPERATOR, Role.STAFF, Role.VIEWER]);
const manageRoles = new Set<Role>([Role.OWNER, Role.MANAGER, Role.ADMIN, Role.OPERATOR]);

function appError(statusCode: number, code: string, message: string, details?: Record<string, unknown>): never {
  throw new AppError({ statusCode, code, message, details });
}

function assertCanView(actor: RawMaterialActor) {
  if (viewRoles.has(actor.role)) return;
  appError(403, errorCodes.forbidden, "You do not have permission to view raw material pens.");
}

function assertCanManage(actor: RawMaterialActor) {
  if (manageRoles.has(actor.role)) return;
  appError(403, errorCodes.forbidden, "You do not have permission to manage raw material pens.");
}

async function assertCodeAvailable(params: {
  businessContext: BusinessContext;
  code: string;
  excludeId?: string;
}) {
  const duplicate = await findRawMaterialPenCodeConflict(params);

  if (!duplicate) return;
  appError(409, errorCodes.conflict, "Raw material pen code already exists.", { code: params.code });
}

async function assertFeedBatchAllowed(businessContext: BusinessContext, feedBatchId: string | null | undefined) {
  if (!feedBatchId) return;

  const batch = await loadRawMaterialFeedBatchForPen(businessContext, feedBatchId);

  if (!batch) {
    appError(400, errorCodes.validationError, "Feed batch must belong to this business.");
  }

  assertRawMaterialFeedBatchAllowed(batch);
}

async function loadPenOrThrow(businessContext: BusinessContext, id: string) {
  const pen = await loadRawMaterialPenRow(businessContext, id);

  if (!pen) appError(404, errorCodes.notFound, "Raw material pen not found.");
  return pen;
}

export async function listRawMaterialPens(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  query?: RawMaterialPenQuery;
}) {
  const { actor, businessContext } = params;
  const query = params.query ?? {};
  assertCanView(actor);

  const rows = await listRawMaterialPenRows({ businessContext, query });

  return rows.map(toRawMaterialPenDto);
}

export async function createRawMaterialPen(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  input: RawMaterialPenInput;
}) {
  const { actor, businessContext, input } = params;
  assertCanManage(actor);
  const data = validateRawMaterialPenInput(input, "create");

  if (!data.code || !data.flockName) {
    appError(400, errorCodes.validationError, "Invalid raw material pen payload.");
  }

  const payload = {
    code: data.code,
    flockName: data.flockName,
    capacity: data.capacity ?? 0,
    occupancy: data.occupancy ?? 0,
    feedBatchId: data.feedBatchId ?? null,
    healthStatus: data.healthStatus ?? "STABLE",
    isActive: data.isActive ?? true,
    notes: data.notes ?? null,
  };

  assertRawMaterialKandangCapacity({ capacity: payload.capacity, occupancy: payload.occupancy });
  assertRawMaterialKandangHealthCanBeSet({ isActive: payload.isActive, healthStatus: payload.healthStatus });

  await assertCodeAvailable({ businessContext, code: payload.code });
  await assertFeedBatchAllowed(businessContext, payload.feedBatchId);

  const id = await createRawMaterialPenRecord({ businessContext, payload });
  const pen = await loadPenOrThrow(businessContext, id);
  const dto = toRawMaterialPenDto(pen);

  await writeRawMaterialAuditLog({
    businessId: businessContext.businessId,
    userId: actor.id,
    action: "CREATE",
    entityType: "RawMaterialKandangPen",
    entityId: pen.id,
    changes: { payload, result: dto },
  });

  return dto;
}

export async function updateRawMaterialPen(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  id: string;
  input: RawMaterialPenInput;
}) {
  const { actor, businessContext, id, input } = params;
  assertCanManage(actor);
  const existing = await loadPenOrThrow(businessContext, id);
  const data = validateRawMaterialPenInput(input, "update");

  const payload = {
    code: data.code ?? existing.code,
    flockName: data.flockName ?? existing.flockName,
    capacity: data.capacity ?? existing.capacity,
    occupancy: data.occupancy ?? existing.occupancy,
    feedBatchId: input.feedBatchId !== undefined ? (data.feedBatchId ?? null) : existing.feedBatchId,
    healthStatus: data.healthStatus ?? existing.healthStatus,
    isActive: data.isActive ?? existing.isActive,
    notes: input.notes !== undefined ? (data.notes ?? null) : existing.notes,
  };

  assertRawMaterialKandangCapacity({ capacity: payload.capacity, occupancy: payload.occupancy });
  assertRawMaterialKandangHealthCanBeSet({ isActive: payload.isActive, healthStatus: payload.healthStatus });
  if (payload.code !== existing.code) await assertCodeAvailable({ businessContext, code: payload.code, excludeId: id });
  await assertFeedBatchAllowed(businessContext, payload.feedBatchId);

  await updateRawMaterialPenRecord({ businessContext, id, payload });
  const updated = await loadPenOrThrow(businessContext, id);
  const dto = toRawMaterialPenDto(updated);

  await writeRawMaterialAuditLog({
    businessId: businessContext.businessId,
    userId: actor.id,
    action: "UPDATE",
    entityType: "RawMaterialKandangPen",
    entityId: updated.id,
    changes: { before: toRawMaterialPenDto(existing), payload, result: dto },
  });

  return dto;
}

export async function deactivateRawMaterialPen(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  id: string;
}) {
  const { actor, businessContext, id } = params;
  assertCanManage(actor);
  const existing = await loadPenOrThrow(businessContext, id);

  await deactivateRawMaterialPenRecord({ businessContext, id });
  const updated = await loadPenOrThrow(businessContext, id);
  const dto = toRawMaterialPenDto(updated);

  await writeRawMaterialAuditLog({
    businessId: businessContext.businessId,
    userId: actor.id,
    action: "DELETE",
    entityType: "RawMaterialKandangPen",
    entityId: updated.id,
    changes: { before: toRawMaterialPenDto(existing), result: dto },
  });

  return dto;
}
