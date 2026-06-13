import { Activity, Clock3 } from "lucide-react";

import type { ServiceBusinessActivityPreviewEvent } from "./service-business-activity-preview";

const sourceLabel: Record<ServiceBusinessActivityPreviewEvent["source"], string> = {
  timeline: "Timeline",
  system: "System",
  preview: "Preview",
};

export function ServiceBusinessActivityFeed({
  description = "Read-only activity preview for the future service audit trail.",
  events,
  title = "Activity preview",
}: {
  description?: string;
  events: readonly ServiceBusinessActivityPreviewEvent[];
  title?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-neutral-950">
            <Activity className="h-4 w-4" />
            {title}
          </h4>
          <p className="mt-1 text-xs leading-5 text-neutral-500">{description}</p>
        </div>
        <div className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-500">
          {events.length} events
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="grid gap-3 rounded-2xl bg-neutral-50 p-3 text-sm md:grid-cols-[120px_minmax(0,1fr)]"
          >
            <div>
              <div className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-bold text-neutral-500">
                {sourceLabel[event.source]}
              </div>
              <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-neutral-400">
                <Clock3 className="h-3.5 w-3.5" />
                {event.at}
              </p>
            </div>
            <div>
              <p className="font-bold text-neutral-900">{event.label}</p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                {event.description}
              </p>
              <p className="mt-2 text-xs font-semibold text-neutral-400">
                Actor: {event.actor}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
