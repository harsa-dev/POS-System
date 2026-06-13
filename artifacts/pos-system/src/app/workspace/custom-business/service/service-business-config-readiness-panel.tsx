import { ClipboardCheck } from "lucide-react";

import type { ServiceBusinessConfigDraft } from "./service-business-workspace-types";
import { ServiceSectionCard } from "./service-business-workspace-ui";

export function ServiceBusinessConfigReadinessPanel({
  configDraft,
  readinessChecks,
}: {
  configDraft: ServiceBusinessConfigDraft;
  readinessChecks: readonly string[];
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ServiceSectionCard
        title="Configuration draft"
        description="Hard-coded configuration preview for future service pricing, approval rules, and payment terms."
      >
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <ConfigValue label="Default tax" value={`${configDraft.defaultTaxRate}%`} />
          <ConfigValue label="Target margin" value={`${configDraft.defaultMarginRate}%`} />
          <ConfigValue
            label="Payment term"
            value={`${configDraft.defaultPaymentTermDays} days`}
          />
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          {configDraft.serviceCategories.map((category) => (
            <span
              key={category}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-600"
            >
              {category}
            </span>
          ))}
        </div>
      </ServiceSectionCard>

      <ServiceSectionCard
        title="Readiness rules before activation"
        description="These checks keep service mode from becoming a pile of attractive buttons with no backend truth behind them."
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
      </ServiceSectionCard>
    </div>
  );
}

function ConfigValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-4">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="mt-1 text-lg font-bold text-neutral-950">{value}</dd>
    </div>
  );
}
