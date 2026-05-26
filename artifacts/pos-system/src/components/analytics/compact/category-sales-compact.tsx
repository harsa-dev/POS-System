"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

import { PieChart } from "lucide-react";

type CategoryData = {
  category: string;
  revenue: number;
  quantity: number;
};

export function CategorySalesCompact() {
  const { data, isLoading } = useQuery({
    queryKey: ["category-sales"],

    queryFn: async () => {
      const res = await apiFetch("/api/analytics/category-sales", { credentials: "include" });

      if (!res.ok) {
        throw new Error("Failed to fetch category analytics");
      }

      return res.json();
    },

    staleTime: 1000 * 60,

    refetchOnWindowFocus: false,
  });

  const categories: CategoryData[] = data?.data ?? [];

  const topCategory = categories[0];

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Categories</p>

          <h2 className="mt-2 text-2xl font-bold">
            {isLoading ? "..." : (topCategory?.category ?? "-")}
          </h2>
        </div>

        <div className="rounded-2xl bg-indigo-100 p-3">
          <PieChart className="h-5 w-5 text-indigo-600" />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-neutral-500">
          {isLoading
            ? "Loading..."
            : topCategory
              ? `${topCategory.quantity} items sold`
              : "No category data"}
        </p>
      </div>
    </div>
  );
}
