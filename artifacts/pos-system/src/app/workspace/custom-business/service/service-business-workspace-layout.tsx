import { ServiceBusinessConfigReadinessPanel } from "./service-business-config-readiness-panel";
import { ServiceBusinessEmptyState } from "./service-business-empty-state";
import { ServiceBusinessJobList } from "./service-business-job-list";
import { ServiceBusinessMetricCards } from "./service-business-metric-cards";
import { ServiceBusinessPlaceholderPanel } from "./service-business-placeholder-panel";
import { ServiceBusinessPricingModulesPanel } from "./service-business-pricing-modules-panel";
import { ServiceBusinessWorkflowPipeline } from "./service-business-workflow-pipeline";
import { ServiceBusinessWorkspaceHeader } from "./service-business-workspace-header";
import { useServiceBusinessWorkspace } from "./use-service-business-workspace";

export function ServiceBusinessWorkspaceLayout() {
  const workspace = useServiceBusinessWorkspace();
  const hasFilteredJobs = workspace.filteredJobs.length > 0;
  const shouldShowJobs =
    workspace.activeTab === "overview" || workspace.activeTab === "jobs";

  return (
    <div className="space-y-5">
      <ServiceBusinessMetricCards metrics={workspace.metrics} />
      <ServiceBusinessWorkspaceHeader
        activeTab={workspace.activeTab}
        availablePriorities={workspace.availablePriorities}
        availableStatuses={workspace.availableStatuses}
        filteredCount={workspace.filteredJobs.length}
        onActiveTabChange={workspace.setActiveTab}
        onPriorityFilterChange={workspace.setPriorityFilter}
        onResetFilters={workspace.resetFilters}
        onSearchQueryChange={workspace.setSearchQuery}
        onStatusFilterChange={workspace.setStatusFilter}
        priorityFilter={workspace.priorityFilter}
        searchQuery={workspace.searchQuery}
        statusFilter={workspace.statusFilter}
        totalCount={workspace.jobs.length}
      />

      {workspace.activeTab === "overview" ? (
        <ServiceBusinessWorkflowPipeline pipeline={workspace.pipeline} />
      ) : null}

      {shouldShowJobs ? (
        hasFilteredJobs ? (
          <ServiceBusinessJobList jobs={workspace.filteredJobs} />
        ) : (
          <ServiceBusinessEmptyState onResetFilters={workspace.resetFilters} />
        )
      ) : null}

      {workspace.activeTab === "quotations" ? (
        <ServiceBusinessPlaceholderPanel type="quotations" />
      ) : null}

      {workspace.activeTab === "invoices" ? (
        <ServiceBusinessPlaceholderPanel type="invoices" />
      ) : null}

      {workspace.activeTab === "overview" ? (
        <ServiceBusinessPricingModulesPanel
          pricingInputs={workspace.pricingInputs}
        />
      ) : null}

      {workspace.activeTab === "overview" || workspace.activeTab === "config" ? (
        <ServiceBusinessConfigReadinessPanel
          configDraft={workspace.configDraft}
          readinessChecks={workspace.readinessChecks}
        />
      ) : null}
    </div>
  );
}
