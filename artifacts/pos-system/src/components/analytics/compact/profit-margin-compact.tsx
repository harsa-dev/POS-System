"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

import { TrendingUp, TrendingDown } from "lucide-react";

type ProfitData = {
  name: string;
  quantitySold: number;
  revenue: number;
  foodCost: number;
  grossProfit: number;
  marginPercentage: number;
};

export function ProfitMarginCompact() {
  const { data, isLoading } = useQuery({
    queryKey: ["profit-margin"],

    queryFn: async () => {
      const res = await apiFetch("/api/analytics/profit-margin", { credentials: "include" });

      if (!res.ok) {
        throw new Error("Failed to fetch profit margin analytics");
      }

      return res.json();
    },

    staleTime: 1000 * 60,

    refetchOnWindowFocus: false,
  });

  const profitData: ProfitData[] = data?.data ?? [];

  const averageMargin =
    profitData.length > 0
      ? Math.round(
          profitData.reduce((acc, item) => acc + item.marginPercentage, 0) /
            profitData.length,
        )
      : 0;

  const isHealthy = averageMargin >= 60;

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Profit</p>

          <h2 className="mt-2 text-2xl font-bold">
            {isLoading ? "..." : `${averageMargin}%`}
          </h2>
        </div>

        <div
          className={`rounded-2xl p-3 ${
            isHealthy ? "bg-emerald-100" : "bg-red-100"
          }`}
        >
          {isHealthy ? (
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-600" />
          )}
        </div>
      </div>

      <div className="mt-4">
        <p
          className={`text-sm font-medium ${
            isHealthy ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {isLoading
            ? "Loading..."
            : isHealthy
              ? "Net margin healthy"
              : "Margin decreasing"}
        </p>
      </div>
    </div>
  );
}
