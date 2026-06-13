import {
  pricingInputs,
  serviceConfigDraft,
  serviceJobs,
  serviceMetrics,
  servicePipeline,
} from "./service-business-workspace-data";

const readinessChecks = [
  "Create service request and job schema before enabling mutations.",
  "Define service status transition rules before exposing action buttons.",
  "Connect quotation, invoice, payment, and cashflow through one contract.",
  "Keep permission keys under custom-business.* until backend authorization exists.",
  "Do not reuse non-service workflow states for service jobs.",
] as const;

export function useServiceBusinessWorkspace() {
  return {
    status: "mocked" as const,
    metrics: serviceMetrics,
    pipeline: servicePipeline,
    jobs: serviceJobs,
    pricingInputs,
    configDraft: serviceConfigDraft,
    readinessChecks,
  };
}
