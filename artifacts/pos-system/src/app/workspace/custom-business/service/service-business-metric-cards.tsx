import type { ServiceBusinessSummaryResponse } from "./service-business-api-contract-types";
import { formatServiceMoney } from "./service-business-workspace-domain";

export function ServiceBusinessMetricCards({
  summary,
}: {
  summary: ServiceBusinessSummaryResponse | null;
}) {
  if (!summary) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-neutral-100" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Active service jobs",
      value: String(summary.totals.activeJobs),
      description: `${summary.totals.jobs} total · ${summary.totals.highPriorityJobs} high priority`,
    },
    {
      label: "Quote pipeline",
      value: formatServiceMoney(summary.money.quoteTotal),
      description: `${summary.totals.approvedQuotes} approved quotations`,
    },
    {
      label: "Invoice issued",
      value: formatServiceMoney(summary.money.invoiceTotal),
      description: `${formatServiceMoney(summary.money.paidAmount)} collected · ${formatServiceMoney(summary.money.pendingCollection)} pending`,
    },
    {
      label: "Collection rate",
      value: `${Math.round(summary.collection.overallRate)}%`,
      description: `${summary.totals.issuedInvoices} invoices issued`,
    },
  ] as const;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
        >
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">
            {card.label}
          </p>
          <p className="mt-3 text-2xl font-bold text-neutral-950">{card.value}</p>
          <p className="mt-2 text-sm leading-6 text-neutral-600">{card.description}</p>
        </div>
      ))}
    </div>
  );
}
