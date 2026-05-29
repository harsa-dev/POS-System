"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";

import { ChefHat } from "lucide-react";

type KitchenAnalytics = {
  averagePrepTime: number;
  fastestOrder: number;
  slowestOrder: number;
  completedToday: number;
};

export function KitchenPerformanceCompact() {
  const { data, isLoading } = useQuery({
    queryKey: ["kitchen-performance"],

    queryFn: () => analyticsApi.kitchenPerformance(),

    staleTime: 1000 * 60,

    refetchOnWindowFocus: false,
  });

  const kitchenData: KitchenAnalytics = data?.data ?? {
    averagePrepTime: 0,
    fastestOrder: 0,
    slowestOrder: 0,
    completedToday: 0,
  };

  const isHealthy = kitchenData.averagePrepTime <= 15;

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Kitchen</p>

          <h2 className="mt-2 text-2xl font-bold">
            {isLoading ? "..." : `${kitchenData.averagePrepTime}m`}
          </h2>
        </div>

        <div className="rounded-2xl bg-red-100 p-3">
          <ChefHat className="h-5 w-5 text-red-600" />
        </div>
      </div>

      <div className="mt-4">
        <p
          className={`text-sm font-medium ${
            isHealthy ? "text-green-600" : "text-orange-600"
          }`}
        >
          {isLoading
            ? "Loading..."
            : isHealthy
              ? "Kitchen performing well"
              : "Prep time increasing"}
        </p>
      </div>
    </div>
  );
}
