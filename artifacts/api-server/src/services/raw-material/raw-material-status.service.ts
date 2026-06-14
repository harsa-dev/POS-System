import type { BusinessContext } from "../../lib/business-context/index.js";
import type { RawMaterialActor } from "./raw-material-intake.types.js";

import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import { cancelRawMaterialIntake } from "./raw-material-intake.service.js";
import {
  deactivateRawMaterialBatch,
  updateRawMaterialBatch,
} from "./raw-material-batch.service.js";
import {
  updateRawMaterialProcessingRun,
} from "./raw-material-processing-run.service.js";
import { cancelRawMaterialProcessingRunWithStockReversal } from "./raw-material-processing-cancellation-reversal.service.js";
import { updateRawMaterialPen } from "./raw-material-pen.service.js";

type RawMaterialStatusParams = Readonly<{
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  id: string;
}>;

type RawMaterialStatusPayloadParams = RawMaterialStatusParams & Readonly<{
  input?: Record<string, unknown>;
}>;

function readStatus(input: Record<string, unknown> | undefined) {
  return typeof input?.status === "string" ? input.status.toUpperCase() : undefined;
}

export async function setRawMaterialIntakeStatus(params: RawMaterialStatusPayloadParams) {
  const status = readStatus(params.input);

  if (status !== "CANCELLED") {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: "Raw material intake status route currently supports CANCELLED only.",
      details: { status: status ?? null },
    });
  }

  return cancelRawMaterialIntake(params);
}

export async function setRawMaterialBatchStatus(params: RawMaterialStatusPayloadParams) {
  const status = readStatus(params.input);

  if (!status) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: "Raw material batch status is required.",
    });
  }

  if (status === "QUARANTINED") {
    return deactivateRawMaterialBatch(params);
  }

  return updateRawMaterialBatch({
    actor: params.actor,
    businessContext: params.businessContext,
    id: params.id,
    input: {
      ...(params.input ?? {}),
      qualityStatus: status,
    },
  });
}

export async function setRawMaterialProcessingStatus(params: RawMaterialStatusPayloadParams) {
  const status = readStatus(params.input);

  if (!status) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: "Raw material processing status is required.",
    });
  }

  if (status === "CANCELLED") {
    return cancelRawMaterialProcessingRunWithStockReversal(params);
  }

  return updateRawMaterialProcessingRun({
    actor: params.actor,
    businessContext: params.businessContext,
    id: params.id,
    input: {
      ...(params.input ?? {}),
      status,
    },
  });
}

export async function setRawMaterialPenHealthStatus(params: RawMaterialStatusPayloadParams) {
  const healthStatus = typeof params.input?.status === "string"
    ? params.input.status.toUpperCase()
    : typeof params.input?.healthStatus === "string"
      ? params.input.healthStatus.toUpperCase()
      : undefined;

  if (!healthStatus) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: "Raw material pen health status is required.",
    });
  }

  return updateRawMaterialPen({
    actor: params.actor,
    businessContext: params.businessContext,
    id: params.id,
    input: {
      ...(params.input ?? {}),
      healthStatus,
    },
  });
}
