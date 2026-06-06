import { Clock3 } from "lucide-react";

import { v3PosOpenOrders } from "@/app/workspace/restaurant/pos-placeholder-data";

export function PosOpenOrdersPanel() {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-950">Open Orders</h3>
        <Clock3 className="h-4 w-4 text-neutral-400" aria-hidden="true" />
      </div>
      <div className="mt-4 space-y-2">
        {v3PosOpenOrders.map((order) => (
          <div
            className="flex items-center justify-between rounded-2xl bg-neutral-50 px-3 py-3 text-sm"
            key={order.code}
          >
            <div>
              <p className="font-semibold text-neutral-950">
                {order.code} - {order.table}
              </p>
              <p className="mt-1 text-xs text-neutral-500">{order.status}</p>
            </div>
            <p className="font-bold text-neutral-800">{order.total}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
