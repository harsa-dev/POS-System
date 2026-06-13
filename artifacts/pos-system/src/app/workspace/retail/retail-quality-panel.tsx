import { CheckCircle2, ClipboardList, ShieldAlert, TestTube2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  retailControlScenarios,
  retailNextEngineeringTasks,
  retailQualityChecks,
  retailReadinessScore,
  type RetailQualitySeverity,
} from "@/features/retail/core-system";

const severityTone: Record<RetailQualitySeverity, string> = {
  critical: "border-rose-200 bg-rose-50 text-rose-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
};

const statusTone = {
  pass: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "needs-review": "border-amber-200 bg-amber-50 text-amber-700",
  blocked: "border-rose-200 bg-rose-50 text-rose-700",
} as const;

function ReadinessScorePanel() {
  const scoreColor =
    retailReadinessScore.score >= 75
      ? "text-emerald-700"
      : retailReadinessScore.score >= 60
        ? "text-amber-700"
        : "text-rose-700";

  return (
    <Card className="rounded-xl bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          Retail readiness score
        </CardTitle>
        <CardDescription>Mock quality gate before API, schema, stock mutation, and audit log exist.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-neutral-500">Current mock readiness</p>
              <p className={`mt-1 text-5xl font-bold ${scoreColor}`}>{retailReadinessScore.score}</p>
            </div>
            <Badge variant="outline" className="border-neutral-200 bg-white text-neutral-700">
              Grade {retailReadinessScore.grade}
            </Badge>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full rounded-full bg-neutral-900" style={{ width: `${retailReadinessScore.score}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-2xl font-semibold text-emerald-700">{retailReadinessScore.passedChecks}</p>
            <p className="mt-1 text-xs text-emerald-700">Passed</p>
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
            <p className="text-2xl font-semibold text-amber-700">{retailReadinessScore.reviewChecks}</p>
            <p className="mt-1 text-xs text-amber-700">Review</p>
          </div>
          <div className="rounded-lg border border-rose-100 bg-rose-50 p-3">
            <p className="text-2xl font-semibold text-rose-700">{retailReadinessScore.blockedChecks}</p>
            <p className="mt-1 text-xs text-rose-700">Blocked</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QualityChecksPanel() {
  return (
    <Card className="rounded-xl bg-white xl:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" aria-hidden="true" />
          Retail business rule checks
        </CardTitle>
        <CardDescription>Validation rules are still local and mock-only, but the behavior is already shaped.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {retailQualityChecks.map((check) => (
          <div key={check.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-neutral-950">{check.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-neutral-400">{check.category}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="outline" className={statusTone[check.status]}>{check.status}</Badge>
                <Badge variant="outline" className={severityTone[check.severity]}>{check.severity}</Badge>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-neutral-600">{check.summary}</p>
            <p className="mt-3 rounded-lg border border-neutral-100 bg-white p-3 text-xs leading-5 text-neutral-500">
              {check.recommendedAction}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ControlScenarioPanel() {
  return (
    <Card className="rounded-xl bg-white xl:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube2 className="h-5 w-5" aria-hidden="true" />
          Mock control scenarios
        </CardTitle>
        <CardDescription>Use these scenarios later as manual QA cases before writing automated tests.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b text-xs uppercase tracking-[0.12em] text-neutral-400">
            <tr>
              <th className="py-3 pr-4">Scenario</th>
              <th className="py-3 pr-4">Module</th>
              <th className="py-3 pr-4">Expected behavior</th>
              <th className="py-3 pr-4">Result</th>
              <th className="py-3 pr-4">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {retailControlScenarios.map((scenario) => (
              <tr key={scenario.id}>
                <td className="py-3 pr-4 font-medium text-neutral-950">{scenario.title}</td>
                <td className="py-3 pr-4 text-neutral-600">{scenario.module}</td>
                <td className="py-3 pr-4 text-neutral-600">{scenario.expectedBehavior}</td>
                <td className="py-3 pr-4">
                  <Badge variant="outline" className={statusTone[scenario.mockResult]}>{scenario.mockResult}</Badge>
                </td>
                <td className="py-3 pr-4 text-xs leading-5 text-neutral-500">{scenario.evidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function EngineeringTasksPanel() {
  return (
    <Card className="rounded-xl bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          Next engineering gates
        </CardTitle>
        <CardDescription>Do these before real API/schema work. Yes, boring. Also how systems survive.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {retailNextEngineeringTasks.map((task, index) => (
          <div key={task} className="flex gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm leading-6 text-neutral-600">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-semibold text-white">
              {index + 1}
            </span>
            <span>{task}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RetailQualityPanel() {
  return (
    <section className="space-y-6">
      <Card className="rounded-xl border-amber-100 bg-amber-50">
        <CardHeader>
          <CardTitle>Retail QA and control layer</CardTitle>
          <CardDescription>
            This phase adds local quality checks, control scenarios, readiness scoring, and engineering gates without touching API or Prisma schema.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
        <ReadinessScorePanel />
        <QualityChecksPanel />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <ControlScenarioPanel />
        <EngineeringTasksPanel />
      </div>
    </section>
  );
}
