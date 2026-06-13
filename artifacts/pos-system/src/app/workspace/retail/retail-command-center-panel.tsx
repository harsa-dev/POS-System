import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  retailCommandActions,
  retailCommandLanes,
  retailCommandMetrics,
  retailCommandNextBuildSteps,
  retailPlanningSignals,
  retailScenarioSimulations,
  type RetailCommandPriority,
} from "@/features/retail/core-system";

const priorityTone: Record<RetailCommandPriority, string> = {
  high: "border-rose-200 bg-rose-50 text-rose-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-blue-200 bg-blue-50 text-blue-700",
};

export function RetailCommandCenterPanel() {
  return (
    <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-violet-200 text-violet-700">Retail command center</Badge>
        <Badge variant="outline" className="border-emerald-200 text-emerald-700">dummy intelligence</Badge>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-neutral-950">Owner decision dashboard</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-600">
          Mock surface for margin, stock, customers, branch balance, and next business actions before real backend work.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {retailCommandMetrics.map((metric) => (
          <Card key={metric.label} className="rounded-xl">
            <CardHeader className="pb-2">
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle>{metric.value}</CardTitle>
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
            <CardDescription>Dummy next actions for owner, manager, cashier supervisor, and inventory lead.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {retailCommandActions.map((action) => (
              <div key={action.title} className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-950">{action.title}</p>
                    <p className="mt-1 text-sm text-neutral-500">Owner: {action.owner}</p>
                  </div>
                  <Badge variant="outline" className={priorityTone[action.priority]}>{action.priority}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{action.impact}</p>
                <p className="mt-2 rounded-md bg-white px-3 py-2 text-sm text-neutral-600">Next: {action.nextStep}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Scale readiness lanes</CardTitle>
            <CardDescription>Small, medium, and large retail readiness snapshot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {retailCommandLanes.map((lane) => (
              <div key={lane.title} className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-950">{lane.title}</p>
                    <p className="mt-1 text-sm text-neutral-500">{lane.description}</p>
                  </div>
                  <span className="text-lg font-semibold text-neutral-950">{lane.score}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
                  <div className="h-full rounded-full bg-neutral-950" style={{ width: `${lane.score}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {lane.items.map((item) => (
                    <Badge key={item} variant="outline" className="border-neutral-200 bg-white text-neutral-700">{item}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Planning signals</CardTitle>
            <CardDescription>Mock signals that connect sales, stock, customer, and branch decisions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {retailPlanningSignals.map((item) => (
              <div key={item.area} className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">{item.area}</p>
                <p className="mt-2 text-sm text-neutral-700">{item.signal}</p>
                <p className="mt-2 text-sm text-neutral-600">Recommendation: {item.recommendation}</p>
                <p className="mt-2 text-sm font-medium text-emerald-700">{item.estimatedImpact}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Scenario simulator</CardTitle>
            <CardDescription>Dummy what-if cases before building real analytics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {retailScenarioSimulations.map((scenario) => (
              <div key={scenario.name} className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                <p className="font-semibold text-neutral-950">{scenario.name}</p>
                <p className="mt-2 text-sm text-neutral-600">Assumption: {scenario.assumption}</p>
                <p className="mt-2 text-sm text-neutral-700">Projected: {scenario.projectedResult}</p>
                <p className="mt-2 text-sm text-amber-700">Tradeoff: {scenario.tradeoff}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Next build steps</CardTitle>
          <CardDescription>Still mock-only. API and schema stay untouched.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          {retailCommandNextBuildSteps.map((step) => (
            <div key={step} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm leading-5 text-neutral-600">
              {step}
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
