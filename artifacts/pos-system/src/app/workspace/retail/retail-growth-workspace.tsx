import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  retailCoverageItems,
  retailGrowthModules,
  retailScaleProfiles,
  type RetailGrowthModuleId,
  type RetailGrowthRow,
} from "@/features/retail/core-system";

import { RetailCommandCenterPanel } from "./retail-command-center-panel";

const rowTone: Record<RetailGrowthRow["status"], string> = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-700",
  review: "border-amber-200 bg-amber-50 text-amber-700",
  blocked: "border-rose-200 bg-rose-50 text-rose-700",
  planned: "border-blue-200 bg-blue-50 text-blue-700",
};

const coverageTone = {
  covered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "added-mock": "border-blue-200 bg-blue-50 text-blue-700",
  "future-api": "border-amber-200 bg-amber-50 text-amber-700",
} as const;

type RetailGrowthWorkspaceProps = {
  moduleId: RetailGrowthModuleId;
};

function formatScaleLabel(scale: string) {
  return scale === "small" ? "Small" : scale === "medium" ? "Medium" : "Large";
}

export function RetailGrowthWorkspace({ moduleId }: RetailGrowthWorkspaceProps) {
  const module = retailGrowthModules.find((item) => item.id === moduleId) ?? retailGrowthModules[0]!;

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-blue-200 text-blue-700">
            Retail growth layer
          </Badge>
          <Badge variant="outline" className="border-emerald-300 text-emerald-700">
            Dummy data only
          </Badge>
          <Badge variant="outline" className="border-amber-300 text-amber-700">
            API/schema still untouched
          </Badge>
        </div>

        <div className="mt-5 max-w-4xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
            {module.eyebrow}
          </p>
          <h1 className="text-2xl font-bold text-neutral-950">{module.title}</h1>
          <p className="text-sm leading-6 text-neutral-600">{module.description}</p>
          <p className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm leading-6 text-neutral-600">
            <span className="font-semibold text-neutral-900">Why it matters:</span> {module.whyItMatters}
          </p>
        </div>
      </div>

      <RetailCommandCenterPanel />

      <div className="grid gap-4 md:grid-cols-3">
        {module.metrics.map((metric) => (
          <Card key={metric.label} className="rounded-xl bg-white">
            <CardHeader className="pb-2">
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-2xl">{metric.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-neutral-500">{metric.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle>{module.title} dashboard</CardTitle>
            <CardDescription>{module.dashboardGoal}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {module.rows.map((row) => (
              <div key={row.title} className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-950">{row.title}</p>
                    <p className="mt-1 text-sm text-neutral-600">{row.primary}</p>
                    <p className="mt-1 text-sm text-neutral-500">{row.secondary}</p>
                  </div>
                  <Badge variant="outline" className={rowTone[row.status]}>{row.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle>Next mock steps</CardTitle>
            <CardDescription>Frontend-only improvements before touching API or schema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {module.nextMockSteps.map((step) => (
              <div key={step} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm text-neutral-600">
                {step}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle>Retail scale map</CardTitle>
          <CardDescription>What small, medium, and large retail businesses usually need.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-3">
          {retailScaleProfiles.map((profile) => (
            <div key={profile.scale} className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
              <Badge variant="outline" className="border-neutral-200 text-neutral-700">
                {formatScaleLabel(profile.scale)} retail
              </Badge>
              <h3 className="mt-3 font-semibold text-neutral-950">{profile.title}</h3>
              <p className="mt-1 text-sm leading-6 text-neutral-500">{profile.exampleBusiness}</p>

              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Must-have</p>
                {profile.mustHave.map((item) => (
                  <p key={item} className="rounded-lg bg-white px-3 py-2 text-sm text-neutral-600">{item}</p>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Added now</p>
                <div className="flex flex-wrap gap-2">
                  {profile.addedNow.map((item) => (
                    <Badge key={item} variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <CardTitle>Feature coverage matrix</CardTitle>
          <CardDescription>Existing surfaces are kept. Missing surfaces are added as dummy dashboards.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-[0.14em] text-neutral-400">
              <tr>
                <th className="py-3 pr-4">Feature</th>
                <th className="py-3 pr-4">Scale</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Surface</th>
                <th className="py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {retailCoverageItems.map((item) => (
                <tr key={`${item.feature}-${item.currentSurface}`}>
                  <td className="py-3 pr-4 font-medium text-neutral-900">{item.feature}</td>
                  <td className="py-3 pr-4 text-neutral-500">{formatScaleLabel(item.scale)}</td>
                  <td className="py-3 pr-4">
                    <Badge variant="outline" className={coverageTone[item.status]}>{item.status}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-neutral-600">{item.currentSurface}</td>
                  <td className="py-3 text-neutral-500">{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
}
