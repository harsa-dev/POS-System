import { Utensils } from "lucide-react";

import type { PosCategoryItem } from "./pos-workspace-types";

type PosCategoryRailProps = {
  categories: PosCategoryItem[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
};

export function PosCategoryRail({
  categories,
  selectedCategory,
  onSelectCategory,
}: PosCategoryRailProps) {
  return (
    <aside className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-950">Categories</h3>
        <Utensils className="h-4 w-4 text-neutral-400" aria-hidden="true" />
      </div>

      <div className="mt-4 space-y-2">
        {categories.map((category) => {
          const isAllItems = category.label === "All Items";
          const isActive = isAllItems
            ? selectedCategory === null
            : selectedCategory === category.label;

          return (
            <button
              aria-pressed={isActive}
              className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition hover:border-neutral-300 ${
                isActive
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-200 bg-white text-neutral-700"
              }`}
              key={category.label}
              onClick={() =>
                onSelectCategory(isAllItems ? null : category.label)
              }
              type="button"
            >
              <span>{category.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {category.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl bg-neutral-50 p-3 text-xs leading-5 text-neutral-500">
        Category filtering is local-only. Cart, modifiers, and favorites remain
        future workspace wiring.
      </div>
    </aside>
  );
}
