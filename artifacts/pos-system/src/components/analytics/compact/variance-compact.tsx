"use client";

import { useQuery } from "@tanstack/react-query";

import { AlertTriangle, ShieldCheck } from "lucide-react";

type VarianceItem = {
  ingredient: string;
  theoretical: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  status: "GOOD" | "WARNING" | "CRITICAL";
};

export function VarianceCompact() {
  const { data, isLoading } = useQuery({
    queryKey: ["variance-analytics"],

    queryFn: async () => {
      const res = await fetch("/api/analytics/variance", { credentials: "include" });

      if (!res.ok) {
        throw new Error("Failed to fetch variance analytics");
      }

      return res.json();
    },

    staleTime: 1000 * 60,

    refetchOnWindowFocus: false,
  });

  const varianceData: VarianceItem[] = data?.data ?? [];

  const averageVariance =
    varianceData.length > 0
      ? Math.round(
          varianceData.reduce(
            (acc, item) => acc + Math.abs(item.variancePercentage),
            0,
          ) / varianceData.length,
        )
      : 0;

  const criticalCount = varianceData.filter(
    (item) => item.status === "CRITICAL",
  ).length;

  const isHealthy = criticalCount === 0 && averageVariance <= 5;

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Variance</p>

          <h2 className="mt-2 text-2xl font-bold">
            {isLoading ? "..." : `${averageVariance}%`}
          </h2>
        </div>

        <div
          className={`rounded-2xl p-3 ${
            isHealthy ? "bg-green-100" : "bg-yellow-100"
          }`}
        >
          {isHealthy ? (
            <ShieldCheck className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          )}
        </div>
      </div>

      <div className="mt-4">
        <p
          className={`text-sm font-medium ${
            isHealthy ? "text-green-600" : "text-yellow-600"
          }`}
        >
          {isLoading
            ? "Loading..."
            : isHealthy
              ? "Inventory stable"
              : `${criticalCount} critical mismatches`}
        </p>
      </div>
    </div>
  );
}
