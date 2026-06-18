import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { retailApi } from "@/lib/api/retail-api";

const priorityTone = {
  high: "border-rose-200 bg-rose-50 text-rose-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-blue-200 bg-blue-50 text-blue-700",
} as const;

const ownerTone = {
  owner: "border-violet-200 bg-violet-50 text-violet-700",
  manager: "border-blue-200 bg-blue-50 text-blue-700",
  cashier: "border-neutral-200 bg-neutral-50 text-neutral-600",
} as const;

export function RetailCommandCenterPanel() {
  const { data: commandCenter, isLoading } = useQuery({
    queryKey: ["retail-command-center"],
    queryFn: () => retailApi.getCommandCenter(),
  });

  const { data: dashboard } = useQuery({
    queryKey: ["retail-dashboard"],
    queryFn: () => retailApi.getDashboard(),
  });

  if (isLoading) {
    return (
      <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-neutral-500">Loading command center…</p>
      </section>
    );
  }

  if (!commandCenter) return null;

  const healthColor =
    commandCenter.healthScore >= 80
      ? "text-emerald-700"
      : commandCenter.healthScore >= 65
        ? "text-amber-700"
        : "text-rose-700";

  return (
    <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-violet-200 text-violet-700">Retail command center</Badge>
        <Badge variant="outline" className="border-emerald-200 text-emerald-700">live API</Badge>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-neutral-950">Owner decision dashboard</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-600">
          Real-time signals from inventory risks, receiving queue, and checkout readiness.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "System health",
            value: `${commandCenter.healthScore}/100`,
            helper: commandCenter.healthScore >= 80 ? "All critical checks passing." : "Action items require attention.",
          },
          {
            label: "Priority actions",
            value: String(commandCenter.priorityActions.length),
            helper: commandCenter.priorityActions.length === 0 ? "No urgent actions." : "Review queue below.",
          },
          {
            label: "Active SKUs",
            value: String(dashboard?.summary.activeSku ?? "—"),
            helper: "Products in Prisma retail catalog.",
          },
          {
            label: "Checkout writes",
            value: dashboard?.checkoutReadiness.writesDatabase ? "Enabled" : "Mock",
            helper: "RetailSale + payment + stock movement.",
          },
        ].map((metric) => (
          <Card key={metric.label} className="rounded-xl">
            <CardHeader className="pb-2">
              <CardDescription>{metric.label}</CardDescription>
              <p className={`text-2xl font-bold ${metric.label === "System health" ? healthColor : "text-neutral-950"}`}>
                {metric.value}
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-neutral-500">{metric.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Priority action queue</CardTitle>
            <CardDescription>
              {commandCenter.priorityActions.length === 0
                ? "No priority actions at this time."
                : `${commandCenter.priorityActions.length} actions require attention.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {commandCenter.priorityActions.length === 0 ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                All inventory and receiving checks are passing. No urgent actions.
              </div>
            ) : (
              commandCenter.priorityActions.map((action) => (
                <div key={action.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-neutral-950">{action.title}</p>
                      <p className="mt-1 text-sm text-neutral-500 flex items-center gap-1">
                        <Badge variant="outline" className={ownerTone[action.ownerRole]}>{action.ownerRole}</Badge>
                        <span>· source: {action.source}</span>
                      </p>
                    </div>
                    <Badge variant="outline" className={priorityTone[action.priority]}>{action.priority}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Checkout readiness</CardTitle>
            <CardDescription>Live status from the retail backend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard
              ? Object.entries(dashboard.checkoutReadiness).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm">
                  <span className="text-neutral-600">{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</span>
                  <Badge variant="outline" className={value ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-neutral-200 bg-neutral-50 text-neutral-500"}>
                    {value ? "Ready" : "Not ready"}
                  </Badge>
                </div>
              ))
              : null}
          </CardContent>
        </Card>
      </div>

      {commandCenter.nextIntegrationSteps.length > 0 ? (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Next integration steps</CardTitle>
            <CardDescription>Recommended follow-on work from the backend.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {commandCenter.nextIntegrationSteps.map((step) => (
              <div key={step} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm leading-5 text-neutral-600">
                {step}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
