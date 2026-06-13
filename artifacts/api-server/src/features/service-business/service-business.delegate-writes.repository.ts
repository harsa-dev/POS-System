import { randomUUID } from "node:crypto";

import {
  ServiceBusinessCostCategory as PrismaServiceBusinessCostCategory,
  ServiceBusinessPriority as PrismaServiceBusinessPriority,
  ServiceBusinessWorkflowStatus as PrismaServiceBusinessWorkflowStatus,
} from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import type {
  ServiceBusinessCostCategory,
  ServiceBusinessPriority,
} from "./service-business.types.js";
import type { ServiceRequestTarget } from "./service-business.crud.repository.js";

function toPrismaPriority(priority: ServiceBusinessPriority) {
  return priority as PrismaServiceBusinessPriority;
}

function toPrismaCostCategory(category: ServiceBusinessCostCategory) {
  return category.toUpperCase() as PrismaServiceBusinessCostCategory;
}

export async function createServiceRequestRecordWithDelegate({
  businessId,
  requestCode,
  title,
  customerName,
  customerSegment,
  serviceCategory,
  priority,
  summary,
  assignedTo,
  dueDate,
  actorName,
}: {
  businessId: string;
  requestCode: string;
  title: string;
  customerName: string;
  customerSegment: string;
  serviceCategory: string;
  priority: ServiceBusinessPriority;
  summary: string;
  assignedTo: string;
  dueDate: Date | null;
  actorName: string;
}) {
  const requestId = randomUUID();
  const jobId = randomUUID();

  await prisma.serviceRequest.create({
    data: {
      id: requestId,
      businessId,
      requestCode,
      customerName,
      customerSegment,
      serviceCategory,
      title,
      summary: summary || null,
      status: PrismaServiceBusinessWorkflowStatus.REQUEST_INTAKE,
      priority: toPrismaPriority(priority),
      dueDate,
      assignedTo,
      jobs: {
        create: {
          id: jobId,
          title,
          assignedTo,
          status: PrismaServiceBusinessWorkflowStatus.REQUEST_INTAKE,
        },
      },
      timeline: {
        create: {
          id: randomUUID(),
          label: "Request received",
          actorName,
        },
      },
    },
  });

  return { requestId, jobId };
}

export async function createServiceCostLineRecordWithDelegate({
  target,
  label,
  category,
  quantity,
  unitLabel,
  unitCost,
  billable,
}: {
  target: ServiceRequestTarget;
  label: string;
  category: ServiceBusinessCostCategory;
  quantity: number;
  unitLabel: string;
  unitCost: number;
  billable: boolean;
}) {
  if (!target.jobId) return;

  await prisma.serviceCostLine.create({
    data: {
      id: randomUUID(),
      jobId: target.jobId,
      label,
      category: toPrismaCostCategory(category),
      quantity,
      unitLabel,
      unitCost: Math.round(unitCost),
      billable,
    },
  });
}
