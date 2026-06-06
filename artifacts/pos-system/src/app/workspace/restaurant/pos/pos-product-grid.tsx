import { v3PosProducts } from "@/app/workspace/restaurant/pos-placeholder-data";

import { PosProductCard } from "./pos-product-card";

export function PosProductGrid() {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-neutral-950">Product Grid</h3>
          <p className="mt-1 text-xs text-neutral-500">
            Static product cards only. No inventory, menu, or pricing API is connected.
          </p>
        </div>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
          6 preview items
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {v3PosProducts.map((product) => (
          <PosProductCard key={product.name} product={product} />
        ))}
      </div>
    </section>
  );
}
