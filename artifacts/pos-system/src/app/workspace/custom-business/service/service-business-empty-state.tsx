import { SearchX } from "lucide-react";

export function ServiceBusinessEmptyState({
  onResetFilters,
}: {
  onResetFilters: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-neutral-500 shadow-sm">
        <SearchX className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-bold text-neutral-950">
        No mocked service jobs found
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-600">
        The current search and filters do not match any mock service jobs. Reset the filters to show the preview data again.
      </p>
      <button
        type="button"
        onClick={onResetFilters}
        className="mt-4 rounded-xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
      >
        Reset filters
      </button>
    </div>
  );
}
