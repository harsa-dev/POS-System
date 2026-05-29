"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";

import { BadgeDollarSign } from "lucide-react";

type FoodCostData = {
  name: string;
  quantitySold: number;
  revenue: number;
  estimatedFoodCost: number;
  grossProfit: number;
  foodCostPercentage: number;
};

export function FoodCostCompact() {
  const { data, isLoading } = useQuery({
    queryKey: ["food-cost-analytics"],

    queryFn: () => analyticsApi.foodCost(),

    staleTime: 1000 * 60,

    refetchOnWindowFocus: false,
  });

  const foodCosts: FoodCostData[] = data?.data ?? [];

  const averageFoodCost =
    foodCosts.length > 0
      ? Math.round(
          foodCosts.reduce((acc, item) => acc + item.foodCostPercentage, 0) /
            foodCosts.length,
        )
      : 0;

  const isHealthy = averageFoodCost <= 35;

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Food Cost</p>

          <h2 className="mt-2 text-2xl font-bold">
            {isLoading ? "..." : `${averageFoodCost}%`}
          </h2>
        </div>

        <div className="rounded-2xl bg-blue-100 p-3">
          <BadgeDollarSign className="h-5 w-5 text-blue-600" />
        </div>
      </div>

      <div className="mt-4">
        <p
          className={`text-sm font-medium ${
            isHealthy ? "text-green-600" : "text-red-600"
          }`}
        >
          {isLoading
            ? "Loading..."
            : isHealthy
              ? "Healthy margin"
              : "Cost too high"}
        </p>
      </div>
    </div>
  );
}
