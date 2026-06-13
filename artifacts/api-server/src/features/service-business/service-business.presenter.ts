import type { ServiceBusinessJob, ServiceBusinessMutationResult, ServiceTransitionPreview } from "./service-business.types.js";
import { serviceBusinessWorkflowStatuses } from "./service-business.types.js";
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

export function presentServiceWorkspace(jobs: readonly ServiceBusinessJob[]) {
  return {
    jobs,
    generatedAt: new Date().toISOString(),
    mode: "custom-business-service",
    dryRun: false,
    source: "api-server-prisma-sql",
  };
}

export function presentServiceJobList(jobs: readonly ServiceBusinessJob[]) {
  return {
    data: jobs,
    meta: {
      source: "api-server-prisma-sql",
      dryRun: false,
    },
  };
}

export function presentServiceBusinessMutation(result: ServiceBusinessMutationResult) {
  return result;
}
