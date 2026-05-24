"use client";

import { Box, Coffee, ShoppingBag, Utensils } from "lucide-react";

import { formatCurrency } from "@/lib/utils/format";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  availabilityStatus: "AVAILABLE" | "OUT_OF_STOCK" | "NO_RECIPE";
};

type MenuGridProps = {
  menuItems: MenuItem[];
  currency: string;
  onAddToCart: (menuItem: MenuItem) => void;
};

function getMenuItemIcon(name: string) {
  const lower = name.toLowerCase();

  if (
    lower.includes("coffee") ||
    lower.includes("kopi") ||
    lower.includes("tea")
  ) {
    return Coffee;
  }

  if (
    lower.includes("nasi") ||
    lower.includes("mie") ||
    lower.includes("ayam")
  ) {
    return Utensils;
  }

  if (lower.includes("bag") || lower.includes("merch")) {
    return ShoppingBag;
  }

  return Box;
}

export function MenuGrid({ menuItems, currency, onAddToCart }: MenuGridProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {menuItems.map((menuItem) => {
          const Icon = getMenuItemIcon(menuItem.name);
          const isAvailable = menuItem.availabilityStatus === "AVAILABLE";

          return (
            <button
              key={menuItem.id}
              type="button"
              aria-disabled={!isAvailable}
              onClick={() => {
                if (!isAvailable) return;
                onAddToCart(menuItem);
              }}
              className={`group relative overflow-hidden rounded-2xl border bg-white p-3 text-left shadow-sm transition-all ${
                isAvailable
                  ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
                  : "cursor-not-allowed opacity-50"
              }`}
            >
              {menuItem.imageUrl ? (
                <img
                  src={menuItem.imageUrl}
                  alt={menuItem.name}
                  loading="lazy"
                  className="mb-3 h-24 w-full rounded-xl object-cover"
                />
              ) : (
                <div className="mb-3 flex h-24 w-full items-center justify-center rounded-xl bg-neutral-100">
                  <Icon className="h-9 w-9 text-neutral-400" />
                </div>
              )}

              <div>
                <h3 className="line-clamp-2 text-sm font-semibold">
                  {menuItem.name}
                </h3>

                <p className="mt-2 text-sm font-bold">
                  {formatCurrency(menuItem.price, currency)}
                </p>

                {menuItem.availabilityStatus === "OUT_OF_STOCK" && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    Out of stock
                  </p>
                )}

                {menuItem.availabilityStatus === "NO_RECIPE" && (
                  <p className="mt-1 text-xs font-medium text-yellow-600">
                    Recipe not set
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {menuItems.length === 0 && (
        <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-neutral-500">
          No menu items found.
        </div>
      )}
    </div>
  );
}
