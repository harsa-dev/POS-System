"use client";

import { useQuery } from "@tanstack/react-query";

import { formatCurrency } from "@/lib/utils/format";

type FoodCostData = {
  name: string;
  quantitySold: number;
  revenue: number;
  estimatedFoodCost: number;
  grossProfit: number;
  foodCostPercentage: number;
};

export function FoodCostTable() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["food-cost-analytics"],

    queryFn: async () => {
      const res = await fetch("/api/analytics/food-cost");

      if (!res.ok) {
        throw new Error("Failed to fetch food cost analytics");
      }

      return res.json();
    },

    staleTime: 1000 * 60,

    gcTime: 1000 * 60 * 10,

    refetchOnWindowFocus: false,
  });

  const foodCostData: FoodCostData[] = data?.data ?? [];

  function getFoodCostColor(percentage: number) {
    if (percentage <= 30) {
      return "text-green-600";
    }

    if (percentage <= 45) {
      return "text-orange-500";
    }

    return "text-red-600";
  }

  return (
    <section className="flex h-full flex-col overflow-hidden">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Food Cost Analytics</h2>

        <p className="text-sm text-neutral-500">Menu profitability overview</p>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          Loading food cost analytics...
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center text-sm text-red-500">
          Failed to load food cost analytics.
        </div>
      ) : foodCostData.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          No food cost analytics yet.
        </div>
      ) : (
        <div className="flex-1 overflow-auto rounded-2xl border border-neutral-100">
          <table className="w-full min-w-[720px]">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-neutral-200 text-left">
                <th className="px-4 py-3 text-sm font-semibold">Menu</th>

                <th className="px-4 py-3 text-sm font-semibold">Sold</th>

                <th className="px-4 py-3 text-sm font-semibold">Revenue</th>

                <th className="px-4 py-3 text-sm font-semibold">Food Cost</th>

                <th className="px-4 py-3 text-sm font-semibold">
                  Gross Profit
                </th>

                <th className="px-4 py-3 text-sm font-semibold">Cost %</th>
              </tr>
            </thead>

            <tbody>
              {foodCostData.map((item) => (
                <tr key={item.name} className="border-b border-neutral-100">
                  <td className="px-4 py-4 font-medium">{item.name}</td>

                  <td className="px-4 py-4">{item.quantitySold}</td>

                  <td className="px-4 py-4 font-semibold">
                    {formatCurrency(item.revenue)}
                  </td>

                  <td className="px-4 py-4">
                    {formatCurrency(item.estimatedFoodCost)}
                  </td>

                  <td className="px-4 py-4 font-bold text-green-600">
                    {formatCurrency(item.grossProfit)}
                  </td>

                  <td
                    className={`px-4 py-4 font-bold ${getFoodCostColor(
                      item.foodCostPercentage,
                    )}`}
                  >
                    {item.foodCostPercentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
