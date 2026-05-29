"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";

import { AlertTriangle } from "lucide-react";

type InventoryItem = {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
};

export function LowStockCompact() {
  const { data, isLoading } = useQuery({
    queryKey: ["low-stock"],

    queryFn: () => analyticsApi.lowStock(),

    staleTime: 1000 * 60,

    refetchOnWindowFocus: false,
  });

  const items: InventoryItem[] = data?.data ?? [];

  const criticalCount = items.length;

  const hasCriticalStock = criticalCount > 0;

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Low Stock</p>

          <h2 className="mt-2 text-2xl font-bold">
            {isLoading ? "..." : `${criticalCount} Items`}
          </h2>
        </div>

        <div className="rounded-2xl bg-red-100 p-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
      </div>

      <div className="mt-4">
        <p
          className={`text-sm font-medium ${
            hasCriticalStock ? "text-red-600" : "text-green-600"
          }`}
        >
          {isLoading
            ? "Loading..."
            : hasCriticalStock
              ? "Needs restock"
              : "Inventory healthy"}
        </p>
      </div>
    </div>
  );
}
