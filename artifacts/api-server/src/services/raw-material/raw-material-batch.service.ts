import { RawMaterialIntakeStatus, Role } from "@prisma/client";

import type { BusinessScopedUser as AuthenticatedUser } from "../../lib/auth.js";
import { writeRawMaterialAuditLog } from "./raw-material.audit.js";
import { toRawMaterialBatchDto } from "./raw-material-batch.presenter.js";
import {
  createRawMaterialBatchRecord,
  deactivateRawMaterialBatchRecord,
  findRawMaterialBatchById,
  findRawMaterialBatchLotConflict,
  listRawMaterialBatchRows,
  loadRawMaterialIntakeForBatch,
  loadRawMaterialStorageLocationForBatch,
  sumActiveRawMaterialBatchQuantityForIntake,
  updateRawMaterialBatchRecord,
} from "./raw-material-batch.repository.js";
import type { RawMaterialBatchPayload, RawMaterialBatchQuery } from "./raw-material-batch.types.js";
import {
  assertRawMaterialBatchQuantityShape,
  normalizeRawMaterialBatchPayload,
  normalizeRawMaterialBatchUpdatePayload,
} from "./raw-material-batch.validation.js";

type RawMaterialBatchRouteActor = Readonly<{
  id: string;
  role: Role;
}>;

type RawMaterialBatchRouteParams = Readonly<{
  actor: RawMaterialBatchRouteActor;
  businessContext: { businessId: string };
}>;

type RawMaterialBatchListParams = RawMaterialBatchRouteParams & RawMaterialBatchQuery;

type RawMaterialBatchCreateParams = RawMaterialBatchRouteParams & Readonly<{
  input: RawMaterialBatchPayload;
}>;

type RawMaterialBatchUpdateParams = RawMaterialBatchRouteParams & Readonly<{
  id: string;
  input: RawMaterialBatchPayload;
}>;

type RawMaterialBatchDeleteParams = RawMaterialBatchRouteParams & Readonly<{
  id: string;
}>;

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

function toAuthenticatedUser(params: RawMaterialBatchRouteParams): AuthenticatedUser {
  return {
    id: params.actor.id,
    role: params.actor.role,
    businessId: params.businessContext.businessId,
  };
}

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

async function assertUniqueLotCode(
  businessId: string,
  lotCode: string,
  currentBatchId?: string,
) {
  const existing = await findRawMaterialBatchLotConflict({
    businessId,
    lotCode,
    currentBatchId,
  });

  if (existing) {
    throw new Error("Raw material batch lot code already exists");
  }
}

async function assertValidIntake(businessId: string, intakeId: string) {
  const intake = await loadRawMaterialIntakeForBatch(businessId, intakeId);

  if (!intake) {
    throw new Error("Raw material intake was not found");
  }

  if (intake.qualityStatus === RawMaterialIntakeStatus.CANCELLED) {
    throw new Error("Cannot create batch from cancelled intake");
  }

  return intake;
}

async function assertValidStorageLocation(businessId: string, storageLocationId: string) {
  const storageLocation = await loadRawMaterialStorageLocationForBatch(
    businessId,
    storageLocationId,
  );

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
  const [existingBatchQuantity, intake] = await Promise.all([
    sumActiveRawMaterialBatchQuantityForIntake({
      businessId,
      intakeId,
      currentBatchId,
    }),
    assertValidIntake(businessId, intakeId),
  ]);
  const nextTotal = existingBatchQuantity + quantity;

  if (nextTotal > intake.acceptedQuantity) {
    throw new Error("Batch quantity cannot exceed accepted intake quantity");
  }

  return intake;
}

function resolveListParams(
  userOrParams: AuthenticatedUser | RawMaterialBatchListParams,
  query: RawMaterialBatchQuery = {},
) {
  if ("actor" in userOrParams) {
    return {
      user: toAuthenticatedUser(userOrParams),
      query: {
        intakeId: userOrParams.intakeId,
        storageLocationId: userOrParams.storageLocationId,
        qualityStatus: userOrParams.qualityStatus,
        isActive: userOrParams.isActive,
        search: userOrParams.search,
      } satisfies RawMaterialBatchQuery,
    };
  }

  return { user: userOrParams, query };
}

function resolveMutationParams(
  userOrParams: AuthenticatedUser | RawMaterialBatchCreateParams,
  payload?: RawMaterialBatchPayload,
) {
  if ("actor" in userOrParams) {
    return {
      user: toAuthenticatedUser(userOrParams),
      payload: userOrParams.input,
    };
  }

  return {
    user: userOrParams,
    payload: payload ?? {},
  };
}

