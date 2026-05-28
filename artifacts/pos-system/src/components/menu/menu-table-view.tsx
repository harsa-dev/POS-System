"use client";

import { BookOpen, ImageIcon, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { formatCurrency } from "@/lib/utils/format";
import { getMenuImageSrc } from "@/components/menu/menu-utils";

import type { MenuItem } from "@/components/menu/menu-types";

type MenuTableViewProps = {
  menuItems: MenuItem[];

  hasRecipe: (menuItemId: string) => boolean;

  onRecipe: (menuItem: MenuItem) => void;

  onEdit: (menuItem: MenuItem) => void;

  onDelete: (id: string) => void;
};

export function MenuTableView({
  menuItems,
  hasRecipe,
  onRecipe,
  onEdit,
  onDelete,
}: MenuTableViewProps) {
  return (
    <table className="hidden w-full min-w-[850px] lg:table">
      <thead className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50">
        <tr className="text-left text-sm text-neutral-500">
          <th className="px-6 py-4 font-medium">Menu Item</th>

          <th className="px-6 py-4 font-medium">Price</th>

          <th className="px-6 py-4 font-medium">Recipe</th>

          <th className="px-6 py-4 font-medium">Category</th>

          <th className="px-6 py-4 text-right font-medium">Actions</th>
        </tr>
      </thead>

      <tbody>
        {menuItems.map((menuItem) => {
          const imageSrc = getMenuImageSrc(menuItem, "table");

          return (
            <tr key={menuItem.id} className="border-b border-neutral-100">
              <td className="px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={menuItem.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-neutral-400" />
                    )}
                  </div>

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
                </div>
              </td>

              <td className="px-6 py-5 font-medium">
                {formatCurrency(menuItem.price)}
              </td>

              <td className="px-6 py-5">
                {hasRecipe(menuItem.id) ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Added
                  </span>
                ) : (
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                    Missing
                  </span>
                )}
              </td>

              <td className="px-6 py-5">
                {menuItem.category ? (
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                    {menuItem.category.name}
                  </span>
                ) : (
                  <span className="text-sm text-neutral-400">Uncategorized</span>
                )}
              </td>

              <td className="px-6 py-5">
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant={hasRecipe(menuItem.id) ? "secondary" : "outline"}
                    onClick={() => onRecipe(menuItem)}
                  >
                    <BookOpen className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => onEdit(menuItem)}
                  >
                    <Pencil className="h-4 w-4 text-neutral-600" />
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    onClick={() => onDelete(menuItem.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          );
        })}

        {menuItems.length === 0 && (
          <tr>
            <td colSpan={5} className="px-6 py-16 text-center text-neutral-500">
              No menu items found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
