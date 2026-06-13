import {
  findServiceWorkflowTargetWithDelegate,
  loadServiceWorkflowReadinessWithDelegate,
} from "./service-business.delegate.repository.js";
import { updateServiceWorkflowStatusWithDelegate } from "./service-business.delegate-writes.repository.js";
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
  return updateServiceWorkflowStatusWithDelegate({
    target,
    nextStatus,
    actorName,
    note,
  });
}
