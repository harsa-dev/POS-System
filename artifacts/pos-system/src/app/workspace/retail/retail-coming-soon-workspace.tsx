import { Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
const moduleLabels: Record<string, { label: string; description: string; tier: string }> = {
  "customers-loyalty": {
    label: "Customers & Loyalty",
    description: "Customer CRM, member points, repeat rate, and loyalty liability dashboard.",
    tier: "Retail Growth",
  },
  "staff-shifts": {
    label: "Retail Staff & Shifts",
    description: "Staff shifts, register variance, handover, and staff performance reporting.",
    tier: "Retail Growth",
  },
  forecasting: {
    label: "Forecasting",
    description: "Demand planning, reorder suggestions, dead stock alerts, and purchase budgets.",
    tier: "Retail Growth",
  },
  "multi-location": {
    label: "Multi-location",
    description: "Branch dashboard for outlet comparison, stock transfers, and branch health.",
    tier: "Retail Enterprise",
  },
  omnichannel: {
    label: "Omnichannel Orders",
    description: "Online channel, marketplace, pickup, and stock reservation management.",
    tier: "Retail Enterprise",
  },
  "audit-controls": {
    label: "Audit Controls",
    description: "Review surface for voids, refunds, price overrides, and stock variance approvals.",
    tier: "Retail Enterprise",
  },
};

type RetailComingSoonWorkspaceProps = {
  moduleId: string;
};

export default function RetailComingSoonWorkspace({ moduleId }: RetailComingSoonWorkspaceProps) {
  const meta = moduleLabels[moduleId];

  return (
    <section className="space-y-6">
      <Card className="rounded-xl bg-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-neutral-400" aria-hidden="true" />
            <div>
              <CardTitle>{meta?.label ?? moduleId}</CardTitle>
              <CardDescription>{meta?.description ?? "This module is not yet available."}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {meta?.tier ? (
              <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">
                {meta.tier}
              </Badge>
            ) : null}
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
              Coming soon
            </Badge>
          </div>

          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
            <Clock className="mx-auto h-10 w-10 text-neutral-300" aria-hidden="true" />
            <p className="mt-4 text-lg font-semibold text-neutral-700">Module under development</p>
            <p className="mt-2 max-w-sm mx-auto text-sm leading-6 text-neutral-500">
              {meta?.label ?? moduleId} requires additional backend endpoints and schema work.
              The core retail modules (cashier, catalog, barcode, receiving, stock-opname, shelf, promotions, returns) are fully live.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              { label: "Core retail ops", status: "Live", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" },
              { label: "Growth modules", status: "Planned", tone: "border-amber-200 bg-amber-50 text-amber-700" },
              { label: "Enterprise modules", status: "Planned", tone: "border-amber-200 bg-amber-50 text-amber-700" },
            ].map(({ label, status, tone }) => (
              <div key={label} className="rounded-lg border border-neutral-100 bg-neutral-50 p-4 text-center">
                <p className="text-sm font-medium text-neutral-700">{label}</p>
                <Badge variant="outline" className={`mt-2 ${tone}`}>{status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
