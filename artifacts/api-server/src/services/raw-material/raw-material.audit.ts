import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";

export const RAW_MATERIAL_AUDIT_ENTITY_TYPES = {
  supplier: "raw-material.supplier",
  storageLocation: "raw-material.storage-location",
  intake: "raw-material.intake",
  weighing: "raw-material.weighing",
  batch: "raw-material.batch",
  processingRun: "raw-material.processing-run",
  kandangPen: "raw-material.kandang-pen",
  stockMovement: "raw-material.stock-movement",
} as const;

export const RAW_MATERIAL_AUDIT_OPERATIONS = {
  create: "create",
  update: "update",
  updateStatus: "update-status",
  cancel: "cancel",
  deactivate: "deactivate",
  adjustStock: "adjust-stock",
  reverseAdjustment: "reverse-adjustment",
  transferStock: "transfer-stock",
  consumeProcessing: "consume-processing",
  cancelProcessingWithReversal: "cancel-processing-with-reversal",
} as const;

export type RawMaterialAuditEntityType =
  (typeof RAW_MATERIAL_AUDIT_ENTITY_TYPES)[keyof typeof RAW_MATERIAL_AUDIT_ENTITY_TYPES];

export type RawMaterialAuditOperation =
  (typeof RAW_MATERIAL_AUDIT_OPERATIONS)[keyof typeof RAW_MATERIAL_AUDIT_OPERATIONS];

export type RawMaterialAuditAction = "CREATE" | "UPDATE" | "DELETE";

export type RawMaterialAuditInput = {
  businessId: string;
  userId: string;
  action: RawMaterialAuditAction;
  entityType: string;
  entityId: string;
  changes: unknown;
};

type RawMaterialAuditClient = {
  auditLog: {
    create(args: Prisma.AuditLogCreateArgs): Promise<unknown>;
  };
};

export function toRawMaterialAuditChanges(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function writeRawMaterialAuditLog(
  input: RawMaterialAuditInput,
  client: RawMaterialAuditClient = prisma,
) {
  await client.auditLog.create({
    data: {
      businessId: input.businessId,
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      changes: toRawMaterialAuditChanges(input.changes),
    },
  });
}
