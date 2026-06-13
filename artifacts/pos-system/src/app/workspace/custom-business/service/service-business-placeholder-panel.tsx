import { Construction } from "lucide-react";

import { ServiceSectionCard } from "./service-business-workspace-ui";

const tabCopy = {
  quotations: {
    title: "Quotation workspace preview",
    description:
      "This tab is reserved for quotation drafts, approval flow, margin rules, and customer approval history.",
    items: [
      "Draft quotation list",
      "Approval status timeline",
      "Margin and discount controls",
      "Customer approval evidence",
    ],
  },
  invoices: {
    title: "Invoice workspace preview",
    description:
      "This tab is reserved for invoice creation, payment collection, due dates, and cashflow sync later.",
    items: [
      "Issued invoice list",
      "Collection progress",
      "Overdue risk indicator",
      "Cashflow sync status",
    ],
  },
} as const;

export function ServiceBusinessPlaceholderPanel({
  type,
}: {
  type: keyof typeof tabCopy;
}) {
  const content = tabCopy[type];

  return (
    <ServiceSectionCard title={content.title} description={content.description}>
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-neutral-500 shadow-sm">
            <Construction className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-950">
              Planned read-only section
            </p>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              The UI slot exists so the future API can attach here without reshaping the workspace again.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {content.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-600"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ServiceSectionCard>
  );
}
