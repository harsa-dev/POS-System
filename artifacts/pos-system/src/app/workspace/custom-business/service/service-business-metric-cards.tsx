import type { ServiceBusinessMetric } from "./service-business-workspace-types";

export function ServiceBusinessMetricCards({
  metrics,
}: {
  metrics: readonly ServiceBusinessMetric[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
        >
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">
            {metric.label}
          </p>
          <p className="mt-3 text-2xl font-bold text-neutral-950">
            {metric.value}
          </p>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {metric.description}
          </p>
          {metric.trendLabel ? (
            <p className="mt-3 text-xs font-semibold text-neutral-500">
              {metric.trendLabel}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
