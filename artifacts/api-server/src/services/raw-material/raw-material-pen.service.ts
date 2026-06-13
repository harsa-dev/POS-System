import { randomUUID } from "node:crypto";

import { Prisma, Role } from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/index.js";
import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import { prisma } from "../../lib/prisma.js";
import { toRawMaterialPenDto } from "./raw-material-pen.dto.js";
import type { RawMaterialPenHealthStatus, RawMaterialPenInput, RawMaterialPenQuery, RawMaterialPenRow } from "./raw-material-pen.types.js";
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
  const duplicate = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id"
    FROM "RawMaterialKandangPen"
    WHERE "businessId" = ${params.businessContext.businessId}
      AND "code" = ${params.code}
      ${params.excludeId ? Prisma.sql`AND "id" <> ${params.excludeId}` : Prisma.empty}
    LIMIT 1
  `;

  if (duplicate.length === 0) return;
  appError(409, errorCodes.conflict, "Raw material pen code already exists.", { code: params.code });
}

async function assertFeedBatchAllowed(businessContext: BusinessContext, feedBatchId: string | null | undefined) {
  if (!feedBatchId) return;

  const batch = await prisma.rawMaterialBatch.findFirst({
    where: {
      id: feedBatchId,
      businessId: businessContext.businessId,
    },
    select: {
      id: true,
      isActive: true,
      qualityStatus: true,
      remainingQuantity: true,
    },
  });

  if (!batch) {
    appError(400, errorCodes.validationError, "Feed batch must belong to this business.");
  }

  assertRawMaterialFeedBatchAllowed(batch);
}

async function loadPenOrThrow(businessContext: BusinessContext, id: string) {
  const rows = await prisma.$queryRaw<RawMaterialPenRow[]>`
    SELECT
      p."id",
      p."businessId",
      p."code",
      p."flockName",
      p."capacity",
      p."occupancy",
      p."feedBatchId",
      b."lotCode" AS "feedBatchLotCode",
      b."materialName" AS "feedBatchMaterialName",
      p."healthStatus"::text AS "healthStatus",
      p."isActive",
      p."notes",
      p."createdAt",
      p."updatedAt"
    FROM "RawMaterialKandangPen" p
    LEFT JOIN "RawMaterialBatch" b ON b."id" = p."feedBatchId"
    WHERE p."id" = ${id}
      AND p."businessId" = ${businessContext.businessId}
    LIMIT 1
  `;

  const pen = rows[0];
  if (!pen) appError(404, errorCodes.notFound, "Raw material pen not found.");
  return pen;
}

function buildSearchSql(query: RawMaterialPenQuery) {
  const search = query.search?.trim();

  return Prisma.sql`
    ${query.feedBatchId ? Prisma.sql`AND p."feedBatchId" = ${query.feedBatchId}` : Prisma.empty}
    ${query.healthStatus ? Prisma.sql`AND p."healthStatus" = ${query.healthStatus}::"RawMaterialKandangHealthStatus"` : Prisma.empty}
    ${typeof query.isActive === "boolean" ? Prisma.sql`AND p."isActive" = ${query.isActive}` : Prisma.empty}
    ${search ? Prisma.sql`AND (p."code" ILIKE ${`%${search}%`} OR p."flockName" ILIKE ${`%${search}%`} OR p."notes" ILIKE ${`%${search}%`})` : Prisma.empty}
  `;
}

export async function listRawMaterialPens(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  query?: RawMaterialPenQuery;
}) {
  const { actor, businessContext } = params;
  const query = params.query ?? {};
  assertCanView(actor);

  const rows = await prisma.$queryRaw<RawMaterialPenRow[]>`
    SELECT
      p."id",
      p."businessId",
      p."code",
      p."flockName",
      p."capacity",
      p."occupancy",
      p."feedBatchId",
      b."lotCode" AS "feedBatchLotCode",
      b."materialName" AS "feedBatchMaterialName",
      p."healthStatus"::text AS "healthStatus",
      p."isActive",
      p."notes",
      p."createdAt",
      p."updatedAt"
    FROM "RawMaterialKandangPen" p
    LEFT JOIN "RawMaterialBatch" b ON b."id" = p."feedBatchId"
    WHERE p."businessId" = ${businessContext.businessId}
      ${buildSearchSql(query)}
    ORDER BY p."isActive" DESC, p."code" ASC
  `;

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

  const capacity = data.capacity ?? 0;
  const occupancy = data.occupancy ?? 0;
  const healthStatus = data.healthStatus ?? "STABLE";
  const isActive = data.isActive ?? true;

  assertRawMaterialKandangCapacity({ capacity, occupancy });
  assertRawMaterialKandangHealthCanBeSet({ isActive, healthStatus });

  await assertCodeAvailable({ businessContext, code: data.code });
  await assertFeedBatchAllowed(businessContext, data.feedBatchId);

  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "RawMaterialKandangPen" (
      "id",
      "businessId",
      "code",
      "flockName",
      "capacity",
      "occupancy",
      "feedBatchId",
      "healthStatus",
      "isActive",
      "notes",
      "updatedAt"
    ) VALUES (
      ${id},
      ${businessContext.businessId},
      ${data.code},
      ${data.flockName},
      ${capacity},
      ${occupancy},
      ${data.feedBatchId},
      ${healthStatus}::"RawMaterialKandangHealthStatus",
      ${isActive},
      ${data.notes},
      CURRENT_TIMESTAMP
    )
  `;

  return toRawMaterialPenDto(await loadPenOrThrow(businessContext, id));
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

  const code = data.code ?? existing.code;
  const flockName = data.flockName ?? existing.flockName;
  const capacity = data.capacity ?? existing.capacity;
  const occupancy = data.occupancy ?? existing.occupancy;
  const feedBatchId = input.feedBatchId !== undefined ? data.feedBatchId : existing.feedBatchId;
  const healthStatus = data.healthStatus ?? existing.healthStatus;
  const isActive = data.isActive ?? existing.isActive;
  const notes = input.notes !== undefined ? data.notes : existing.notes;

  assertRawMaterialKandangCapacity({ capacity, occupancy });
  assertRawMaterialKandangHealthCanBeSet({ isActive, healthStatus });
  if (code !== existing.code) await assertCodeAvailable({ businessContext, code, excludeId: id });
  await assertFeedBatchAllowed(businessContext, feedBatchId);

  await prisma.$executeRaw`
    UPDATE "RawMaterialKandangPen"
    SET
      "code" = ${code},
      "flockName" = ${flockName},
      "capacity" = ${capacity},
      "occupancy" = ${occupancy},
      "feedBatchId" = ${feedBatchId},
      "healthStatus" = ${healthStatus}::"RawMaterialKandangHealthStatus",
      "isActive" = ${isActive},
      "notes" = ${notes},
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${id}
      AND "businessId" = ${businessContext.businessId}
  `;

  return toRawMaterialPenDto(await loadPenOrThrow(businessContext, id));
}

export async function deactivateRawMaterialPen(params: {
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  id: string;
}) {
  const { actor, businessContext, id } = params;
  assertCanManage(actor);
  await loadPenOrThrow(businessContext, id);

  await prisma.$executeRaw`
    UPDATE "RawMaterialKandangPen"
    SET "isActive" = false,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${id}
      AND "businessId" = ${businessContext.businessId}
  `;

  return toRawMaterialPenDto(await loadPenOrThrow(businessContext, id));
}
