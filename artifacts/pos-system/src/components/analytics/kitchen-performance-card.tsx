"use client";

import { useQuery } from "@tanstack/react-query";

import { ChefHat, Timer, Flame } from "lucide-react";

type KitchenAnalytics = {
  averagePrepTime: number;
  fastestOrder: number;
  slowestOrder: number;
  completedToday: number;
};

export function KitchenPerformanceCard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["kitchen-performance"],

    queryFn: async () => {
      const res = await fetch("/api/analytics/kitchen-performance", { credentials: "include" });

      if (!res.ok) {
        throw new Error("Failed to fetch kitchen analytics");
      }

      return res.json();
    },

    staleTime: 1000 * 60,

    gcTime: 1000 * 60 * 10,

    refetchOnWindowFocus: false,
  });

  const kitchenData: KitchenAnalytics = data?.data ?? {
    averagePrepTime: 0,
    fastestOrder: 0,
    slowestOrder: 0,
    completedToday: 0,
  };

  return (
    <section className="flex h-full flex-col overflow-hidden">
      <div className="mb-4 flex items-center gap-2">
        <ChefHat className="h-5 w-5 text-orange-500" />

        <div>
          <h2 className="text-lg font-semibold">Kitchen Performance</h2>

          <p className="text-sm text-neutral-500">
            Kitchen efficiency overview
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          Loading kitchen analytics...
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center text-sm text-red-500">
          Failed to load kitchen analytics.
        </div>
      ) : (
        <div className="grid flex-1 gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-neutral-100 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Timer className="h-4 w-4 text-blue-500" />

              <span className="text-sm font-medium">Average Prep</span>
            </div>

            <p className="text-3xl font-bold">{kitchenData.averagePrepTime}m</p>

            <p className="mt-1 text-sm text-neutral-500">
              Average cooking duration
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-100 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Flame className="h-4 w-4 text-green-500" />

              <span className="text-sm font-medium">Fastest Order</span>
            </div>

            <p className="text-3xl font-bold">{kitchenData.fastestOrder}m</p>

            <p className="mt-1 text-sm text-neutral-500">Best kitchen speed</p>
          </div>

          <div className="rounded-2xl border border-neutral-100 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-500" />

              <span className="text-sm font-medium">Slowest Order</span>
            </div>

            <p className="text-3xl font-bold">{kitchenData.slowestOrder}m</p>

            <p className="mt-1 text-sm text-neutral-500">
              Longest prep duration
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-950 p-4 text-white">
            <p className="text-sm text-neutral-300">Completed Today</p>

            <p className="mt-3 text-4xl font-bold">
              {kitchenData.completedToday}
            </p>

            <p className="mt-1 text-sm text-neutral-400">
              Finished kitchen orders
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
