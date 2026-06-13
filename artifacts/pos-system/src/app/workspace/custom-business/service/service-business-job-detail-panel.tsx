import { X } from "lucide-react";

import { ServiceBusinessActionRail } from "./service-business-action-rail";
import { mapServiceJobToViewModel } from "./service-business-view-model";
import {
  getServicePriorityTone,
  getServiceStatusTone,
} from "./service-business-workspace-domain";
import type { ServiceBusinessJob } from "./service-business-workspace-types";
import { ServicePill, ServiceSectionCard } from "./service-business-workspace-ui";

export function ServiceBusinessJobDetailPanel({
  job,
  onClose,
}: {
  job: ServiceBusinessJob | null;
  onClose: () => void;
}) {
  if (!job) return null;

  const viewModel = mapServiceJobToViewModel(job);

  return (
    <ServiceSectionCard
      title="Selected service job detail"
      description="Read-only detail panel for the selected mock service job. Backend mutation can attach here later without changing the surrounding workspace."
    >
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">
              {viewModel.requestCode}
            </p>
            <h3 className="mt-1 text-lg font-bold text-neutral-950">
              {viewModel.title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              {viewModel.customerLabel}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <ServicePill className={getServiceStatusTone(job.status)}>
              {viewModel.statusLabel}
            </ServicePill>
            <ServicePill className={getServicePriorityTone(job.priority)}>
              {viewModel.priorityLabel}
            </ServicePill>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500"
              aria-label="Close selected job detail"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <DetailValue label="Category" value={viewModel.serviceCategory} />
          <DetailValue label="Assignee" value={viewModel.assignedTo} />
          <DetailValue label="Due date" value={viewModel.dueDate} />
          <DetailValue label="Quote total" value={viewModel.quoteTotalLabel} />
          <DetailValue label="Gross profit" value={viewModel.grossProfitLabel} />
          <DetailValue label="Collection" value={viewModel.collectionLabel} />
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <h4 className="text-sm font-bold text-neutral-950">Costing summary</h4>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <KeyValue label="Cost base" value={viewModel.costBaseLabel} />
              <KeyValue label="Billable cost" value={viewModel.billableCostLabel} />
              <KeyValue label="Quote subtotal" value={viewModel.quoteSubtotalLabel} />
              <KeyValue label="Tax" value={viewModel.quoteTaxLabel} />
              <KeyValue label="Quote total" value={viewModel.quoteTotalLabel} />
              <KeyValue label="Gross profit" value={viewModel.grossProfitLabel} />
            </dl>
          </div>

          <ServiceBusinessActionRail job={job} />
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <h4 className="text-sm font-bold text-neutral-950">Quote and invoice</h4>
            <dl className="mt-3 space-y-3 text-sm">
              <InlineValue label="Quote" value={viewModel.quoteLabel} />
              <InlineValue label="Invoice" value={viewModel.invoiceLabel} />
              <InlineValue label="Due date" value={viewModel.dueDate} />
            </dl>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-neutral-900"
                style={{ width: `${viewModel.collectionRate}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-neutral-500">
              {viewModel.collectionLabel}
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <h4 className="text-sm font-bold text-neutral-950">Timeline</h4>
            <div className="mt-3 space-y-3 text-sm">
              {job.timeline.map((item) => (
                <div key={`${job.id}-${item.label}-${item.at}`} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-neutral-900" />
                  <div>
                    <p className="font-semibold text-neutral-800">{item.label}</p>
                    <p className="text-xs text-neutral-500">
                      {item.at} · {item.actor}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4">
          <h4 className="text-sm font-bold text-neutral-950">Execution checklist</h4>
          <ul className="mt-3 grid gap-2 text-sm text-neutral-600 md:grid-cols-2">
            {job.checklist.map((item) => (
              <li key={item} className="rounded-xl bg-neutral-50 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ServiceSectionCard>
  );
}

function DetailValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <p className="text-xs font-semibold text-neutral-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-neutral-950">{value}</p>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-3">
      <dt className="text-xs font-semibold text-neutral-400">{label}</dt>
      <dd className="mt-1 font-bold text-neutral-950">{value}</dd>
    </div>
  );
}

function InlineValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-semibold text-neutral-900">{value}</dd>
    </div>
  );
}
