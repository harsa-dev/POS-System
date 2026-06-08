import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCheck,
  ImageIcon,
  Loader2,
  PackageCheck,
  Search,
  Tags,
  UtensilsCrossed,
} from "lucide-react";

import { resolveMediaUrl } from "@/lib/api";

import type {
  MenuWorkspaceCategory,
  MenuWorkspaceItem,
} from "./use-menu-workspace-catalog";

type MenuAvailabilityFilter = "all" | "available" | "unavailable";

type MenuWorkspaceBoardProps = {
  items: MenuWorkspaceItem[];
  categories: MenuWorkspaceCategory[];
  status: "loading" | "ready" | "error";
  errorMessage: string | null;
  updatingItemId: string | null;
  onToggleAvailability: (item: MenuWorkspaceItem) => Promise<void>;
};

const availabilityFilters: Array<{
  id: MenuAvailabilityFilter;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "unavailable", label: "Unavailable" },
];

const availabilityTone: Record<MenuWorkspaceItem["availability"], string> = {
  AVAILABLE: "bg-green-50 text-green-700",
  OUT_OF_STOCK: "bg-red-50 text-red-700",
  NO_RECIPE: "bg-yellow-50 text-yellow-700",
  UNAVAILABLE: "bg-neutral-100 text-neutral-600",
};

function matchesAvailabilityFilter(
  item: MenuWorkspaceItem,
  filter: MenuAvailabilityFilter,
) {
  if (filter === "all") return true;
  if (filter === "available") return item.availability === "AVAILABLE";
  return item.availability !== "AVAILABLE";
}

function matchesCategoryFilter(
  item: MenuWorkspaceItem,
  selectedCategoryId: string | null,
) {
  if (selectedCategoryId === null) return true;
  if (selectedCategoryId === "uncategorized") return item.categoryId === null;
  return item.categoryId === selectedCategoryId;
}

function MenuWorkspaceSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading menu" aria-busy="true">
      <div className="grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="h-24 animate-pulse rounded-2xl border bg-white p-4 shadow-sm"
            key={index}
          >
            <div className="h-3 w-24 rounded bg-neutral-100" />
            <div className="mt-3 h-8 w-12 rounded bg-neutral-200" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            className="h-72 animate-pulse rounded-2xl border bg-white p-4 shadow-sm"
            key={index}
          >
            <div className="h-28 rounded-xl bg-neutral-100" />
            <div className="mt-4 h-5 w-32 rounded bg-neutral-200" />
            <div className="mt-3 h-4 w-40 rounded bg-neutral-100" />
            <div className="mt-4 h-10 rounded-xl bg-neutral-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MenuSummary({ items }: { items: MenuWorkspaceItem[] }) {
  const availableCount = items.filter(
    (item) => item.availability === "AVAILABLE",
  ).length;
  const outOfStockCount = items.filter(
    (item) => item.availability === "OUT_OF_STOCK",
  ).length;
  const noRecipeCount = items.filter(
    (item) => item.availability === "NO_RECIPE",
  ).length;
  const disabledCount = items.filter((item) => !item.isAvailable).length;

  return (
    <div className="grid gap-3 sm:grid-cols-5">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Total Items
        </p>
        <p className="mt-2 text-2xl font-bold text-neutral-950">
          {items.length}
        </p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Available
        </p>
        <p className="mt-2 text-2xl font-bold text-green-700">
          {availableCount}
        </p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Out of Stock
        </p>
        <p className="mt-2 text-2xl font-bold text-red-700">
          {outOfStockCount}
        </p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          No Recipe
        </p>
        <p className="mt-2 text-2xl font-bold text-yellow-700">
          {noRecipeCount}
        </p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Disabled
        </p>
        <p className="mt-2 text-2xl font-bold text-neutral-700">
          {disabledCount}
        </p>
      </div>
    </div>
  );
}

