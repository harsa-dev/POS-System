import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { DashboardTone } from "@/features/shared/types";

export const toneClasses: Record<DashboardTone, string> = {
  blue: "bg-primary/10 text-primary ring-primary/15",
  green: "bg-chart-2/15 text-primary ring-chart-2/20",
  amber: "bg-chart-3/15 text-foreground ring-chart-3/20",
  rose: "bg-destructive/10 text-destructive ring-destructive/20",
  red: "bg-destructive/10 text-destructive ring-destructive/20",
  slate: "bg-muted text-muted-foreground ring-border",
};

export function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone = "slate",
}: {
  label: string;
  value: string;
  note?: string;
  icon: ElementType;
  tone?: DashboardTone;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-card-foreground">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1",
            toneClasses[tone],
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      {note && <p className="mt-3 text-xs text-muted-foreground">{note}</p>}
    </article>
  );
}

export function StatusPill({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: DashboardTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