export async function listRawMaterialBatches(
  userOrParams: AuthenticatedUser | RawMaterialBatchListParams,
  query: RawMaterialBatchQuery = {},
) {
  const resolved = resolveListParams(userOrParams, query);
  assertCanView(resolved.user);
  const businessId = assertBusinessAccess(resolved.user);

  const batches = await listRawMaterialBatchRows(businessId, resolved.query);

  return batches.map(toRawMaterialBatchDto);
}

export async function createRawMaterialBatch(
  userOrParams: AuthenticatedUser | RawMaterialBatchCreateParams,
  payload?: RawMaterialBatchPayload,
) {
  const resolved = resolveMutationParams(userOrParams, payload);
  assertCanManage(resolved.user);
  const businessId = assertBusinessAccess(resolved.user);
  const normalized = normalizeRawMaterialBatchPayload(resolved.payload);

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

  const batch = await createRawMaterialBatchRecord(businessId, normalized);
  const dto = toRawMaterialBatchDto(batch);

  await writeRawMaterialAuditLog({
    businessId,
    userId: resolved.user.id,
    action: "CREATE",
    entityType: "RawMaterialBatch",
    entityId: batch.id,
    changes: { payload: normalized, result: dto },
  });

  return dto;
}

export async function updateRawMaterialBatch(
  userOrParams: AuthenticatedUser | RawMaterialBatchUpdateParams,
  batchId?: string,
  payload?: RawMaterialBatchPayload,
) {
  const resolved = "actor" in userOrParams
    ? {
        user: toAuthenticatedUser(userOrParams),
        batchId: userOrParams.id,
        payload: userOrParams.input,
      }
    : {
        user: userOrParams,
        batchId,
        payload: payload ?? {},
      };

  if (!resolved.batchId) {
    throw new Error("Batch id is required");
  }

  assertCanManage(resolved.user);
  const businessId = assertBusinessAccess(resolved.user);
  const existing = await findRawMaterialBatchById(businessId, resolved.batchId);

  if (!existing) {
    throw new Error("Raw material batch was not found");
  }

  const normalized = normalizeRawMaterialBatchUpdatePayload(resolved.payload);
  const nextLotCode = normalized.lotCode ?? existing.lotCode;
  const nextIntakeId = normalized.intakeId ?? existing.intakeId;
  const nextStorageLocationId = normalized.storageLocationId ?? existing.storageLocationId;
  const nextQuantity = normalized.quantity ?? existing.quantity;
  const nextRemainingQuantity = normalized.remainingQuantity ?? existing.remainingQuantity;
  const nextUnit = normalized.unit ?? existing.unit;

  await assertUniqueLotCode(businessId, nextLotCode, resolved.batchId);
  await assertValidStorageLocation(businessId, nextStorageLocationId);
  const intake = await assertBatchQuantityWithinIntake(
    businessId,
    nextIntakeId,
    nextQuantity,
    resolved.batchId,
  );

  if (nextUnit !== intake.unit) {
    throw new Error("Batch unit must match intake unit");
  }

  assertRawMaterialBatchQuantityShape(nextQuantity, nextRemainingQuantity);

  const updated = await updateRawMaterialBatchRecord(existing.id, normalized);
  const dto = toRawMaterialBatchDto(updated);

  await writeRawMaterialAuditLog({
    businessId,
    userId: resolved.user.id,
    action: "UPDATE",
    entityType: "RawMaterialBatch",
    entityId: updated.id,
    changes: { before: toRawMaterialBatchDto(existing), payload: normalized, result: dto },
  });

  return dto;
}

export async function deactivateRawMaterialBatch(
  userOrParams: AuthenticatedUser | RawMaterialBatchDeleteParams,
  batchId?: string,
) {
  const resolved = "actor" in userOrParams
    ? {
        user: toAuthenticatedUser(userOrParams),
        batchId: userOrParams.id,
      }
    : {
        user: userOrParams,
        batchId,
      };

  if (!resolved.batchId) {
    throw new Error("Batch id is required");
  }

  assertCanManage(resolved.user);
  const businessId = assertBusinessAccess(resolved.user);
  const existing = await findRawMaterialBatchById(businessId, resolved.batchId);

  if (!existing) {
    throw new Error("Raw material batch was not found");
  }

  const updated = await deactivateRawMaterialBatchRecord(existing.id);
  const dto = toRawMaterialBatchDto(updated);

  await writeRawMaterialAuditLog({
    businessId,
    userId: resolved.user.id,
    action: "DELETE",
    entityType: "RawMaterialBatch",
    entityId: updated.id,
    changes: { before: toRawMaterialBatchDto(existing), result: dto },
  });

  return dto;
}