function MenuWorkspaceCard({
  item,
  isUpdating,
  onToggleAvailability,
}: {
  item: MenuWorkspaceItem;
  isUpdating: boolean;
  onToggleAvailability: (item: MenuWorkspaceItem) => Promise<void>;
}) {
  const imageSrc = resolveMediaUrl(item.imageUrl);
  const toggleLabel = item.isAvailable ? "Make Unavailable" : "Make Available";

  return (
    <article className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex aspect-[4/3] items-center justify-center bg-neutral-100">
        {imageSrc ? (
          <img
            alt=""
            className="h-full w-full object-cover"
            src={imageSrc}
          />
        ) : (
          <ImageIcon className="h-8 w-8 text-neutral-400" aria-hidden="true" />
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-neutral-950">
              {item.name}
            </h2>
            <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
              <Tags className="h-3.5 w-3.5" aria-hidden="true" />
              {item.categoryName}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${availabilityTone[item.availability]}`}
          >
            {item.availabilityLabel}
          </span>
        </div>

        <p className="mt-3 line-clamp-2 min-h-10 text-sm text-neutral-500">
          {item.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-lg font-bold text-neutral-950">
            {item.priceLabel}
          </p>
          <p className="text-xs font-semibold text-neutral-400">
            Read only
          </p>
        </div>

        <div className="mt-4 grid gap-2 border-t border-neutral-100 pt-4">
          <button
            className={`flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              item.isAvailable
                ? "bg-neutral-950 text-white hover:bg-neutral-800"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
            disabled={isUpdating}
            onClick={() => void onToggleAvailability(item)}
            type="button"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Updating...
              </>
            ) : (
              toggleLabel
            )}
          </button>
          <div className="grid grid-cols-3 gap-2">
            <button
              className="h-10 rounded-xl border border-neutral-200 bg-neutral-100 text-sm font-semibold text-neutral-500 disabled:cursor-not-allowed disabled:opacity-70"
              disabled
              type="button"
            >
              Edit
            </button>
            <button
              className="h-10 rounded-xl border border-neutral-200 bg-neutral-100 text-sm font-semibold text-neutral-500 disabled:cursor-not-allowed disabled:opacity-70"
              disabled
              type="button"
            >
              Upload
            </button>
            <button
              className="h-10 rounded-xl border border-neutral-200 bg-neutral-100 text-sm font-semibold text-neutral-500 disabled:cursor-not-allowed disabled:opacity-70"
              disabled
              type="button"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function MenuWorkspaceBoard({
  items,
  categories,
  status,
  errorMessage,
  updatingItemId,
  onToggleAvailability,
}: MenuWorkspaceBoardProps) {
  const [availabilityFilter, setAvailabilityFilter] =
    useState<MenuAvailabilityFilter>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const searchableText = [item.name, item.categoryName, item.description]
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        !normalizedQuery || searchableText.includes(normalizedQuery);

      return (
        matchesSearch &&
        matchesAvailabilityFilter(item, availabilityFilter) &&
        matchesCategoryFilter(item, selectedCategoryId)
      );
    });
  }, [availabilityFilter, items, searchQuery, selectedCategoryId]);

  if (status === "loading") {
    return <MenuWorkspaceSkeleton />;
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-red-600">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mt-4 font-bold text-red-700">Failed to load menu</p>
        <p className="mt-2 text-sm text-red-600">
          {errorMessage ?? "Please check the connection and try again."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <MenuSummary items={items} />

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-950">
              Menu Catalog
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Read-only V3 menu visibility across categories, stock readiness,
              and recipe readiness.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-500 lg:w-72">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              aria-label="Search V3 menu"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-neutral-400"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search menu..."
              value={searchQuery}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {availabilityFilters.map((filter) => (
            <button
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                availabilityFilter === filter.id
                  ? "bg-neutral-950 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
              key={filter.id}
              onClick={() => setAvailabilityFilter(filter.id)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              selectedCategoryId === null
                ? "bg-blue-950 text-white"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
            onClick={() => setSelectedCategoryId(null)}
            type="button"
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                selectedCategoryId === category.id
                  ? "bg-blue-950 text-white"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              type="button"
            >
              {category.name} ({category.itemCount})
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm">
        <PackageCheck className="h-4 w-4 text-neutral-500" aria-hidden="true" />
        Availability toggle is enabled for menu items. Create, edit, delete,
        and upload remain placeholders.
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
            {items.length === 0 ? (
              <UtensilsCrossed className="h-7 w-7" aria-hidden="true" />
            ) : (
              <CheckCheck className="h-7 w-7" aria-hidden="true" />
            )}
          </div>
          <p className="mt-4 text-lg font-bold text-neutral-800">
            {items.length === 0 ? "No menu items yet" : "No matching menu items"}
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            {items.length === 0
              ? "Menu items created in the current F&B route will appear here."
              : "Try changing the search, availability filter, or category."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <MenuWorkspaceCard
              isUpdating={updatingItemId === item.id}
              item={item}
              key={item.id}
              onToggleAvailability={onToggleAvailability}
            />
          ))}
        </div>
      )}
    </div>
  );
}
