"use client";

export function RecipeEmptyState() {
  return (
    <div className="mt-6 rounded-3xl border border-dashed border-neutral-200 p-10 text-center">
      <p className="font-semibold text-neutral-800">
        No recipe yet
      </p>

      <p className="mt-1 text-sm text-neutral-500">
        Add ingredients from
        inventory so kitchen
        production can deduct
        stock automatically.
      </p>
    </div>
  );
}