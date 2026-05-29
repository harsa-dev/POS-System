"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";

import { formatCurrency } from "@/lib/utils/format";

type TopMenu = {
  menuItemId: string;
  name: string;
  imageUrl?: string | null;
  quantitySold: number;
  revenue: number;
};

export function TopSellingMenu() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["top-selling-menu"],

    queryFn: () => analyticsApi.topMenu(),

    staleTime: 1000 * 60,

    gcTime: 1000 * 60 * 10,

    refetchOnWindowFocus: false,
  });

  const menus: TopMenu[] = data?.data ?? [];

  return (
    <section className="flex h-full flex-col overflow-hidden">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Top Selling Menu</h2>

        <p className="text-sm text-neutral-500">Best performing menu items</p>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          Loading top menus...
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center text-sm text-red-500">
          Failed to load top menu analytics.
        </div>
      ) : menus.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          No sales data yet.
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {menus.map((menu) => (
            <div
              key={menu.menuItemId}
              className="flex items-center gap-4 rounded-2xl border border-neutral-100 p-3 transition-colors hover:border-neutral-200"
            >
              {menu.imageUrl ? (
                <img
                  src={menu.imageUrl}
                  alt={menu.name}
                  loading="lazy"
                  className="h-14 w-14 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-xs text-neutral-400">
                  No Img
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{menu.name}</p>

                <p className="mt-1 text-sm text-neutral-500">
                  {menu.quantitySold} sold
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold">{formatCurrency(menu.revenue)}</p>

                <p className="mt-1 text-xs text-neutral-500">Revenue</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
