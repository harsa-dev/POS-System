import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function DashboardActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

export function DashboardActionButton({
  icon: Icon,
  children,
  variant = "secondary",
  onClick,
}: {
  icon: ElementType;
  children: ReactNode;
  variant?: "primary" | "secondary";
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition",
        variant === "primary"
          ? "bg-neutral-950 text-white hover:bg-neutral-800"
          : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{children}</span>
    </button>
  );
}
