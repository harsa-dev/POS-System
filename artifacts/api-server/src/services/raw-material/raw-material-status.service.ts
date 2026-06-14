import type { BusinessContext } from "../../lib/business-context/index.js";
import type { RawMaterialActor } from "./raw-material-intake.types.js";

import { cancelRawMaterialIntake } from "./raw-material-intake.service.js";
import {
  deactivateRawMaterialBatch,
  updateRawMaterialBatch,
} from "./raw-material-batch.service.js";
import {
  cancelRawMaterialProcessingRun,
  updateRawMaterialProcessingRun,
} from "./raw-material-processing-run.service.js";
import { updateRawMaterialPen } from "./raw-material-pen.service.js";

type RawMaterialStatusParams = Readonly<{
  actor: RawMaterialActor;
  businessContext: BusinessContext;
  id: string;
}>;

type RawMaterialStatusPayloadParams = RawMaterialStatusParams & Readonly<{
  input?: Record<string, unknown>;
}>;

export async function setRawMaterialIntakeStatus(params: RawMaterialStatusPayloadParams) {
  const status = typeof params.input?.status === "string"
    ? params.input.status.toUpperCase()
    : undefined;

  if (status === "CANCELLED") {
    return cancelRawMaterialIntake(params);
  }

  return updateRawMaterialIntakeWithStatus(params, status);
}

async function updateRawMaterialIntakeWithStatus(
  params: RawMaterialStatusPayloadParams,
  status: string | undefined,
) {
  if (!status) {
    throw new Error("Raw material intake status is required.");
  }

  return import("./raw-material-intake.service.js").then(({ updateRawMaterialIntake }) => updateRawMaterialIntake({
    actor: params.actor,
    businessContext: params.businessContext,
    id: params.id,
    input: {
      ...(params.input ?? {}),
      qualityStatus: status,
    },
  }));
}

export async function setRawMaterialBatchStatus(params: RawMaterialStatusPayloadParams) {
  const status = typeof params.input?.status === "string"
    ? params.input.status.toUpperCase()
    : undefined;

  if (!status) {
    throw new Error("Raw material batch status is required.");
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
  const status = typeof params.input?.status === "string"
    ? params.input.status.toUpperCase()
    : undefined;

  if (!status) {
    throw new Error("Raw material processing status is required.");
  }

  if (status === "CANCELLED") {
    return cancelRawMaterialProcessingRun(params);
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
    throw new Error("Raw material pen health status is required.");
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
