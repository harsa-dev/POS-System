import type { ElementType } from "react";
import { BadgeDollarSign, FileText, Gauge, ReceiptText, Settings2 } from "lucide-react";

import { ServiceSectionCard } from "./service-business-workspace-ui";

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

export function ServiceBusinessPricingModulesPanel({
  pricingInputs,
}: {
  pricingInputs: readonly string[];
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <ServiceSectionCard
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
      </ServiceSectionCard>

      <ServiceSectionCard
        title="Workspace modules"
        description="Service mode should be composed from shared systems plus service-specific workflow modules."
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
      </ServiceSectionCard>
    </div>
  );
}
