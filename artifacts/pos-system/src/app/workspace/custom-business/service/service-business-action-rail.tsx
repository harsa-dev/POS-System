import { CheckCircle2, MoveRight, XCircle } from "lucide-react";

import {
  countMetTransitionRequirements,
  getServiceTransitionRequirements,
} from "./service-business-transition-requirements";
import {
  getServiceTransitionActions,
  getServiceTransitionSummary,
} from "./service-business-status-transitions";
import { getServiceStatusLabel } from "./service-business-workspace-domain";
import type {
  ServiceBusinessJob,
  ServiceBusinessWorkflowStatus,
} from "./service-business-workspace-types";

export function ServiceBusinessActionRail({
  isUpdating,
  job,
  onUpdateStatus,
}: {
  isUpdating: boolean;
  job: ServiceBusinessJob;
  onUpdateStatus: (nextStatus: ServiceBusinessWorkflowStatus) => void;
}) {
  const actions = getServiceTransitionActions(job.status);
  const transitionSummary = getServiceTransitionSummary(job.status);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div>
        <h4 className="text-sm font-bold text-neutral-950">Actions</h4>
        <p className="mt-1 text-xs leading-5 text-neutral-500">
          Current: {getServiceStatusLabel(job.status)} · {transitionSummary}
        </p>
      </div>

      {actions.length > 0 ? (
        <div className="mt-4 space-y-3">
          {actions.map((action) => {
            const requirements = getServiceTransitionRequirements(job, action.nextStatus);
            const metCount = countMetTransitionRequirements(requirements);
            const allMet = metCount === requirements.length;

            return (
              <div
                key={action.id}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
              >
                <button
                  type="button"
                  disabled={isUpdating || !allMet}
                  onClick={() => onUpdateStatus(action.nextStatus)}
                  className="flex w-full items-start justify-between gap-3 text-left disabled:cursor-not-allowed"
                >
                  <span>
                    <span className="block text-sm font-bold text-neutral-800">
                      {action.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-neutral-500">
                      {action.requiredPermission}
                    </span>
                  </span>
                  <MoveRight
                    className={`mt-1 h-4 w-4 shrink-0 ${allMet && !isUpdating ? "text-neutral-800" : "text-neutral-300"}`}
                  />
                </button>

                {requirements.length > 0 ? (
                  <div className="mt-3 border-t border-neutral-200 pt-3">
                    <p className="text-xs font-bold text-neutral-500">
                      Requirements: {metCount}/{requirements.length} met
                    </p>
                    <div className="mt-2 space-y-2">
                      {requirements.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-2 rounded-xl bg-white px-3 py-2 text-xs leading-5 text-neutral-600"
                        >
                          {item.isMet ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          ) : (
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                          )}
                          <span>
                            <span className="font-semibold text-neutral-800">{item.label}</span>
                            {!item.isMet ? (
                              <span className="mt-0.5 block text-neutral-500">
                                {item.missingReason}
                              </span>
                            ) : null}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm leading-6 text-neutral-500">
          No further transitions available for this status.
        </div>
      )}
    </div>
  );
}
