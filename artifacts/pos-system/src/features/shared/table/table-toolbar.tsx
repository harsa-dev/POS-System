import type { ReactNode } from "react";

export function TableToolbar({
  filters,
  actions,
}: {
  filters?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 p-4">
      {filters}
      {actions}
    </div>
  );
}
