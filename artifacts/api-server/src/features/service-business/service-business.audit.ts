import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";

export type ServiceBusinessAuditAction = "CREATE" | "UPDATE" | "DELETE";

export type ServiceBusinessAuditInput = {
  businessId: string;
  userId: string;
  action: ServiceBusinessAuditAction;
  entityType: string;
  entityId: string;
  changes: Prisma.InputJsonValue;
};

export async function writeServiceBusinessAuditLog({
  businessId,
  userId,
  action,
  entityType,
  entityId,
  changes,
}: ServiceBusinessAuditInput) {
  await prisma.auditLog.create({
    data: {
      businessId,
      userId,
      action,
      entityType,
      entityId,
      changes,
    },
  });
}
