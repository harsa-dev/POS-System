"use client";

import {
  BookOpen,
  ImageIcon,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { formatCurrency } from "@/lib/utils/format";
import { getMenuImageSrc } from "@/components/menu/menu-utils";

import type {
  MenuItem,
} from "@/components/menu/menu-types";

type MenuGridViewProps = {
  menuItems: MenuItem[];

  hasRecipe: (
    menuItemId: string,
  ) => boolean;

  onRecipe: (
    menuItem: MenuItem,
  ) => void;

  onEdit: (
    menuItem: MenuItem,
  ) => void;

  onDelete: (
    id: string,
  ) => void;
};

export function MenuGridView({
  menuItems,
  hasRecipe,
  onRecipe,
  onEdit,
  onDelete,
}: MenuGridViewProps) {
  return (
    <div className="hidden p-5 lg:grid lg:grid-cols-2 lg:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
      {menuItems.map((menuItem) => {
        const imageSrc = getMenuImageSrc(menuItem, "grid");

        return (
          <div
            key={menuItem.id}
            className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm"
          >
            <div className="flex h-44 items-center justify-center overflow-hidden bg-neutral-100">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={menuItem.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="size-8 text-neutral-400" />
              )}
            </div>

            <div className="space-y-4 p-4">
              <div>
                <p className="truncate text-lg font-bold text-neutral-900">
                  {menuItem.name}
                </p>

                {menuItem.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
                    {menuItem.description}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-neutral-400">
                    No description.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {hasRecipe(menuItem.id) ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Recipe Ready
                  </span>
                ) : (
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                    Recipe Missing
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                <p className="text-lg font-bold">
                  {formatCurrency(menuItem.price)}
                </p>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant={hasRecipe(menuItem.id) ? "secondary" : "outline"}
                    onClick={() => onRecipe(menuItem)}
                  >
                    <BookOpen className="size-4" />
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => onEdit(menuItem)}
                  >
                    <Pencil className="size-4" />
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    onClick={() => onDelete(menuItem.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {menuItems.length === 0 && (
        <div className="col-span-full rounded-3xl border border-dashed border-neutral-200 p-16 text-center text-neutral-500">
          No menu items found.
        </div>
      )}
    </div>
  );
}
