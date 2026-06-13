import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import {
  findServiceWorkflowTargetWithDelegate,
  loadServiceWorkflowReadinessWithDelegate,
} from "./service-business.delegate.repository.js";
import type {
  ServiceBusinessWorkflowStatus,
  ServiceWorkflowTargetRow,
} from "./service-business.types.js";

export async function findServiceWorkflowTarget(businessId: string, id: string) {
  return findServiceWorkflowTargetWithDelegate(businessId, id);
}

export async function loadServiceWorkflowReadiness(target: ServiceWorkflowTargetRow) {
  return loadServiceWorkflowReadinessWithDelegate(target);
}

export async function updateServiceWorkflowStatus({
  target,
  nextStatus,
  actorName,
  note,
}: {
  target: ServiceWorkflowTargetRow;
  nextStatus: ServiceBusinessWorkflowStatus;
  actorName: string;
  note?: string;
}) {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`
      UPDATE service_requests
      SET status = ${nextStatus}::service_business_workflow_status,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${target.requestId}
    `);

    if (target.jobId) {
      await tx.$executeRaw(Prisma.sql`
        UPDATE service_jobs
        SET status = ${nextStatus}::service_business_workflow_status,
            started_at = CASE WHEN ${nextStatus} = 'IN_PROGRESS' THEN COALESCE(started_at, CURRENT_TIMESTAMP) ELSE started_at END,
            completed_at = CASE WHEN ${nextStatus} IN ('DELIVERED', 'CLOSED') THEN COALESCE(completed_at, CURRENT_TIMESTAMP) ELSE completed_at END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${target.jobId}
      `);
    }

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO service_timeline_items (id, request_id, label, actor_name)
      VALUES (
        gen_random_uuid()::text,
        ${target.requestId},
        ${note ? `Status updated to ${nextStatus}: ${note}` : `Status updated to ${nextStatus}`},
        ${actorName}
      )
    `);
  });
}
