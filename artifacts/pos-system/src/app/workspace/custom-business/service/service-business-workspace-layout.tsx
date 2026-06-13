import {
  BadgeDollarSign,
  ClipboardCheck,
  FileText,
  Gauge,
  ReceiptText,
  Settings2,
} from "lucide-react";

const servicePipeline = [
  {
    title: "Request intake",
    description:
      "Capture service requests, customer context, scope notes, expected deadline, and initial priority.",
    items: ["Customer profile", "Service category", "Scope notes", "Target deadline"],
  },
  {
    title: "Job planning",
    description:
      "Break a request into jobs, assign responsible staff, estimate effort, and define acceptance criteria.",
    items: ["Job cards", "Assignee", "Estimated hours", "Checklist"],
  },
  {
    title: "Costing & quotation",
    description:
      "Estimate labor, operational expense, materials, margin, discount, tax, and quotation validity.",
    items: ["Labor cost", "Operational expense", "Margin", "Quote preview"],
  },
  {
    title: "Delivery & invoice",
    description:
      "Track delivery status, completion evidence, invoice generation, payment status, and customer handoff.",
    items: ["Completion proof", "Invoice", "Payment", "After-service note"],
  },
] as const;

const serviceMetrics = [
  {
    label: "Avg. service margin",
    value: "Planned",
    description: "Margin after labor, operational expense, materials, discount, and tax.",
  },
  {
    label: "Open service jobs",
    value: "Planned",
    description: "Requests that have passed intake but are not completed yet.",
  },
  {
    label: "Quote conversion",
    value: "Planned",
    description: "Approved quotations compared with drafted or rejected quotations.",
  },
  {
    label: "Invoice collection",
    value: "Planned",
    description: "Paid invoices compared with issued and overdue invoices.",
  },
] as const;

const pricingInputs = [
  "Service category",
  "Estimated labor hours",
  "Staff hourly cost",
  "Operational expense allocation",
  "Material or external vendor cost",
  "Target profit margin",
  "Tax and discount rules",
  "Invoice payment term",
] as const;

const readinessChecks = [
  "Create service request and job schema before enabling mutations.",
  "Define service status transition rules before exposing action buttons.",
  "Connect quotation, invoice, payment, and cashflow through one contract.",
  "Keep permission keys under custom-business.* until backend authorization exists.",
  "Do not reuse restaurant order states for service jobs.",
] as const;

function SectionCard({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
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
          </div>
        ))}
      </div>

      <SectionCard
        title="Service workflow blueprint"
        description="A service business does not behave like a restaurant queue. The flow starts from requests, moves through job planning and quotation, then ends with delivery, invoice, and collection. Stunningly, different businesses need different workflows. Humanity survives another revelation."
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
            {[
              [ReceiptText, "Invoice", "Generate invoices from approved quotations."],
              [FileText, "Reports", "Track profitability, service categories, and collection."],
              [Gauge, "Cashflow", "Push payment and expense events into shared finance."],
              [Settings2, "Configuration", "Control service categories, margins, and rules."],
            ].map(([Icon, label, description]) => (
              <div
                key={label as string}
                className="flex gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-neutral-700 shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-950">{label as string}</p>
                  <p className="mt-1 text-xs leading-5 text-neutral-600">
                    {description as string}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Readiness rules before activation"
        description="These checks prevent service mode from becoming a pile of attractive buttons with no backend truth behind them. Revolutionary stuff, apparently."
      >
        <div className="grid gap-3 md:grid-cols-2">
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
  );
}
