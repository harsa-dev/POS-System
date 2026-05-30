import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function DashboardFilters({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-3", className)}>{children}</div>
  );
}

export function DashboardTabs({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-1">
      {options.map((option) => {
        const isActive = value === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "h-8 rounded-md px-3 text-sm font-medium transition",
              isActive
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-500 hover:text-neutral-950",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
