import { RawMaterialBatchQualityStatus, RawMaterialUnit } from "@prisma/client";

import type {
  NormalizedRawMaterialBatchPayload,
  RawMaterialBatchPayload,
  RawMaterialBatchUpdatePayload,
} from "./raw-material-batch.types";

const unitValues = Object.values(RawMaterialUnit);
const qualityStatusValues = Object.values(RawMaterialBatchQualityStatus);

function readRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }

  return value.trim();
}

function readOptionalString(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw new Error("Optional text fields must be strings");
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readRequiredNumber(value: unknown, fieldName: string) {
  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  return numberValue;
}

function readOptionalBoolean(value: unknown, fallback: boolean) {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "boolean") throw new Error("isActive must be a boolean");
  return value;
}

function readOptionalDate(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const dateValue = new Date(String(value));

  if (Number.isNaN(dateValue.getTime())) {
    throw new Error("expiryDate must be a valid date");
  }

  return dateValue;
}

function readUnit(value: unknown) {
  if (value === undefined || value === null || value === "") return RawMaterialUnit.KG;
  if (typeof value !== "string" || !unitValues.includes(value as RawMaterialUnit)) {
    throw new Error("unit is invalid");
  }

  return value as RawMaterialUnit;
}

function readQualityStatus(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return RawMaterialBatchQualityStatus.INSPECTION;
  }

  if (typeof value !== "string" || !qualityStatusValues.includes(value as RawMaterialBatchQualityStatus)) {
    throw new Error("qualityStatus is invalid");
  }

  return value as RawMaterialBatchQualityStatus;
}

function assertQuantityShape(quantity: number, remainingQuantity: number) {
  if (quantity <= 0) {
    throw new Error("quantity must be greater than 0");
  }

  if (remainingQuantity < 0) {
    throw new Error("remainingQuantity cannot be negative");
  }

  if (remainingQuantity > quantity) {
    throw new Error("remainingQuantity cannot be greater than quantity");
  }
}

export function normalizeRawMaterialBatchPayload(
  payload: RawMaterialBatchPayload,
): NormalizedRawMaterialBatchPayload {
  const quantity = readRequiredNumber(payload.quantity, "quantity");
  const remainingQuantity = payload.remainingQuantity === undefined
    ? quantity
    : readRequiredNumber(payload.remainingQuantity, "remainingQuantity");

  assertQuantityShape(quantity, remainingQuantity);

  return {
    lotCode: readRequiredString(payload.lotCode, "lotCode"),
    intakeId: readRequiredString(payload.intakeId, "intakeId"),
    storageLocationId: readRequiredString(payload.storageLocationId, "storageLocationId"),
    materialName: readRequiredString(payload.materialName, "materialName"),
    unit: readUnit(payload.unit),
    quantity,
    remainingQuantity,
    qualityStatus: readQualityStatus(payload.qualityStatus),
    expiryDate: readOptionalDate(payload.expiryDate),
    isActive: readOptionalBoolean(payload.isActive, true),
    notes: readOptionalString(payload.notes),
  };
}

export function normalizeRawMaterialBatchUpdatePayload(
  payload: RawMaterialBatchPayload,
): RawMaterialBatchUpdatePayload {
  const updatePayload: RawMaterialBatchUpdatePayload = {};

  if (payload.lotCode !== undefined) updatePayload.lotCode = readRequiredString(payload.lotCode, "lotCode");
  if (payload.intakeId !== undefined) updatePayload.intakeId = readRequiredString(payload.intakeId, "intakeId");
  if (payload.storageLocationId !== undefined) updatePayload.storageLocationId = readRequiredString(payload.storageLocationId, "storageLocationId");
  if (payload.materialName !== undefined) updatePayload.materialName = readRequiredString(payload.materialName, "materialName");
  if (payload.unit !== undefined) updatePayload.unit = readUnit(payload.unit);
  if (payload.quantity !== undefined) updatePayload.quantity = readRequiredNumber(payload.quantity, "quantity");
  if (payload.remainingQuantity !== undefined) updatePayload.remainingQuantity = readRequiredNumber(payload.remainingQuantity, "remainingQuantity");
  if (payload.qualityStatus !== undefined) updatePayload.qualityStatus = readQualityStatus(payload.qualityStatus);
  if (payload.expiryDate !== undefined) updatePayload.expiryDate = readOptionalDate(payload.expiryDate);
  if (payload.isActive !== undefined) updatePayload.isActive = readOptionalBoolean(payload.isActive, true);
  if (payload.notes !== undefined) updatePayload.notes = readOptionalString(payload.notes);

  return updatePayload;
}

export function assertRawMaterialBatchQuantityShape(quantity: number, remainingQuantity: number) {
  assertQuantityShape(quantity, remainingQuantity);
}
