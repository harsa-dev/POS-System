import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";

export const SERVICE_BUSINESS_AUDIT_ACTION = {
  create: "CREATE",
  update: "UPDATE",
  delete: "DELETE",
} as const;

export type ServiceBusinessAuditAction =
  (typeof SERVICE_BUSINESS_AUDIT_ACTION)[keyof typeof SERVICE_BUSINESS_AUDIT_ACTION];

export const SERVICE_BUSINESS_AUDIT_ENTITY = {
  request: "ServiceRequest",
  job: "ServiceJob",
  costLine: "ServiceCostLine",
  quotation: "ServiceQuotation",
  invoice: "ServiceInvoice",
  workflowStatus: "ServiceWorkflowStatus",
} as const;

export type ServiceBusinessAuditEntity =
  (typeof SERVICE_BUSINESS_AUDIT_ENTITY)[keyof typeof SERVICE_BUSINESS_AUDIT_ENTITY];

export const SERVICE_BUSINESS_AUDIT_OPERATION = {
  createRequest: "create-request",
  updateStatus: "update-status",
  addCostLine: "add-cost-line",
  createQuotation: "create-quotation",
  approveQuotation: "approve-quotation",
  createInvoice: "create-invoice",
  recordInvoicePayment: "record-invoice-payment",
  cancelQuotation: "cancel-quotation",
  cancelInvoice: "cancel-invoice",
  reverseInvoicePayment: "reverse-invoice-payment",
} as const;

export type ServiceBusinessAuditOperation =
  (typeof SERVICE_BUSINESS_AUDIT_OPERATION)[keyof typeof SERVICE_BUSINESS_AUDIT_OPERATION];

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
