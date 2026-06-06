import { Utensils } from "lucide-react";

import type { PosCategoryItem } from "./pos-workspace-types";

type PosCategoryRailProps = {
  categories: PosCategoryItem[];
};

export function PosCategoryRail({ categories }: PosCategoryRailProps) {
  return (
    <aside className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-950">Categories</h3>
        <Utensils className="h-4 w-4 text-neutral-400" aria-hidden="true" />
      </div>

      <div className="mt-4 space-y-2">
        {categories.map((category) => (
          <button
            className={`flex w-full items-center justify-between rounded-2xl border border-neutral-200 px-3 py-3 text-left text-sm font-semibold transition hover:border-neutral-300 ${category.tone}`}
            key={category.label}
            type="button"
          >
            <span>{category.label}</span>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-500">
              {category.count}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-2xl bg-neutral-50 p-3 text-xs leading-5 text-neutral-500">
        Category behavior is intentionally static here. Real grouping, modifiers,
        and favorites remain future workspace wiring.
      </div>
    </aside>
  );
}
