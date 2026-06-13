import type { ElementType, ReactNode } from "react";
import {
  BadgeDollarSign,
  ClipboardCheck,
  FileText,
  Gauge,
  ReceiptText,
  Settings2,
} from "lucide-react";

import {
  pricingInputs,
  serviceConfigDraft,
  serviceJobs,
  serviceMetrics,
  servicePipeline,
} from "./service-business-workspace-data";
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

const serviceWorkspaceModules: readonly {
  icon: ElementType;
  label: string;
  description: string;
}[] = [
  {
    icon: ReceiptText,
    label: "Invoice",
    description: "Generate invoices from approved quotations.",
  },
  {
    icon: FileText,
    label: "Reports",
    description: "Track profitability, service categories, and collection.",
  },
  {
    icon: Gauge,
    label: "Cashflow",
    description: "Push payment and expense events into shared finance.",
  },
  {
    icon: Settings2,
    label: "Configuration",
    description: "Control service categories, margins, and rules.",
  },
];

const readinessChecks = [
  "Create service request and job schema before enabling mutations.",
  "Define service status transition rules before exposing action buttons.",
  "Connect quotation, invoice, payment, and cashflow through one contract.",
  "Keep permission keys under custom-business.* until backend authorization exists.",
  "Do not reuse non-service workflow states for service jobs.",
] as const;

function SectionCard({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-bold text-neutral-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-neutral-600">{description}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Pill({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function ServiceJobCard({ job }: { job: ServiceBusinessJob }) {
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
          <Pill className={getServiceStatusTone(job.status)}>
            {getServiceStatusLabel(job.status)}
          </Pill>
          <Pill className={getServicePriorityTone(job.priority)}>
            {getServicePriorityLabel(job.priority)}
          </Pill>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-neutral-600">{job.summary}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-white p-3">
          <p className="text-xs font-semibold text-neutral-400">Cost base</p>
          <p className="mt-1 text-sm font-bold text-neutral-950">
            {formatServiceMoney(costBase)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-3">
          <p className="text-xs font-semibold text-neutral-400">Billable cost</p>
          <p className="mt-1 text-sm font-bold text-neutral-950">
            {formatServiceMoney(billableCost)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-3">
          <p className="text-xs font-semibold text-neutral-400">Quote total</p>
          <p className="mt-1 text-sm font-bold text-neutral-950">
            {formatServiceMoney(total)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-3">
          <p className="text-xs font-semibold text-neutral-400">Gross profit</p>
          <p className="mt-1 text-sm font-bold text-neutral-950">
            {formatServiceMoney(grossProfit)}
          </p>
        </div>
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
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-500">Quote</dt>
              <dd className="font-semibold text-neutral-900">
                {job.quote.code} · {getQuoteStatusLabel(job.quote.status)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-500">Subtotal</dt>
              <dd className="font-semibold text-neutral-900">
                {formatServiceMoney(subtotal)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-500">Discount</dt>
              <dd className="font-semibold text-neutral-900">
                -{formatServiceMoney(job.quote.discountAmount)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-500">Tax</dt>
              <dd className="font-semibold text-neutral-900">
                {formatServiceMoney(tax)}
              </dd>
            </div>
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

export function ServiceBusinessWorkspaceLayout() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {serviceMetrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">
              {metric.label}
            </p>
            <p className="mt-3 text-2xl font-bold text-neutral-950">
              {metric.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              {metric.description}
            </p>
            {metric.trendLabel ? (
              <p className="mt-3 text-xs font-semibold text-neutral-500">
                {metric.trendLabel}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <SectionCard
        title="Service workflow blueprint"
        description="A service business starts from requests, moves through job planning and quotation, then ends with delivery, invoice, and collection. Different business, different lifecycle. Truly shocking."
      >
        <div className="grid gap-4 lg:grid-cols-4">
          {servicePipeline.map((stage, index) => (
            <article
              key={stage.title}
              className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-bold text-neutral-900 shadow-sm">
                  {index + 1}
                </div>
                <h3 className="text-sm font-bold text-neutral-950">{stage.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                {stage.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {stage.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-600"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Mock service jobs"
        description="Hard-coded jobs to preview how the future service workspace should feel before Prisma models exist. No backend mutation, no fake production confidence."
      >
        <div className="space-y-4">
          {serviceJobs.map((job) => (
            <ServiceJobCard key={job.id} job={job} />
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard
          title="Service pricing inputs"
          description="These inputs define the future quotation engine. For now they are intentionally static until backend contracts exist."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {pricingInputs.map((input) => (
              <div
                key={input}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-sm font-semibold text-neutral-700"
              >
                <BadgeDollarSign className="h-4 w-4 shrink-0 text-neutral-500" />
                {input}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Workspace modules"
          description="Service mode should be composed from existing shared systems plus service-specific workflow modules."
        >
          <div className="space-y-3">
            {serviceWorkspaceModules.map(({ icon: Icon, label, description }) => (
              <div
                key={label}
                className="flex gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-neutral-700 shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-950">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-neutral-600">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Configuration draft"
          description="Hard-coded configuration preview for future service pricing, approval rules, and payment terms."
        >
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-2xl bg-neutral-50 p-4">
              <dt className="text-neutral-500">Default tax</dt>
              <dd className="mt-1 text-lg font-bold text-neutral-950">
                {serviceConfigDraft.defaultTaxRate}%
              </dd>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <dt className="text-neutral-500">Target margin</dt>
              <dd className="mt-1 text-lg font-bold text-neutral-950">
                {serviceConfigDraft.defaultMarginRate}%
              </dd>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <dt className="text-neutral-500">Payment term</dt>
              <dd className="mt-1 text-lg font-bold text-neutral-950">
                {serviceConfigDraft.defaultPaymentTermDays} days
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {serviceConfigDraft.serviceCategories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-600"
              >
                {category}
              </span>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Readiness rules before activation"
          description="These checks keep service mode from becoming a pile of attractive buttons with no backend truth behind them. Revolutionary stuff, apparently."
        >
          <div className="space-y-3">
            {readinessChecks.map((check) => (
              <div
                key={check}
                className="flex gap-3 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm leading-6 text-neutral-700"
              >
                <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-neutral-500" />
                {check}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
