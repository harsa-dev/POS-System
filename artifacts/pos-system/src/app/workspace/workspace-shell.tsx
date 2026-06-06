import type { ReactNode } from "react";
import { Link } from "wouter";

type WorkspaceShellProps = {
  title: string;
  description: string;
  currentRouteLabel: string;
  currentRoutePath: string;
  children?: ReactNode;
};

export function WorkspaceShell({
  title,
  description,
  currentRouteLabel,
  currentRoutePath,
  children,
}: WorkspaceShellProps) {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 shadow-sm">
        <div className="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          V3 workspace placeholder
        </div>
        <h1 className="text-2xl font-bold text-neutral-950">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
          {description}
        </p>
        <div className="mt-5 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">
          Current production workflow remains on{" "}
          <Link
            href={currentRoutePath}
            className="font-semibold text-blue-700 hover:text-blue-800"
          >
            {currentRouteLabel}
          </Link>
          . This V3 route is available for manual review only and is not shown
          in the sidebar yet.
        </div>
      </div>
      {children ? <div>{children}</div> : null}
    </section>
  );
}
