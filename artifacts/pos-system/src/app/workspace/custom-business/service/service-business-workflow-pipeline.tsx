import type { ServiceBusinessPipelineStage } from "./service-business-workspace-types";
import { ServiceSectionCard } from "./service-business-workspace-ui";

const PIPELINE_STAGES: readonly ServiceBusinessPipelineStage[] = [
  {
    title: "Request intake",
    description:
      "Capture service requests, customer context, scope notes, expected deadline, and initial priority.",
    items: ["Customer profile", "Service category", "Scope notes", "Target deadline"],
  },
  {
    title: "Job planning",
    description:
      "Break a request into jobs, assign responsible staff, estimate effort, and define acceptance criteria.",
    items: ["Job cards", "Assignee", "Estimated hours", "Checklist"],
  },
  {
    title: "Costing & quotation",
    description:
      "Estimate labor, operational expense, materials, margin, discount, tax, and quotation validity.",
    items: ["Labor cost", "Operational expense", "Margin", "Quote preview"],
  },
  {
    title: "Delivery & invoice",
    description:
      "Track delivery status, completion evidence, invoice generation, payment status, and customer handoff.",
    items: ["Completion proof", "Invoice", "Payment", "After-service note"],
  },
];

export function ServiceBusinessWorkflowPipeline() {
  return (
    <ServiceSectionCard
      title="Service workflow blueprint"
      description="A service business starts from requests, moves through job planning and quotation, then ends with delivery, invoice, and collection."
    >
      <div className="grid gap-4 lg:grid-cols-4">
        {PIPELINE_STAGES.map((stage, index) => (
          <article
            key={stage.title}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-bold text-neutral-900 shadow-sm">
                {index + 1}
              </div>
              <h3 className="text-sm font-bold text-neutral-950">{stage.title}</h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-neutral-600">{stage.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {stage.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-600"
                >
                  {item}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </ServiceSectionCard>
  );
}
