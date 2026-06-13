import { Plus, Search, SlidersHorizontal } from "lucide-react";

import {
  getServicePriorityLabel,
  getServiceStatusLabel,
} from "./service-business-workspace-domain";
import type {
  ServiceBusinessPriority,
  ServiceBusinessWorkflowStatus,
} from "./service-business-workspace-types";
import type {
  ServiceBusinessPriorityFilter,
  ServiceBusinessStatusFilter,
  ServiceBusinessWorkspaceTab,
} from "./service-business-workspace-view-types";

const workspaceTabs: readonly {
  id: ServiceBusinessWorkspaceTab;
  label: string;
}[] = [
  { id: "overview", label: "Overview" },
  { id: "jobs", label: "Jobs" },
  { id: "quotations", label: "Quotations" },
  { id: "invoices", label: "Invoices" },
  { id: "config", label: "Config" },
];

export function ServiceBusinessWorkspaceHeader({
  activeTab,
  availablePriorities,
  availableStatuses,
  filteredCount,
  onActiveTabChange,
  onPriorityFilterChange,
  onResetFilters,
  onSearchQueryChange,
  onStatusFilterChange,
  priorityFilter,
  searchQuery,
  statusFilter,
  totalCount,
}: {
  activeTab: ServiceBusinessWorkspaceTab;
  availablePriorities: readonly ServiceBusinessPriority[];
  availableStatuses: readonly ServiceBusinessWorkflowStatus[];
  filteredCount: number;
  onActiveTabChange: (tab: ServiceBusinessWorkspaceTab) => void;
  onPriorityFilterChange: (priority: ServiceBusinessPriorityFilter) => void;
  onResetFilters: () => void;
  onSearchQueryChange: (query: string) => void;
  onStatusFilterChange: (status: ServiceBusinessStatusFilter) => void;
  priorityFilter: ServiceBusinessPriorityFilter;
  searchQuery: string;
  statusFilter: ServiceBusinessStatusFilter;
  totalCount: number;
}) {
  const hasActiveFilters =
    searchQuery.trim() !== "" || statusFilter !== "all" || priorityFilter !== "all";

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600">
            Mock interaction layer
          </div>
          <h2 className="mt-3 text-xl font-bold text-neutral-950">
            Service workspace control center
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
            Search, filter, and preview service workflows without touching backend data. The buttons are intentionally disabled until real contracts exist.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled
            type="button"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-400"
          >
            <Plus className="h-4 w-4" />
            New request
          </button>
          <button
            disabled
            type="button"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-400"
          >
            Draft quote
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {workspaceTabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onActiveTabChange(tab.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-neutral-950 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search by request, customer, title, or category..."
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-3 text-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-neutral-400"
          />
        </label>

        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as ServiceBusinessStatusFilter)
          }
          className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 outline-none focus:border-neutral-400"
        >
          <option value="all">All statuses</option>
          {availableStatuses.map((status) => (
            <option key={status} value={status}>
              {getServiceStatusLabel(status)}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(event) =>
            onPriorityFilterChange(event.target.value as ServiceBusinessPriorityFilter)
          }
          className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 outline-none focus:border-neutral-400"
        >
          <option value="all">All priorities</option>
          {availablePriorities.map((priority) => (
            <option key={priority} value={priority}>
              {getServicePriorityLabel(priority)}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onResetFilters}
          disabled={!hasActiveFilters}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Reset
        </button>
      </div>

      <p className="mt-3 text-xs font-semibold text-neutral-500">
        Showing {filteredCount} of {totalCount} mocked service jobs.
      </p>
    </section>
  );
}
