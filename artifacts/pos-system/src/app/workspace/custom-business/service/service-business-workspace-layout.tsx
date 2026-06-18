import { useState } from "react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/api";
import { serviceBusinessApi } from "./service-business-api";
import { ServiceBusinessEmptyState } from "./service-business-empty-state";
import { ServiceBusinessInvoicesPanel } from "./service-business-invoices-panel";
import { ServiceBusinessJobDetailPanel } from "./service-business-job-detail-panel";
import { ServiceBusinessJobList } from "./service-business-job-list";
import { ServiceBusinessMetricCards } from "./service-business-metric-cards";
import { ServiceBusinessNewRequestModal } from "./service-business-preview-modal";
import { ServiceBusinessQuotationsPanel } from "./service-business-quotations-panel";
import { ServiceBusinessWorkflowPipeline } from "./service-business-workflow-pipeline";
import { ServiceBusinessWorkspaceHeader } from "./service-business-workspace-header";
import { ServiceBusinessWorkspaceSkeleton } from "./service-business-workspace-skeleton";
import { useServiceBusinessWorkspace } from "./use-service-business-workspace";
import type { ServiceBusinessWorkflowStatus } from "./service-business-workspace-types";

export function ServiceBusinessWorkspaceLayout() {
  const workspace = useServiceBusinessWorkspace();
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  async function handleUpdateStatus(nextStatus: ServiceBusinessWorkflowStatus) {
    const jobId = workspace.selectedJobId;
    if (!jobId || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const result = await serviceBusinessApi.updateJobStatus({ jobId, nextStatus });

      if (!result.success) {
        toast.error(result.message || "Failed to update status.");
        return;
      }

      await workspace.reload();
      toast.success("Job status updated.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update status."));
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  if (workspace.loadStatus === "loading") {
    return <ServiceBusinessWorkspaceSkeleton />;
  }

  if (workspace.loadStatus === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <p className="font-bold">Could not load service workspace</p>
        <p className="mt-1">{workspace.errorMessage}</p>
        <button
          type="button"
          onClick={() => workspace.reload()}
          className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const hasFilteredJobs = workspace.filteredJobs.length > 0;
  const showJobs = workspace.activeTab === "overview" || workspace.activeTab === "jobs";

  return (
    <div className="space-y-5">
      <ServiceBusinessMetricCards summary={workspace.summary} />

      <ServiceBusinessWorkspaceHeader
        activeTab={workspace.activeTab}
        availablePriorities={workspace.availablePriorities}
        availableStatuses={workspace.availableStatuses}
        filteredCount={workspace.filteredJobs.length}
        isRefreshing={workspace.isRefreshing}
        onActiveTabChange={workspace.setActiveTab}
        onOpenNewRequest={() => setShowNewRequestModal(true)}
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
        <ServiceBusinessWorkflowPipeline />
      ) : null}

      {showJobs ? (
        hasFilteredJobs ? (
          <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_460px]">
            <ServiceBusinessJobList
              jobs={workspace.filteredJobs}
              onSelectJob={workspace.setSelectedJobId}
              selectedJobId={workspace.selectedJobId}
            />
            <ServiceBusinessJobDetailPanel
              isUpdating={isUpdatingStatus}
              job={workspace.selectedJob}
              onClose={() => workspace.setSelectedJobId(null)}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
        ) : (
          <ServiceBusinessEmptyState onResetFilters={workspace.resetFilters} />
        )
      ) : null}

      {workspace.activeTab === "quotations" ? (
        <ServiceBusinessQuotationsPanel jobs={workspace.jobs} />
      ) : null}

      {workspace.activeTab === "invoices" ? (
        <ServiceBusinessInvoicesPanel jobs={workspace.jobs} />
      ) : null}

      {showNewRequestModal ? (
        <ServiceBusinessNewRequestModal
          onClose={() => setShowNewRequestModal(false)}
          onSuccess={() => {
            setShowNewRequestModal(false);
            void workspace.reload();
          }}
        />
      ) : null}
    </div>
  );
}
