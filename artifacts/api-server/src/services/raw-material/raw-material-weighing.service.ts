import type { Prisma } from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/index.js";
import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import { prisma } from "../../lib/prisma.js";
import { toRawMaterialWeighingDto } from "./raw-material-weighing.dto.js";
import type { RawMaterialWeighingActor } from "./raw-material-weighing.types.js";
import {
  assertWeighingNetBalance,
  parseWeighingNonNegativeNumber,
  parseWeighingOptionalDate,
  parseWeighingOptionalString,
  parseWeighingPositiveNumber,
  parseWeighingRequiredString,
} from "./raw-material-weighing.validation.js";

type WeighingMutationInput = Record<string, unknown>;

const weighingInclude = {
  intake: { select: { id: true, referenceNumber: true, materialName: true } },
} satisfies Prisma.RawMaterialWeighingInclude;

function assertCanManageRawMaterialWeighing(actor: RawMaterialWeighingActor) {
  if (["OWNER", "MANAGER", "ADMIN", "OPERATOR"].includes(actor.role)) return;

  throw new AppError({
    statusCode: 403,
    code: errorCodes.forbidden,
    message: "You do not have permission to manage raw material weighings.",
  });
}

function assertCanViewRawMaterialWeighing(actor: RawMaterialWeighingActor) {
  if (["OWNER", "MANAGER", "ADMIN", "OPERATOR", "STAFF", "VIEWER"].includes(actor.role)) return;

  throw new AppError({
    statusCode: 403,
    code: errorCodes.forbidden,
    message: "You do not have permission to view raw material weighings.",
  });
}

function getWeighingWhere(businessContext: BusinessContext, id: string) {
  return {
    id,
    businessId: businessContext.businessId,
  } satisfies Prisma.RawMaterialWeighingWhereInput;
}

async function loadWeighingOrThrow(businessContext: BusinessContext, id: string) {
  const weighing = await prisma.rawMaterialWeighing.findFirst({
    where: getWeighingWhere(businessContext, id),
    include: weighingInclude,
  });

  if (!weighing) {
    throw new AppError({
      statusCode: 404,
      code: errorCodes.notFound,
      message: "Raw material weighing not found.",
    });
  }

  return weighing;
}

async function assertReferenceAvailable(params: {
  businessContext: BusinessContext;
  referenceNumber: string;
  excludeId?: string;
}) {
  const duplicate = await prisma.rawMaterialWeighing.findFirst({
    where: {
      businessId: params.businessContext.businessId,
      referenceNumber: params.referenceNumber,
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
    },
    select: { id: true },
  });

  if (!duplicate) return;

  throw new AppError({
    statusCode: 409,
    code: errorCodes.conflict,
    message: "Raw material weighing reference number already exists.",
    details: { referenceNumber: params.referenceNumber },
  });
}

async function assertIntakeUsable(businessContext: BusinessContext, intakeId: string) {
  const intake = await prisma.rawMaterialIntake.findFirst({
    where: {
      id: intakeId,
      businessId: businessContext.businessId,
      qualityStatus: { not: "CANCELLED" },
    },
    select: { id: true },
  });

  if (intake) return;

  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message: "Intake must exist, not be cancelled, and belong to the current business.",
    details: { intakeId },
  });
}

function parseMutationPayload(input: WeighingMutationInput) {
  const grossKg = parseWeighingPositiveNumber(input.grossKg, "grossKg");
  const tareKg = parseWeighingNonNegativeNumber(input.tareKg, "tareKg");
  const netKg = parseWeighingPositiveNumber(input.netKg, "netKg");

  assertWeighingNetBalance({ grossKg, tareKg, netKg });

  return {
    referenceNumber: parseWeighingRequiredString(input.referenceNumber, "referenceNumber").toUpperCase(),
    intakeId: parseWeighingRequiredString(input.intakeId, "intakeId"),
    stationName: parseWeighingRequiredString(input.stationName, "stationName"),
    grossKg,
    tareKg,
    netKg,
    operatorName: parseWeighingRequiredString(input.operatorName, "operatorName"),
    measuredAt: parseWeighingOptionalDate(input.measuredAt),
    notes: parseWeighingOptionalString(input.notes),
  };
}

export async function listRawMaterialWeighings(params: {
  actor: RawMaterialWeighingActor;
  businessContext: BusinessContext;
  intakeId?: string;
  stationName?: string;
  operatorName?: string;
  search?: string;
}) {
  const { actor, businessContext, intakeId, stationName, operatorName, search } = params;

  assertCanViewRawMaterialWeighing(actor);

  const trimmedSearch = search?.trim();
  const weighings = await prisma.rawMaterialWeighing.findMany({
    where: {
      businessId: businessContext.businessId,
      ...(intakeId ? { intakeId } : {}),
      ...(stationName ? { stationName: { contains: stationName, mode: "insensitive" } } : {}),
      ...(operatorName ? { operatorName: { contains: operatorName, mode: "insensitive" } } : {}),
      ...(trimmedSearch
        ? {
            OR: [
              { referenceNumber: { contains: trimmedSearch, mode: "insensitive" } },
              { stationName: { contains: trimmedSearch, mode: "insensitive" } },
              { operatorName: { contains: trimmedSearch, mode: "insensitive" } },
              { notes: { contains: trimmedSearch, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: weighingInclude,
    orderBy: [{ measuredAt: "desc" }, { createdAt: "desc" }],
  });

  return weighings.map(toRawMaterialWeighingDto);
}

export async function createRawMaterialWeighing(params: {
  actor: RawMaterialWeighingActor;
  businessContext: BusinessContext;
  input: WeighingMutationInput;
}) {
  const { actor, businessContext, input } = params;
  assertCanManageRawMaterialWeighing(actor);

  const payload = parseMutationPayload(input);

  await assertReferenceAvailable({ businessContext, referenceNumber: payload.referenceNumber });
  await assertIntakeUsable(businessContext, payload.intakeId);

  const weighing = await prisma.rawMaterialWeighing.create({
    data: {
      businessId: businessContext.businessId,
      ...payload,
    },
    include: weighingInclude,
  });

  return toRawMaterialWeighingDto(weighing);
}

export async function updateRawMaterialWeighing(params: {
  actor: RawMaterialWeighingActor;
  businessContext: BusinessContext;
  id: string;
  input: WeighingMutationInput;
}) {
  const { actor, businessContext, id, input } = params;
  assertCanManageRawMaterialWeighing(actor);

  await loadWeighingOrThrow(businessContext, id);
  const payload = parseMutationPayload(input);

  await assertReferenceAvailable({ businessContext, referenceNumber: payload.referenceNumber, excludeId: id });
  await assertIntakeUsable(businessContext, payload.intakeId);

  const weighing = await prisma.rawMaterialWeighing.update({
    where: { id },
    data: payload,
    include: weighingInclude,
  });

  return toRawMaterialWeighingDto(weighing);
}

export async function deleteRawMaterialWeighing(params: {
  actor: RawMaterialWeighingActor;
  businessContext: BusinessContext;
  id: string;
}) {
  const { actor, businessContext, id } = params;
  assertCanManageRawMaterialWeighing(actor);

  await loadWeighingOrThrow(businessContext, id);
  await prisma.rawMaterialWeighing.delete({ where: { id } });

  return { id, deleted: true } as const;
}
