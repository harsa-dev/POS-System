import { ClipboardCheck } from "lucide-react";

import {
  calculateBillableCost,
  calculateCollectionRate,
  calculateCostBase,
  calculateGrossProfit,
  calculateQuoteSubtotal,
  calculateQuoteTax,
  calculateQuoteTotal,
  formatServiceMoney,
  getInvoiceStatusLabel,
  getQuoteStatusLabel,
  getServicePriorityLabel,
  getServicePriorityTone,
  getServiceStatusLabel,
  getServiceStatusTone,
} from "./service-business-workspace-domain";
import type { ServiceBusinessJob } from "./service-business-workspace-types";
import { ServicePill } from "./service-business-workspace-ui";

export function ServiceBusinessJobCard({ job }: { job: ServiceBusinessJob }) {
  const costBase = calculateCostBase(job.costLines);
  const billableCost = calculateBillableCost(job.costLines);
  const subtotal = calculateQuoteSubtotal(job);
  const tax = calculateQuoteTax(job);
  const total = calculateQuoteTotal(job);
  const grossProfit = calculateGrossProfit(job);
  const collectionRate = calculateCollectionRate(job.invoice, total);

  return (
    <article className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">
            {job.requestCode}
          </p>
          <h3 className="mt-1 text-base font-bold text-neutral-950">{job.title}</h3>
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            {job.customerName} · {job.customerSegment}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <ServicePill className={getServiceStatusTone(job.status)}>
            {getServiceStatusLabel(job.status)}
          </ServicePill>
          <ServicePill className={getServicePriorityTone(job.priority)}>
            {getServicePriorityLabel(job.priority)}
          </ServicePill>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-neutral-600">{job.summary}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <SummaryValue label="Cost base" value={formatServiceMoney(costBase)} />
        <SummaryValue label="Billable cost" value={formatServiceMoney(billableCost)} />
        <SummaryValue label="Quote total" value={formatServiceMoney(total)} />
        <SummaryValue label="Gross profit" value={formatServiceMoney(grossProfit)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold text-neutral-950">Cost lines</h4>
            <span className="text-xs font-semibold text-neutral-400">
              {job.costLines.length} draft inputs
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {job.costLines.map((line) => (
              <div
                key={line.id}
                className="grid gap-2 rounded-xl bg-neutral-50 p-3 text-sm md:grid-cols-[minmax(0,1fr)_130px_110px]"
              >
                <div>
                  <p className="font-semibold text-neutral-800">{line.label}</p>
                  <p className="text-xs text-neutral-500">
                    {line.category} · {line.quantity} {line.unitLabel} ·{" "}
                    {line.billable ? "billable" : "internal"}
                  </p>
                </div>
                <p className="font-semibold text-neutral-600">
                  {formatServiceMoney(line.unitCost)} / {line.unitLabel}
                </p>
                <p className="font-bold text-neutral-950">
                  {formatServiceMoney(line.quantity * line.unitCost)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <h4 className="text-sm font-bold text-neutral-950">Quote & invoice</h4>
          <dl className="mt-3 space-y-3 text-sm">
            <KeyValue label="Quote" value={`${job.quote.code} · ${getQuoteStatusLabel(job.quote.status)}`} />
            <KeyValue label="Subtotal" value={formatServiceMoney(subtotal)} />
            <KeyValue label="Discount" value={`-${formatServiceMoney(job.quote.discountAmount)}`} />
            <KeyValue label="Tax" value={formatServiceMoney(tax)} />
            <div className="border-t border-neutral-200 pt-3">
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-500">Invoice</dt>
                <dd className="font-semibold text-neutral-900">
                  {job.invoice.code} · {getInvoiceStatusLabel(job.invoice.status)}
                </dd>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-neutral-900"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-semibold text-neutral-500">
                {collectionRate}% collected · due {job.invoice.dueDate}
              </p>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <h4 className="text-sm font-bold text-neutral-950">Checklist</h4>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            {job.checklist.map((item) => (
              <li key={item} className="flex gap-2">
                <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                {item}
              </li>
            ))}
          </ul>
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
    </article>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-xs font-semibold text-neutral-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-neutral-950">{value}</p>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-semibold text-neutral-900">{value}</dd>
    </div>
  );
}
