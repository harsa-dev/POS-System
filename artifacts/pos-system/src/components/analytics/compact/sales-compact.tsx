"use client";

import { TrendingUp } from "lucide-react";

import { useAnalyticsOverview } from "@/hooks/use-analytics-overview";
import { formatCurrency } from "@/lib/utils/format";

export function SalesCompact() {
  const { data, isLoading } = useAnalyticsOverview();

  const revenue = data?.data?.totalRevenue ?? 0;

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Revenue</p>

          <h2 className="mt-2 text-2xl font-bold">
            {isLoading ? "..." : formatCurrency(revenue)}
          </h2>
        </div>

        <div className="rounded-2xl bg-green-100 p-3">
          <TrendingUp className="h-5 w-5 text-green-600" />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-green-600">
          {isLoading ? "Loading..." : "Live business revenue"}
        </p>
      </div>
    </div>
  );
}
