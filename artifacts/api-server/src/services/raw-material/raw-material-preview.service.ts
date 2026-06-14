import {
  RawMaterialBatchQualityStatus,
  RawMaterialIntakeStatus,
  RawMaterialProcessingStatus,
  RawMaterialUnit,
} from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { RAW_MATERIAL_QUANTITY_TOLERANCE } from "./raw-material.stock-rules.js";

type RawMaterialPreviewInput = Record<string, unknown>;

type RawMaterialPreviewResult<TEstimates extends Record<string, unknown>> = Readonly<{
  kind: "intake" | "batch" | "processing-run";
  canProceed: boolean;
  blockingIssues: string[];
  warnings: string[];
  estimates: TEstimates;
  previewedAt: string;
  source: "api-server-prisma-raw-material-preview";
}>;

function readString(input: RawMaterialPreviewInput, key: string) {
  const value = input[key];
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(input: RawMaterialPreviewInput, key: string) {
  const value = readString(input, key);
  return value.length > 0 ? value : null;
}

function readNumber(input: RawMaterialPreviewInput, key: string, fallback = 0) {
  const value = input[key];
  if (value === undefined || value === null || value === "") return fallback;

  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : Number.NaN;
}

function normalizeUpperEnum<TValue extends string>(
  value: unknown,
  allowedValues: readonly TValue[],
  fallback: TValue,
) {
  if (typeof value !== "string" || value.trim().length === 0) return fallback;
  const normalized = value.trim().toUpperCase() as TValue;
  return allowedValues.includes(normalized) ? normalized : fallback;
}

function normalizeUnit(value: unknown, fallback: RawMaterialUnit = RawMaterialUnit.KG) {
  return normalizeUpperEnum(value, Object.values(RawMaterialUnit), fallback);
}

function normalizeBatchQualityStatus(value: unknown) {
  return normalizeUpperEnum(
    value,
    Object.values(RawMaterialBatchQualityStatus),
    RawMaterialBatchQualityStatus.INSPECTION,
  );
}

function normalizeProcessingStatus(value: unknown) {
  return normalizeUpperEnum(
    value,
    Object.values(RawMaterialProcessingStatus),
    RawMaterialProcessingStatus.PLANNED,
  );
}

function percentage(numerator: number, denominator: number) {
  if (denominator <= RAW_MATERIAL_QUANTITY_TOLERANCE) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function createPreviewResult<TEstimates extends Record<string, unknown>>(params: {
  kind: RawMaterialPreviewResult<TEstimates>["kind"];
  issues: string[];
  warnings: string[];
  estimates: TEstimates;
}): RawMaterialPreviewResult<TEstimates> {
  return {
    kind: params.kind,
    canProceed: params.issues.length === 0,
    blockingIssues: params.issues,
    warnings: params.warnings,
    estimates: params.estimates,
    previewedAt: new Date().toISOString(),
    source: "api-server-prisma-raw-material-preview",
  };
}

export async function previewRawMaterialIntake(params: {
  businessId: string;
  input: RawMaterialPreviewInput;
}) {
  const issues: string[] = [];
  const warnings: string[] = [];
  const materialName = readString(params.input, "materialName");
  const supplierId = readString(params.input, "supplierId");
  const targetStorageLocationId = readString(params.input, "targetStorageLocationId") || readString(params.input, "targetStorageId");
  const receivedQuantity = readNumber(
    params.input,
    "receivedQuantity",
    readNumber(params.input, "quantity", readNumber(params.input, "quantityKg", 0)),
  );
  const acceptedQuantity = readNumber(params.input, "acceptedQuantity", receivedQuantity);
  const rejectedQuantity = readNumber(params.input, "rejectedQuantity", Math.max(receivedQuantity - acceptedQuantity, 0));
  const unit = normalizeUnit(params.input.unit);

  if (!materialName) issues.push("Material name is required.");
  if (!supplierId) issues.push("Supplier is required.");
  if (!targetStorageLocationId) issues.push("Target storage location is required.");
  if (!Number.isFinite(receivedQuantity) || receivedQuantity <= 0) issues.push("Received quantity must be greater than zero.");
  if (!Number.isFinite(acceptedQuantity) || acceptedQuantity < 0) issues.push("Accepted quantity cannot be negative.");
  if (!Number.isFinite(rejectedQuantity) || rejectedQuantity < 0) issues.push("Rejected quantity cannot be negative.");
  if (acceptedQuantity + rejectedQuantity > receivedQuantity + RAW_MATERIAL_QUANTITY_TOLERANCE) {
    issues.push("Accepted + rejected quantity cannot exceed received quantity.");
  }

  const [supplier, storage] = await Promise.all([
    supplierId
      ? prisma.rawMaterialSupplier.findFirst({
          where: { id: supplierId, businessId: params.businessId, isActive: true },
          select: { id: true, name: true, reliabilityScore: true, leadTimeDays: true },
        })
      : null,
    targetStorageLocationId
      ? prisma.rawMaterialStorageLocation.findFirst({
          where: { id: targetStorageLocationId, businessId: params.businessId, isActive: true },
          select: { id: true, code: true, name: true, capacityKg: true, usedKg: true },
        })
      : null,
  ]);

  if (supplierId && !supplier) issues.push("Supplier was not found or inactive.");
  if (targetStorageLocationId && !storage) issues.push("Target storage location was not found or inactive.");

  const storageUsedAfterAcceptance = (storage?.usedKg ?? 0) + Math.max(acceptedQuantity, 0);
  const storageAvailableAfterAcceptance = Math.max((storage?.capacityKg ?? 0) - storageUsedAfterAcceptance, 0);

  if (storage && storage.capacityKg > 0 && storageUsedAfterAcceptance > storage.capacityKg + RAW_MATERIAL_QUANTITY_TOLERANCE) {
    issues.push("Accepted quantity would exceed target storage capacity.");
  }

  if (supplier && supplier.reliabilityScore < 70) {
    warnings.push("Supplier reliability score is below 70. Review quality before accepting this intake.");
  }

  return createPreviewResult({
    kind: "intake",
    issues,
    warnings,
    estimates: {
      materialName,
      supplierId,
      supplierName: supplier?.name ?? null,
      targetStorageLocationId,
      targetStorageCode: storage?.code ?? null,
      targetStorageName: storage?.name ?? null,
      unit,
      receivedQuantity,
      acceptedQuantity,
      rejectedQuantity,
      acceptanceRate: percentage(acceptedQuantity, receivedQuantity),
      storageUsedBefore: storage?.usedKg ?? null,
      storageUsedAfterAcceptance: storage ? storageUsedAfterAcceptance : null,
      storageAvailableAfterAcceptance: storage ? storageAvailableAfterAcceptance : null,
    },
  });
}

export async function previewRawMaterialBatch(params: {
  businessId: string;
  input: RawMaterialPreviewInput;
}) {
  const issues: string[] = [];
  const warnings: string[] = [];
  const lotCode = readOptionalString(params.input, "lotCode");
  const intakeId = readString(params.input, "intakeId");
  const storageLocationId = readString(params.input, "storageLocationId") || readString(params.input, "storageId");
  const quantity = readNumber(params.input, "quantity", readNumber(params.input, "quantityKg", 0));
  const remainingQuantity = readNumber(params.input, "remainingQuantity", quantity);
  const qualityStatus = normalizeBatchQualityStatus(params.input.qualityStatus);

  if (!intakeId) issues.push("Intake is required.");
  if (!storageLocationId) issues.push("Storage location is required.");
  if (!Number.isFinite(quantity) || quantity <= 0) issues.push("Batch quantity must be greater than zero.");
  if (!Number.isFinite(remainingQuantity) || remainingQuantity < 0) issues.push("Remaining quantity cannot be negative.");
  if (remainingQuantity > quantity + RAW_MATERIAL_QUANTITY_TOLERANCE) {
    issues.push("Remaining quantity cannot exceed batch quantity.");
  }

  const [intake, storage, lotConflict, aggregate] = await Promise.all([
    intakeId
      ? prisma.rawMaterialIntake.findFirst({
          where: { id: intakeId, businessId: params.businessId },
          select: {
            id: true,
            referenceNumber: true,
            materialName: true,
            unit: true,
            acceptedQuantity: true,
            qualityStatus: true,
          },
        })
      : null,
    storageLocationId
      ? prisma.rawMaterialStorageLocation.findFirst({
          where: { id: storageLocationId, businessId: params.businessId, isActive: true },
          select: { id: true, code: true, name: true, capacityKg: true, usedKg: true },
        })
      : null,
    lotCode
      ? prisma.rawMaterialBatch.findFirst({
          where: { businessId: params.businessId, lotCode },
          select: { id: true },
        })
      : null,
    intakeId
      ? prisma.rawMaterialBatch.aggregate({
          where: { businessId: params.businessId, intakeId, isActive: true },
          _sum: { quantity: true },
        })
      : Promise.resolve({ _sum: { quantity: 0 } }),
  ]);

  if (intakeId && !intake) issues.push("Intake was not found.");
  if (storageLocationId && !storage) issues.push("Storage location was not found or inactive.");
  if (lotConflict) issues.push("Lot code already exists for this business.");

  const existingBatchQuantity = aggregate._sum.quantity ?? 0;
  const nextIntakeBatchQuantity = existingBatchQuantity + Math.max(quantity, 0);

  if (intake) {
    const usableStatus =
      intake.qualityStatus === RawMaterialIntakeStatus.ACCEPTED ||
      intake.qualityStatus === RawMaterialIntakeStatus.PARTIALLY_REJECTED;

    if (!usableStatus || intake.acceptedQuantity <= 0) {
      issues.push("Batch can only be created from accepted or partially rejected intake with accepted quantity.");
    }

    if (nextIntakeBatchQuantity > intake.acceptedQuantity + RAW_MATERIAL_QUANTITY_TOLERANCE) {
      issues.push("Batch quantity would exceed accepted intake quantity.");
    }
  }

  if (qualityStatus !== RawMaterialBatchQualityStatus.ACCEPTED) {
    warnings.push("Batch is not accepted yet, so processing and kandang feed usage will remain blocked.");
  }

  return createPreviewResult({
    kind: "batch",
    issues,
    warnings,
    estimates: {
      lotCode,
      intakeId,
      intakeReferenceNumber: intake?.referenceNumber ?? null,
      materialName: intake?.materialName ?? null,
      unit: intake?.unit ?? null,
      storageLocationId,
      storageCode: storage?.code ?? null,
      storageName: storage?.name ?? null,
      quantity,
      remainingQuantity,
      qualityStatus,
      existingBatchQuantity,
      nextIntakeBatchQuantity,
      acceptedQuantity: intake?.acceptedQuantity ?? null,
      intakeRemainingAcceptedQuantity: intake ? Math.max(intake.acceptedQuantity - nextIntakeBatchQuantity, 0) : null,
    },
  });
}

export async function previewRawMaterialProcessingRun(params: {
  businessId: string;
  input: RawMaterialPreviewInput;
}) {
  const issues: string[] = [];
  const warnings: string[] = [];
  const inputBatchId = readString(params.input, "inputBatchId") || readString(params.input, "batchId");
  const outputName = readOptionalString(params.input, "outputName") ?? "Preview output";
  const inputQuantity = readNumber(params.input, "inputQuantity", readNumber(params.input, "inputKg", 0));
  const expectedYieldPercent = readNumber(params.input, "expectedYieldPercent", Number.NaN);
  const outputQuantity = readNumber(
    params.input,
    "outputQuantity",
    Number.isFinite(expectedYieldPercent) ? inputQuantity * (expectedYieldPercent / 100) : 0,
  );
  const byproductQuantity = readNumber(
    params.input,
    "byproductQuantity",
    Math.max(inputQuantity - outputQuantity, 0),
  );
  const wasteQuantity = readNumber(params.input, "wasteQuantity", 0);
  const status = normalizeProcessingStatus(params.input.status);

  if (!inputBatchId) issues.push("Input batch is required.");
  if (!Number.isFinite(inputQuantity) || inputQuantity <= 0) issues.push("Input quantity must be greater than zero.");
  if (!Number.isFinite(outputQuantity) || outputQuantity < 0) issues.push("Output quantity cannot be negative.");
  if (!Number.isFinite(byproductQuantity) || byproductQuantity < 0) issues.push("Byproduct quantity cannot be negative.");
  if (!Number.isFinite(wasteQuantity) || wasteQuantity < 0) issues.push("Waste quantity cannot be negative.");

  const batch = inputBatchId
    ? await prisma.rawMaterialBatch.findFirst({
        where: { id: inputBatchId, businessId: params.businessId },
        include: { storageLocation: true },
      })
    : null;

  if (inputBatchId && !batch) issues.push("Input batch was not found.");

  if (batch) {
    if (!batch.isActive) issues.push("Input batch is inactive.");
    if (batch.qualityStatus !== RawMaterialBatchQualityStatus.ACCEPTED) {
      issues.push("Input batch must be accepted before processing.");
    }
    if (inputQuantity > batch.remainingQuantity + RAW_MATERIAL_QUANTITY_TOLERANCE) {
      issues.push("Input quantity would exceed remaining batch quantity.");
    }
    if (batch.unit !== RawMaterialUnit.KG) {
      issues.push("Processing preview currently supports KG batches only.");
    }
    if (batch.storageLocation.usedKg + RAW_MATERIAL_QUANTITY_TOLERANCE < inputQuantity) {
      issues.push("Source storage does not contain enough quantity for this processing preview.");
    }
  }

  const totalOutputQuantity = outputQuantity + byproductQuantity + wasteQuantity;
  if (totalOutputQuantity > inputQuantity + RAW_MATERIAL_QUANTITY_TOLERANCE) {
    issues.push("Processing output + byproduct + waste cannot exceed input quantity.");
  }

  if (status === RawMaterialProcessingStatus.CANCELLED || status === RawMaterialProcessingStatus.COMPLETED) {
    warnings.push("Create preview should normally start as planned or running, not completed/cancelled.");
  }

  const remainingAfterProcessing = batch ? Math.max(batch.remainingQuantity - Math.max(inputQuantity, 0), 0) : null;
  const storageUsedAfterProcessing = batch ? Math.max(batch.storageLocation.usedKg - Math.max(inputQuantity, 0), 0) : null;

  return createPreviewResult({
    kind: "processing-run",
    issues,
    warnings,
    estimates: {
      inputBatchId,
      inputBatchLotCode: batch?.lotCode ?? null,
      materialName: batch?.materialName ?? null,
      sourceStorageLocationId: batch?.storageLocationId ?? null,
      sourceStorageCode: batch?.storageLocation.code ?? null,
      outputName,
      inputQuantity,
      outputQuantity,
      byproductQuantity,
      wasteQuantity,
      totalOutputQuantity,
      yieldPercent: percentage(outputQuantity, inputQuantity),
      lossQuantity: Math.max(inputQuantity - totalOutputQuantity, 0),
      remainingBeforeProcessing: batch?.remainingQuantity ?? null,
      remainingAfterProcessing,
      storageUsedBeforeProcessing: batch?.storageLocation.usedKg ?? null,
      storageUsedAfterProcessing,
      status,
    },
  });
}
