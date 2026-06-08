import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Beaker,
  CheckCircle2,
  ClipboardList,
  Loader2,
  PackageSearch,
  Search,
  UtensilsCrossed,
} from "lucide-react";

import type {
  RecipesWorkspaceFilter,
  RecipesWorkspaceMenuItem,
} from "./use-recipes-workspace-catalog";

type RecipesWorkspaceBoardProps = {
  items: RecipesWorkspaceMenuItem[];
  status: "loading" | "ready" | "error";
  errorMessage: string | null;
};

const recipeFilters: Array<{
  id: RecipesWorkspaceFilter;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "with-recipes", label: "With Recipes" },
  { id: "without-recipes", label: "Without Recipes" },
  { id: "unavailable", label: "Unavailable" },
];

function matchesFilter(
  item: RecipesWorkspaceMenuItem,
  filter: RecipesWorkspaceFilter,
) {
  if (filter === "all") return true;
  if (filter === "with-recipes") return item.recipeCount > 0;
  if (filter === "without-recipes") return item.recipeCount === 0;
  return !item.isAvailable;
}

function matchesSearch(item: RecipesWorkspaceMenuItem, query: string) {
  const searchText = [
    item.name,
    item.categoryName,
    item.availabilityLabel,
    ...item.ingredients.map((ingredient) => ingredient.name),
  ]
    .join(" ")
    .toLowerCase();

  return searchText.includes(query.trim().toLowerCase());
}

function RecipesWorkspaceSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading recipes" aria-busy="true">
      <div className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="h-24 animate-pulse rounded-2xl border bg-white p-4 shadow-sm"
            key={index}
          >
            <div className="h-3 w-28 rounded bg-neutral-100" />
            <div className="mt-4 h-8 w-14 rounded bg-neutral-200" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="h-72 animate-pulse rounded-2xl border bg-white p-4 shadow-sm"
            key={index}
          >
            <div className="h-5 w-44 rounded bg-neutral-200" />
            <div className="mt-4 h-4 w-56 rounded bg-neutral-100" />
            <div className="mt-6 h-32 rounded-xl bg-neutral-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RecipesSummary({ items }: { items: RecipesWorkspaceMenuItem[] }) {
  const withRecipes = items.filter((item) => item.recipeCount > 0).length;
  const withoutRecipes = items.length - withRecipes;
  const ingredientCount = items.reduce(
    (total, item) => total + item.recipeCount,
    0,
  );
  const unavailableCount = items.filter((item) => !item.isAvailable).length;

  const cards = [
    {
      label: "Menu Items",
      value: items.length,
      icon: UtensilsCrossed,
      tone: "text-neutral-950",
    },
    {
      label: "With Recipes",
      value: withRecipes,
      icon: CheckCircle2,
      tone: "text-green-700",
    },
    {
      label: "Missing Recipes",
      value: withoutRecipes,
      icon: AlertTriangle,
      tone: "text-yellow-700",
    },
    {
      label: "Ingredients",
      value: ingredientCount,
      icon: Beaker,
      tone: "text-blue-700",
    },
    {
      label: "Unavailable",
      value: unavailableCount,
      icon: PackageSearch,
      tone: "text-neutral-700",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div className="rounded-2xl border bg-white p-4 shadow-sm" key={card.label}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase text-neutral-500">
                {card.label}
              </p>
              <Icon className="h-4 w-4 text-neutral-400" aria-hidden="true" />
            </div>
            <p className={`mt-3 text-2xl font-bold ${card.tone}`}>
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function RecipeItemCard({ item }: { item: RecipesWorkspaceMenuItem }) {
  return (
    <article className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-neutral-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-neutral-950">{item.name}</h2>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                item.isAvailable
                  ? "bg-green-50 text-green-700"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {item.availabilityLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {item.categoryName} - {item.recipeCount} ingredient
            {item.recipeCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-semibold uppercase text-neutral-500">
            Estimated Cost
          </p>
          <p className="mt-1 text-sm font-bold text-neutral-950">
            {item.totalEstimatedCostLabel ?? "Not available"}
          </p>
        </div>
      </div>

      {item.ingredients.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-neutral-100">
          <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] gap-3 bg-neutral-50 px-3 py-2 text-xs font-semibold uppercase text-neutral-500">
            <span>Ingredient</span>
            <span>Needed</span>
            <span>Stock</span>
            <span>Cost</span>
          </div>
          <div className="divide-y divide-neutral-100">
            {item.ingredients.map((ingredient) => (
              <div
                className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] gap-3 px-3 py-3 text-sm"
                key={ingredient.id}
              >
                <span className="font-semibold text-neutral-900">
                  {ingredient.name}
                </span>
                <span className="text-neutral-600">
                  {ingredient.quantityLabel}
                </span>
                <span className="text-neutral-600">
                  {ingredient.currentStockLabel}
                </span>
                <span className="font-semibold text-neutral-800">
                  {ingredient.estimatedCostLabel ?? "-"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          No recipe ingredients are configured for this menu item yet.
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 text-sm font-semibold text-neutral-400"
          disabled
          type="button"
        >
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          Edit Recipe
        </button>
        <button
          className="inline-flex h-9 items-center justify-center rounded-xl border border-neutral-200 px-3 text-sm font-semibold text-neutral-400"
          disabled
          type="button"
        >
          Add Ingredient
        </button>
        <button
          className="inline-flex h-9 items-center justify-center rounded-xl border border-neutral-200 px-3 text-sm font-semibold text-neutral-400"
          disabled
          type="button"
        >
          Delete Ingredient
        </button>
      </div>
    </article>
  );
}

export function RecipesWorkspaceBoard({
  items,
  status,
  errorMessage,
}: RecipesWorkspaceBoardProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RecipesWorkspaceFilter>("all");

  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) => matchesFilter(item, filter) && matchesSearch(item, query),
      ),
    [filter, items, query],
  );

  if (status === "loading") return <RecipesWorkspaceSkeleton />;

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5" aria-hidden="true" />
          <div>
            <p className="font-bold">Recipes could not be loaded.</p>
            <p className="mt-1">{errorMessage ?? "Please try again later."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <RecipesSummary items={items} />

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-950">
              Recipe Mapping
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Read-only ingredient usage by menu item. Recipe create, edit, and
              delete are not wired in V3 yet.
            </p>
          </div>
          <button
            className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-400"
            disabled
            type="button"
          >
            Add Recipe
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden="true"
            />
            <input
              className="h-11 w-full rounded-xl border border-neutral-200 pl-10 pr-3 text-sm outline-none transition focus:border-neutral-400"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search menu item or ingredient"
              value={query}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {recipeFilters.map((recipeFilter) => (
              <button
                className={`h-10 rounded-xl border px-3 text-sm font-semibold transition ${
                  filter === recipeFilter.id
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
                key={recipeFilter.id}
                onClick={() => setFilter(recipeFilter.id)}
                type="button"
              >
                {recipeFilter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {filteredItems.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredItems.map((item) => (
            <RecipeItemCard item={item} key={item.id} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed bg-white p-8 text-center shadow-sm">
          <Loader2
            className="mx-auto h-8 w-8 text-neutral-300"
            aria-hidden="true"
          />
          <p className="mt-4 text-sm font-bold text-neutral-950">
            No recipe mapping found.
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Try a different search or filter.
          </p>
        </div>
      )}
    </div>
  );
}
