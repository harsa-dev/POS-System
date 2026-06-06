import { v3PosCartItems } from "@/app/workspace/restaurant/pos-placeholder-data";

import type { PosTableItem } from "./pos-workspace-types";

type PosOrderPanelProps = {
  selectedTable: PosTableItem | null;
};

export function PosOrderPanel({ selectedTable }: PosOrderPanelProps) {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-neutral-950">Current Order</h3>
          <p className="mt-1 text-xs text-neutral-500">
            {selectedTable
              ? `${selectedTable.name}, dine in placeholder`
              : "No table selected, dine in placeholder"}
          </p>
        </div>
        <span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
          Draft
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {v3PosCartItems.map((item) => (
          <div
            className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
            key={item.name}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-950">
                  {item.quantity}x {item.name}
                </p>
                <p className="mt-1 text-xs text-neutral-500">{item.note}</p>
              </div>
              <p className="shrink-0 text-sm font-bold text-neutral-950">
                {item.total}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
