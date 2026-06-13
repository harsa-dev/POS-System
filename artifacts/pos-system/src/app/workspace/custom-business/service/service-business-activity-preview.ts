import {
  getServiceTransitionActions,
  getServiceTransitionSummary,
} from "./service-business-status-transitions";
import {
  getServicePriorityLabel,
  getServiceStatusLabel,
} from "./service-business-workspace-domain";
import type { ServiceBusinessJob } from "./service-business-workspace-types";

export type ServiceBusinessActivityPreviewEvent = {
  id: string;
  label: string;
  description: string;
  actor: string;
  at: string;
  source: "timeline" | "system" | "preview";
};

export function getServiceBusinessActivityPreview(
  job: ServiceBusinessJob,
): readonly ServiceBusinessActivityPreviewEvent[] {
  const timelineEvents = job.timeline.map((item, index) => ({
    id: `${job.id}-timeline-${index}`,
    label: item.label,
    description: `Imported from service job timeline for ${job.requestCode}.`,
    actor: item.actor,
    at: item.at,
    source: "timeline" as const,
  }));

  const actionEvents = getServiceTransitionActions(job.status).map((action) => ({
    id: `${job.id}-next-action-${action.id}`,
    label: `${action.label} previewed`,
    description: `Would move ${job.requestCode} toward ${getServiceStatusLabel(action.nextStatus)}. ${action.disabledReason}`,
    actor: "System preview",
    at: "Future backend event",
    source: "preview" as const,
  }));

  const systemEvents: readonly ServiceBusinessActivityPreviewEvent[] = [
    {
      id: `${job.id}-system-status`,
      label: "Current status evaluated",
      description: `${getServiceStatusLabel(job.status)} is active. ${getServiceTransitionSummary(job.status)}`,
      actor: "Service workflow preview",
      at: "Current session",
      source: "system",
    },
    {
      id: `${job.id}-system-priority`,
      label: "Priority evaluated",
      description: `${getServicePriorityLabel(job.priority)} priority is used for queue visibility only in this mock workspace.`,
      actor: "Service workflow preview",
      at: "Current session",
      source: "system",
    },
  ];

  return [...systemEvents, ...actionEvents, ...timelineEvents];
}

export function getServicePreviewModalActivity(
  type: "request" | "quotation",
  job: ServiceBusinessJob | null,
): readonly ServiceBusinessActivityPreviewEvent[] {
  if (type === "request") {
    return [
      {
        id: "request-preview-opened",
        label: "Request preview opened",
        description:
          "A future service request draft would be created after backend request intake exists.",
        actor: "Local preview",
        at: "Current session",
        source: "preview",
      },
      {
        id: "request-preview-payload",
        label: "Request payload inspected",
        description:
          "Editable local fields can be reviewed without calling the service API.",
        actor: "Local preview",
        at: "Current session",
        source: "preview",
      },
    ];
  }

  return [
    {
      id: "quotation-preview-opened",
      label: "Quotation preview opened",
      description: job
        ? `A future quotation draft would be linked to ${job.requestCode}.`
        : "A future quotation draft needs a selected service job first.",
      actor: "Local preview",
      at: "Current session",
      source: "preview",
    },
    {
      id: "quotation-preview-pricing",
      label: "Quotation pricing inspected",
      description:
        "Draft discount, tax, and margin inputs are reviewed locally until pricing rules are finalized.",
      actor: "Local preview",
      at: "Current session",
      source: "preview",
    },
  ];
}
