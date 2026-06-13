import {
  RawMaterialBatchQualityStatus,
  RawMaterialIntakeStatus,
  RawMaterialKandangHealthStatus,
  RawMaterialProcessingStatus,
} from "@prisma/client";

import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";

function rawMaterialWorkflowError(message: string, details?: Record<string, unknown>): never {
  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message,
    details,
  });
}

export function assertRawMaterialIntakeCanBeMutated(params: {
  status: RawMaterialIntakeStatus;
}) {
  if (params.status !== RawMaterialIntakeStatus.CANCELLED) return;
  rawMaterialWorkflowError("Cancelled raw material intake cannot be updated.", params);
}

export function assertRawMaterialIntakeCanBeCancelled(params: {
  status: RawMaterialIntakeStatus;
  activeBatchCount: number;
}) {
  if (params.status === RawMaterialIntakeStatus.CANCELLED) {
    rawMaterialWorkflowError("Raw material intake is already cancelled.", params);
  }

  if (params.activeBatchCount > 0) {
    rawMaterialWorkflowError("Raw material intake with active batches cannot be cancelled.", params);
  }
}

export function assertRawMaterialIntakeUsableForBatch(params: {
  status: RawMaterialIntakeStatus;
  acceptedQuantity: number;
}) {
  const statusAllowsBatch =
    params.status === RawMaterialIntakeStatus.ACCEPTED ||
    params.status === RawMaterialIntakeStatus.PARTIALLY_REJECTED;

  if (statusAllowsBatch && params.acceptedQuantity > 0) return;

  rawMaterialWorkflowError("Batch can only be created from accepted or partially rejected intake with accepted quantity.", params);
}

export function assertRawMaterialBatchRemainingWithinQuantity(params: {
  quantity: number;
  remainingQuantity: number;
}) {
  if (params.remainingQuantity >= 0 && params.remainingQuantity <= params.quantity) return;
  rawMaterialWorkflowError("Batch remaining quantity must be between zero and total quantity.", params);
}

export function assertRawMaterialBatchAcceptedForProcessing(params: {
  isActive: boolean;
  qualityStatus: RawMaterialBatchQualityStatus;
  remainingQuantity: number;
}) {
  if (!params.isActive) {
    rawMaterialWorkflowError("Input batch is inactive.", params);
  }

  if (params.qualityStatus !== RawMaterialBatchQualityStatus.ACCEPTED) {
    rawMaterialWorkflowError("Input batch must be accepted before processing.", params);
  }

  if (params.remainingQuantity <= 0) {
    rawMaterialWorkflowError("Input batch has no remaining quantity for processing.", params);
  }
}

export function assertRawMaterialProcessingInitialStatus(status: RawMaterialProcessingStatus) {
  if (status === RawMaterialProcessingStatus.PLANNED || status === RawMaterialProcessingStatus.RUNNING) return;

  rawMaterialWorkflowError("Processing run can only be created as planned or running.", { status });
}

const processingTransitions = {
  [RawMaterialProcessingStatus.PLANNED]: [
    RawMaterialProcessingStatus.PLANNED,
    RawMaterialProcessingStatus.RUNNING,
    RawMaterialProcessingStatus.CANCELLED,
  ],
  [RawMaterialProcessingStatus.RUNNING]: [
    RawMaterialProcessingStatus.RUNNING,
    RawMaterialProcessingStatus.COMPLETED,
    RawMaterialProcessingStatus.CANCELLED,
  ],
  [RawMaterialProcessingStatus.COMPLETED]: [RawMaterialProcessingStatus.COMPLETED],
  [RawMaterialProcessingStatus.CANCELLED]: [RawMaterialProcessingStatus.CANCELLED],
} as const satisfies Record<RawMaterialProcessingStatus, readonly RawMaterialProcessingStatus[]>;

export function assertRawMaterialProcessingStatusTransition(params: {
  currentStatus: RawMaterialProcessingStatus;
  nextStatus: RawMaterialProcessingStatus;
}) {
  if (processingTransitions[params.currentStatus].includes(params.nextStatus)) return;

  rawMaterialWorkflowError("Invalid raw material processing status transition.", params);
}

export function assertRawMaterialProcessingOutputWithinInput(params: {
  inputQuantity: number;
  outputQuantity: number;
  byproductQuantity: number;
  wasteQuantity: number;
}) {
  const totalOutput = params.outputQuantity + params.byproductQuantity + params.wasteQuantity;

  if (totalOutput <= params.inputQuantity) return;

  rawMaterialWorkflowError("Processing output cannot exceed input quantity.", {
    ...params,
    totalOutput,
  });
}

export function assertRawMaterialProcessingCanConsumeStock(params: {
  status: RawMaterialProcessingStatus;
}) {
  if (
    params.status === RawMaterialProcessingStatus.RUNNING ||
    params.status === RawMaterialProcessingStatus.COMPLETED
  ) {
    return;
  }

  rawMaterialWorkflowError("Only running or completed processing runs can consume stock.", params);
}

export function assertRawMaterialKandangCapacity(params: {
  capacity: number;
  occupancy: number;
}) {
  if (params.capacity >= 0 && params.occupancy >= 0 && params.occupancy <= params.capacity) return;

  rawMaterialWorkflowError("Kandang occupancy must be between zero and capacity.", params);
}

export function assertRawMaterialFeedBatchAllowed(params: {
  isActive: boolean;
  qualityStatus: RawMaterialBatchQualityStatus;
  remainingQuantity: number;
}) {
  if (params.isActive && params.qualityStatus === RawMaterialBatchQualityStatus.ACCEPTED && params.remainingQuantity > 0) return;

  rawMaterialWorkflowError("Feed batch must be active, accepted, and have remaining quantity.", params);
}

export function assertRawMaterialKandangHealthCanBeSet(params: {
  isActive: boolean;
  healthStatus: RawMaterialKandangHealthStatus;
}) {
  if (params.isActive || params.healthStatus !== RawMaterialKandangHealthStatus.CRITICAL) return;

  rawMaterialWorkflowError("Inactive kandang pen cannot be marked critical.", params);
}
