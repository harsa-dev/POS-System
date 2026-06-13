import { useMemo, useState } from "react";

import {
  pricingInputs,
  serviceConfigDraft,
  serviceJobs,
  serviceMetrics,
  servicePipeline,
} from "./service-business-workspace-data";
import type {
  ServiceBusinessPriority,
  ServiceBusinessWorkflowStatus,
} from "./service-business-workspace-types";
import type {
  ServiceBusinessPriorityFilter,
  ServiceBusinessStatusFilter,
  ServiceBusinessWorkspaceTab,
} from "./service-business-workspace-view-types";

const readinessChecks = [
  "Create service request and job schema before enabling mutations.",
  "Define service status transition rules before exposing action buttons.",
  "Connect quotation, invoice, payment, and cashflow through one contract.",
  "Keep permission keys under custom-business.* until backend authorization exists.",
  "Do not reuse non-service workflow states for service jobs.",
] as const;

function uniqueValues<T extends string>(values: readonly T[]) {
  return Array.from(new Set(values));
}

export function useServiceBusinessWorkspace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ServiceBusinessStatusFilter>("all");
  const [priorityFilter, setPriorityFilter] =
    useState<ServiceBusinessPriorityFilter>("all");
  const [activeTab, setActiveTab] =
    useState<ServiceBusinessWorkspaceTab>("overview");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    serviceJobs[0]?.id ?? null,
  );

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredJobs = useMemo(
    () =>
      serviceJobs.filter((job) => {
        const matchesSearch =
          normalizedSearchQuery === "" ||
          [
            job.requestCode,
            job.title,
            job.customerName,
            job.customerSegment,
            job.serviceCategory,
            job.assignedTo,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearchQuery);

        const matchesStatus =
          statusFilter === "all" || job.status === statusFilter;
        const matchesPriority =
          priorityFilter === "all" || job.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
      }),
    [normalizedSearchQuery, priorityFilter, statusFilter],
  );

  const availableStatuses = useMemo(
    () => uniqueValues(serviceJobs.map((job) => job.status)) as ServiceBusinessWorkflowStatus[],
    [],
  );

  const availablePriorities = useMemo(
    () => uniqueValues(serviceJobs.map((job) => job.priority)) as ServiceBusinessPriority[],
    [],
  );

  const selectedJob = useMemo(() => {
    if (filteredJobs.length === 0) return null;
    return (
      filteredJobs.find((job) => job.id === selectedJobId) ??
      filteredJobs[0] ??
      null
    );
  }, [filteredJobs, selectedJobId]);

  function resetFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
  }

  return {
    status: "mocked" as const,
    activeTab,
    availablePriorities,
    availableStatuses,
    configDraft: serviceConfigDraft,
    filteredJobs,
    jobs: serviceJobs,
    metrics: serviceMetrics,
    pipeline: servicePipeline,
    pricingInputs,
    priorityFilter,
    readinessChecks,
    resetFilters,
    searchQuery,
    selectedJob,
    selectedJobId: selectedJob?.id ?? null,
    setActiveTab,
    setPriorityFilter,
    setSearchQuery,
    setSelectedJobId,
    setStatusFilter,
    statusFilter,
  };
}
