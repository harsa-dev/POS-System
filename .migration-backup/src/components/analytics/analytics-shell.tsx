import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function AnalyticsShell({
  children,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm xl:p-5">
      <div className="min-h-0 flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}