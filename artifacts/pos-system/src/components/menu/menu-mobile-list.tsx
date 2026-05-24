"use client";

import { BookOpen, ImageIcon, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { formatCurrency } from "@/lib/utils/format";

import type { MenuItem } from "@/components/menu/menu-types";

import { getCategoryColor } from "@/components/menu/menu-utils";

type MenuMobileListProps = {
  menuItems: MenuItem[];

  hasRecipe: (menuItemId: string) => boolean;

  onRecipe: (menuItem: MenuItem) => void;

  onEdit: (menuItem: MenuItem) => void;

  onDelete: (id: string) => void;
};

export function MenuMobileList({
  menuItems,
  hasRecipe,
  onRecipe,
  onEdit,
  onDelete,
}: MenuMobileListProps) {
  return (
    <div className="block divide-y divide-neutral-100 lg:hidden">
      {menuItems.map((menuItem) => (
        <div key={menuItem.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100">
              {menuItem.imageUrl ? (
                <img
                  src={menuItem.imageUrl}
                  alt={menuItem.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="h-5 w-5 text-neutral-400" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-neutral-900">
                    {menuItem.name}
                  </p>

                  {menuItem.description && (
                    <p className="mt-1 line-clamp-1 text-sm text-neutral-500">
                      {menuItem.description}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant={hasRecipe(menuItem.id) ? "secondary" : "outline"}
                    onClick={() => onRecipe(menuItem)}
                  >
                    <BookOpen className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    onClick={() => onEdit(menuItem)}
                  >
                    <Pencil className="h-4 w-4 text-neutral-600" />
                  </Button>

                  <Button
                    type="button"
                    size="icon-sm"
                    variant="destructive"
                    onClick={() => onDelete(menuItem.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-neutral-900">
                  {formatCurrency(menuItem.price)}
                </span>

                {menuItem.category ? (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getCategoryColor(
                      menuItem.category?.name,
                    )}`}
                  >
                    {menuItem.category.name}
                  </span>
                ) : (
                  <span className="text-xs text-neutral-400">
                    Uncategorized
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {menuItems.length === 0 && (
        <div className="px-6 py-16 text-center text-neutral-500">
          No menu items found.
        </div>
      )}
    </div>
  );
}
