import type { ReactNode } from "react";
import { Activity, AlertTriangle, CheckCircle2, Gauge, ShieldAlert } from "lucide-react";

import {
  getServiceBusinessInsightSummary,
  type ServiceBusinessInsightSeverity,
} from "./service-business-insight-engine";
import type { ServiceBusinessJob } from "./service-business-workspace-types";

export function ServiceBusinessInsightPanel({ job }: { job: ServiceBusinessJob }) {
  const insight = getServiceBusinessInsightSummary(job);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-neutral-950">Service insight preview</h4>
          <p className="mt-1 text-xs leading-5 text-neutral-500">
            Frontend-only readiness and risk scoring based on the current mock job shape.
          </p>
        </div>
        <div className={getRiskBadgeClassName(insight.riskScore)}>
          Risk {insight.riskScore}/100
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ScoreTile
          icon={<Gauge className="h-4 w-4" />}
          label="Readiness"
          value={`${insight.readinessScore}%`}
          helper="Weighted readiness preview"
        />
        <ScoreTile
          icon={<ShieldAlert className="h-4 w-4" />}
          label="Risk"
          value={`${insight.riskScore}%`}
          helper="Warning and critical signal weight"
        />
        <ScoreTile
          icon={<Activity className="h-4 w-4" />}
          label="Next action"
          value={`${insight.nextRequirementScore}%`}
          helper="Requirement completion"
        />
        <ScoreTile
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Collection"
          value={`${insight.collectionRate}%`}
          helper="Invoice collection preview"
        />
      </div>

      <div className="mt-4 space-y-2">
        {insight.signals.map((item) => (
          <div
            key={item.id}
            className="flex gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-3"
          >
            <div className={getSignalIconClassName(item.severity)}>
              {item.severity === "positive" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreTile({
  helper,
  icon,
  label,
  value,
}: {
  helper: string;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-xl font-black text-neutral-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-neutral-500">{helper}</p>
    </div>
  );
}

function getRiskBadgeClassName(riskScore: number) {
  if (riskScore >= 70) {
    return "rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700";
  }

  if (riskScore >= 35) {
    return "rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700";
  }

  return "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700";
}

function getSignalIconClassName(severity: ServiceBusinessInsightSeverity) {
  if (severity === "critical") {
    return "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700";
  }

  if (severity === "warning") {
    return "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700";
  }

  if (severity === "positive") {
    return "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700";
  }

  return "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700";
}
