import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { serviceBusinessApi } from "./service-business-api";
import type { ServiceBusinessSummaryResponse } from "./service-business-api-contract-types";
import type {
  ServiceBusinessJob,
  ServiceBusinessPriority,
  ServiceBusinessWorkflowStatus,
} from "./service-business-workspace-types";
import type {
  ServiceBusinessPriorityFilter,
  ServiceBusinessStatusFilter,
  ServiceBusinessWorkspaceTab,
} from "./service-business-workspace-view-types";

export type WorkspaceLoadStatus = "loading" | "ready" | "error";

export function useServiceBusinessWorkspace() {
  const [loadStatus, setLoadStatus] = useState<WorkspaceLoadStatus>("loading");
  const [jobs, setJobs] = useState<readonly ServiceBusinessJob[]>([]);
  const [summary, setSummary] = useState<ServiceBusinessSummaryResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ServiceBusinessStatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<ServiceBusinessPriorityFilter>("all");
  const [activeTab, setActiveTab] = useState<ServiceBusinessWorkspaceTab>("overview");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const initialSelectedRef = useRef(false);

  const load = useCallback(async (isReload = false) => {
    if (isReload) {
      setIsRefreshing(true);
    } else {
      setLoadStatus("loading");
    }
    setErrorMessage(null);

    try {
      const [jobsResult, summaryResult] = await Promise.all([
        serviceBusinessApi.listJobs(),
        serviceBusinessApi.getSummary(),
      ]);
      setJobs(jobsResult);
      setSummary(summaryResult);
      setLoadStatus("ready");
    } catch {
      setLoadStatus("error");
      setErrorMessage("Failed to load service workspace. Check your connection and try again.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!initialSelectedRef.current && jobs.length > 0) {
      initialSelectedRef.current = true;
      setSelectedJobId(jobs[0]?.id ?? null);
    }
  }, [jobs]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredJobs = useMemo(() => {
    if (loadStatus !== "ready") return [];
    return jobs.filter((job) => {
      const matchesSearch =
        normalizedSearch === "" ||
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
          .includes(normalizedSearch);

      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || job.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [jobs, normalizedSearch, statusFilter, priorityFilter, loadStatus]);

  const availableStatuses = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.status))) as ServiceBusinessWorkflowStatus[],
    [jobs],
  );

  const availablePriorities = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.priority))) as ServiceBusinessPriority[],
    [jobs],
  );

  const selectedJob = useMemo(
    () =>
      filteredJobs.length === 0
        ? null
        : (filteredJobs.find((j) => j.id === selectedJobId) ?? filteredJobs[0] ?? null),
    [filteredJobs, selectedJobId],
  );

  function resetFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
  }

  function reload() {
    return load(true);
  }

  return {
    loadStatus,
    isRefreshing,
    errorMessage,
    activeTab,
    availablePriorities,
    availableStatuses,
    filteredJobs,
    jobs,
    summary,
    priorityFilter,
    resetFilters,
    reload,
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
