import type { ElementType, ReactNode } from "react";

type WorkspaceFeedbackProps = {
  children: ReactNode;
  className?: string;
};

type WorkspaceStateProps = {
  icon: ElementType;
  title: string;
  description: string;
};

type StatusBadgeProps = WorkspaceFeedbackProps & {
  tone: string;
};

export function StatusBadge({ children, className = "", tone }: StatusBadgeProps) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone} ${className}`}
    >
      {children}
    </span>
  );
}

export function RefreshingIndicator({
  className = "",
  label = "Refreshing...",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={`rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ${className}`}
    >
      {label}
    </span>
  );
}

export function InlineErrorNotice({ children, className = "" }: WorkspaceFeedbackProps) {
  return (
    <div
      className={`rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 ${className}`}
    >
      {children}
    </div>
  );
}

export function LoadErrorState({ description, icon: Icon, title }: WorkspaceStateProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-red-600">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="mt-4 font-bold text-red-700">{title}</p>
      <p className="mt-2 text-sm text-red-600">{description}</p>
    </div>
  );
}

export function EmptyState({ description, icon: Icon, title }: WorkspaceStateProps) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="mt-4 text-lg font-bold text-neutral-800">{title}</p>
      <p className="mt-2 text-sm text-neutral-500">{description}</p>
    </div>
  );
}

export function RecipeRequiredBadge() {
  return (
    <StatusBadge tone="bg-amber-50 text-amber-700">
      Recipe required
    </StatusBadge>
  );
}
