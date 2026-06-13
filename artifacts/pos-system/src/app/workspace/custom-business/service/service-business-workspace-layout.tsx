import { ServiceBusinessConfigReadinessPanel } from "./service-business-config-readiness-panel";
import { ServiceBusinessJobList } from "./service-business-job-list";
import { ServiceBusinessMetricCards } from "./service-business-metric-cards";
import { ServiceBusinessPricingModulesPanel } from "./service-business-pricing-modules-panel";
import { ServiceBusinessWorkflowPipeline } from "./service-business-workflow-pipeline";
import { useServiceBusinessWorkspace } from "./use-service-business-workspace";

export function ServiceBusinessWorkspaceLayout() {
  const workspace = useServiceBusinessWorkspace();

  return (
    <div className="space-y-5">
      <ServiceBusinessMetricCards metrics={workspace.metrics} />
      <ServiceBusinessWorkflowPipeline pipeline={workspace.pipeline} />
      <ServiceBusinessJobList jobs={workspace.jobs} />
      <ServiceBusinessPricingModulesPanel
        pricingInputs={workspace.pricingInputs}
      />
      <ServiceBusinessConfigReadinessPanel
        configDraft={workspace.configDraft}
        readinessChecks={workspace.readinessChecks}
      />
    </div>
  );
}
