import { LockKeyhole, MoveRight } from "lucide-react";

import {
  getServiceTransitionActions,
  getServiceTransitionSummary,
} from "./service-business-status-transitions";
import { getServiceStatusLabel } from "./service-business-workspace-domain";
import type { ServiceBusinessJob } from "./service-business-workspace-types";

export function ServiceBusinessActionRail({ job }: { job: ServiceBusinessJob }) {
  const actions = getServiceTransitionActions(job.status);
  const transitionSummary = getServiceTransitionSummary(job.status);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-neutral-950">Action preview</h4>
          <p className="mt-1 text-xs leading-5 text-neutral-500">
            Current: {getServiceStatusLabel(job.status)} · {transitionSummary}
          </p>
        </div>
        <div className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-500">
          Disabled
        </div>
      </div>

      {actions.length > 0 ? (
        <div className="mt-4 space-y-3">
          {actions.map((action) => (
            <button
              key={action.id}
              disabled
              type="button"
              className="flex w-full cursor-not-allowed items-start justify-between gap-3 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-3 text-left"
            >
              <span>
                <span className="block text-sm font-bold text-neutral-500">
                  {action.label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-neutral-400">
                  Needs {action.requiredPermission}
                </span>
                <span className="mt-1 block text-xs leading-5 text-neutral-400">
                  {action.disabledReason}
                </span>
              </span>
              <MoveRight className="mt-1 h-4 w-4 shrink-0 text-neutral-400" />
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex gap-3 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm leading-6 text-neutral-500">
          <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />
          No next action in the current mock transition map.
        </div>
      )}
    </div>
  );
}
