"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

import { TrendingUp, TrendingDown } from "lucide-react";

import { formatCurrency } from "@/lib/utils/format";

type ProfitData = {
  name: string;
  quantitySold: number;
  revenue: number;
  foodCost: number;
  grossProfit: number;
  marginPercentage: number;
};

export function ProfitMarginTable() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["profit-margin"],

    queryFn: async () => {
      const res = await apiFetch("/api/analytics/profit-margin", { credentials: "include" });

      if (!res.ok) {
        throw new Error("Failed to fetch profit margin analytics");
      }

      return res.json();
    },

    staleTime: 1000 * 60,

    gcTime: 1000 * 60 * 10,

    refetchOnWindowFocus: false,
  });

  const profitData: ProfitData[] = data?.data ?? [];

  return (
    <section className="flex h-full flex-col overflow-hidden">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Profit Margin Analytics</h2>

        <p className="text-sm text-neutral-500">
          Menu profitability performance
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          Loading profit analytics...
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center text-sm text-red-500">
          Failed to load profit analytics.
        </div>
      ) : profitData.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          No profit analytics yet.
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {profitData.map((item) => {
            const isHealthy = item.marginPercentage >= 60;

            return (
              <div
                key={item.name}
                className="rounded-2xl border border-neutral-100 p-4 transition-colors hover:border-neutral-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold">{item.name}</p>

                    <p className="mt-1 text-sm text-neutral-500">
                      {item.quantitySold} sold
                    </p>
                  </div>

                  <div
                    className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${
                      isHealthy
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {isHealthy ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {item.marginPercentage}%
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl bg-neutral-50 p-3">
                    <p className="text-neutral-500">Revenue</p>

                    <p className="mt-1 font-bold">
                      {formatCurrency(item.revenue)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-orange-50 p-3">
                    <p className="text-orange-600">Food Cost</p>

                    <p className="mt-1 font-bold text-orange-700">
                      {formatCurrency(item.foodCost)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-green-50 p-3">
                    <p className="text-green-600">Gross Profit</p>

                    <p className="mt-1 font-bold text-green-700">
                      {formatCurrency(item.grossProfit)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
