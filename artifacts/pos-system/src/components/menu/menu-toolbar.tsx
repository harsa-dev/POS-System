"use client";

import {
  Grid2X2,
  LayoutList,
  Plus,
  Search,
  Tags,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import type {
  ViewMode,
} from "@/components/menu/menu-types";

type MenuToolbarProps = {
  search: string;

  viewMode: ViewMode;

  onSearchChange: (
    value: string,
  ) => void;

  onViewModeChange: (
    mode: ViewMode,
  ) => void;

  onOpenCategories: () => void;

  onOpenCreateModal: () => void;
};

export function MenuToolbar({
  search,
  viewMode,
  onSearchChange,
  onViewModeChange,
  onOpenCategories,
  onOpenCreateModal,
}: MenuToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center justify-end gap-3 lg:order-2">
        <div className="hidden rounded-2xl border border-neutral-200 bg-white p-1 lg:flex">
          <button
            type="button"
            onClick={() =>
              onViewModeChange(
                "table",
              )
            }
            className={`flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
              viewMode === "table"
                ? "bg-neutral-950 text-white"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <LayoutList className="size-4" />

            Table
          </button>

          <button
            type="button"
            onClick={() =>
              onViewModeChange(
                "grid",
              )
            }
            className={`flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
              viewMode === "grid"
                ? "bg-neutral-950 text-white"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <Grid2X2 className="size-4" />

            Grid
          </button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={
            onOpenCategories
          }
        >
          <Tags className="size-4" />

          Categories
        </Button>

        <Button
          type="button"
          size="lg"
          onClick={
            onOpenCreateModal
          }
        >
          <Plus className="size-4" />

          Add Item
        </Button>
      </div>

      <div className="flex h-12 min-w-0 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 lg:order-1 lg:w-80">
        <Search className="size-4 shrink-0 text-neutral-400" />

        <input
          value={search}
          onChange={(e) =>
            onSearchChange(
              e.target.value,
            )
          }
          placeholder="Search menu..."
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
        />
      </div>
    </div>
  );
}