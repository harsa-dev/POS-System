import { Search, Sparkles, Table2 } from "lucide-react";

type PosWorkspaceHeaderProps = {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
};

export function PosWorkspaceHeader({
  searchQuery,
  onSearchQueryChange,
}: PosWorkspaceHeaderProps) {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            V3 visual skeleton
          </div>
          <h2 className="mt-3 text-xl font-bold text-neutral-950">
            POS Counter Workspace
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Static layout preview for cashier ordering, cart review, and payment handoff.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:min-w-[680px]">
          <label className="flex h-12 items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-sm text-neutral-500">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Search menu item or SKU"
              type="search"
              value={searchQuery}
            />
          </label>

          <label className="flex h-12 items-center rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-sm text-neutral-600">
            <select
              className="w-full bg-transparent text-sm font-medium outline-none"
              defaultValue="dine-in"
            >
              <option value="dine-in">Dine In</option>
              <option value="takeaway">Takeaway</option>
              <option value="delivery">Delivery</option>
            </select>
          </label>

          <div className="flex h-12 items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-sm">
            <span className="flex items-center gap-2 font-medium text-neutral-700">
              <Table2 className="h-4 w-4 text-neutral-500" aria-hidden="true" />
              Table 8
            </span>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
              Occupied
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
