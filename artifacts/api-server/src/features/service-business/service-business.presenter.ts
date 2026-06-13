import { serviceBusinessWorkflowStatuses, type ServiceTransitionPreview } from "./service-business.types.js";
import { serviceBusinessAllowedTransitions } from "./service-business.workflow.js";

export function presentServiceWorkflowStatuses() {
  return {
    statuses: serviceBusinessWorkflowStatuses,
    transitions: serviceBusinessAllowedTransitions,
    source: "api-server-prisma-sql-workflow-guard",
  };
}

export function presentServiceTransitionPreview(preview: ServiceTransitionPreview) {
  return preview;
}

export function presentServiceStatusMutation({
  nextStatus,
  preview,
}: {
  nextStatus: string;
  preview: ServiceTransitionPreview;
}) {
  return {
    success: true,
    dryRun: false,
    message: `Status changed to ${nextStatus}.`,
    transition: preview,
  };
}
