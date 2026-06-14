import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";

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
    create(args: {
      data: {
        businessId: string;
        userId: string;
        action: RawMaterialAuditAction;
        entityType: string;
        entityId: string;
        changes: Prisma.InputJsonValue;
      };
    }): Promise<unknown>;
  };
};

export function toRawMaterialAuditChanges(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function writeRawMaterialAuditLog(
  input: RawMaterialAuditInput,
  client: RawMaterialAuditClient = prisma as RawMaterialAuditClient,
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
