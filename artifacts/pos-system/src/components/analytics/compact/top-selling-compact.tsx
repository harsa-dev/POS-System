"use client";

import { useQuery } from "@tanstack/react-query";

import { ChefHat } from "lucide-react";

type TopMenu = {
  menuItemId: string;
  name: string;
  imageUrl?: string | null;
  quantitySold: number;
  revenue: number;
};

export function TopSellingCompact() {
  const { data, isLoading } = useQuery({
    queryKey: ["top-selling-menu"],

    queryFn: async () => {
      const res = await fetch("/api/analytics/top-menu", { credentials: "include" });

      if (!res.ok) {
        throw new Error("Failed to fetch top menu analytics");
      }

      return res.json();
    },

    staleTime: 1000 * 60,

    refetchOnWindowFocus: false,
  });

  const menus: TopMenu[] = data?.data ?? [];

  const topMenu = menus[0];

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-500">Top Selling</p>

          <h2 className="mt-2 truncate text-xl font-bold">
            {isLoading ? "..." : (topMenu?.name ?? "-")}
          </h2>
        </div>

        <div className="rounded-2xl bg-orange-100 p-3">
          <ChefHat className="h-5 w-5 text-orange-600" />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-neutral-500">
          {isLoading
            ? "Loading..."
            : topMenu
              ? `${topMenu.quantitySold} sold`
              : "No sales data"}
        </p>
      </div>
    </div>
  );
}
