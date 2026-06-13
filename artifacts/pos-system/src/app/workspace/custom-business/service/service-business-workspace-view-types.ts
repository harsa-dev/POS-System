import type {
  ServiceBusinessPriority,
  ServiceBusinessWorkflowStatus,
} from "./service-business-workspace-types";

export type ServiceBusinessWorkspaceTab =
  | "overview"
  | "jobs"
  | "quotations"
  | "invoices"
  | "config";

export type ServiceBusinessStatusFilter = "all" | ServiceBusinessWorkflowStatus;
export type ServiceBusinessPriorityFilter = "all" | ServiceBusinessPriority;

export type ServiceBusinessWorkspaceFilterState = {
  searchQuery: string;
  statusFilter: ServiceBusinessStatusFilter;
  priorityFilter: ServiceBusinessPriorityFilter;
  activeTab: ServiceBusinessWorkspaceTab;
};
