import { Link } from "wouter";

import { ServiceBusinessWorkspaceLayout } from "@/app/workspace/custom-business/service/service-business-workspace-layout";
import { ROUTES } from "@/constants/routes";

export default function CustomBusinessServiceWorkspace() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 shadow-sm">
        <div className="mb-4 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          Planned service business workspace
        </div>
        <h1 className="text-2xl font-bold text-neutral-950">
          Service / Custom Business Workspace
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
          Blueprint route for the future service business mode. This workspace is
          scoped to custom-business workflows such as request intake, job
          planning, service costing, quotation, invoice, and service reporting.
        </p>
        <div className="mt-5 rounded-xl bg-neutral-50 p-4 text-sm leading-6 text-neutral-600">
          This route must stay non-operational until service schemas, backend
          contracts, permissions, and workflow transitions exist. Return to the{" "}
          <Link
            href={ROUTES.SELECT_MODE}
            className="font-semibold text-blue-700 hover:text-blue-800"
          >
            mode selector
          </Link>{" "}
          to enter the active Restaurant / F&amp;B workspace.
        </div>
      </div>

      <ServiceBusinessWorkspaceLayout />
    </section>
  );
}
