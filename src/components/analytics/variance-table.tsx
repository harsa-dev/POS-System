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

export function VarianceTable() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["variance-analytics"],

    queryFn: async () => {
      const res = await fetch("/api/analytics/variance");

      if (!res.ok) {
        throw new Error("Failed to fetch variance analytics");
      }

      return res.json();
    },

    staleTime: 1000 * 60,

    refetchOnWindowFocus: false,
  });

  const varianceData: VarianceItem[] = data?.data ?? [];

  function getStatusStyles(status: VarianceItem["status"]) {
    switch (status) {
      case "GOOD":
        return {
          icon: <ShieldCheck className="h-4 w-4" />,

          className: "bg-green-100 text-green-700",
        };

      case "WARNING":
        return {
          icon: <AlertTriangle className="h-4 w-4" />,

          className: "bg-orange-100 text-orange-700",
        };

      case "CRITICAL":
        return {
          icon: <AlertTriangle className="h-4 w-4" />,

          className: "bg-red-100 text-red-700",
        };
    }
  }

  return (
    <section className="flex h-full flex-col overflow-hidden">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Variance Analytics</h2>

        <p className="text-sm text-neutral-500">
          Theoretical vs actual inventory usage
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          Loading variance analytics...
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center text-sm text-red-500">
          Failed to load variance analytics.
        </div>
      ) : varianceData.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          No variance analytics yet.
        </div>
      ) : (
        <div className="flex-1 overflow-auto rounded-2xl border border-neutral-100">
          <table className="w-full min-w-[760px]">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-neutral-200 text-left">
                <th className="px-4 py-3 text-sm font-semibold">Ingredient</th>

                <th className="px-4 py-3 text-sm font-semibold">Theoretical</th>

                <th className="px-4 py-3 text-sm font-semibold">Actual</th>

                <th className="px-4 py-3 text-sm font-semibold">Variance</th>

                <th className="px-4 py-3 text-sm font-semibold">Variance %</th>

                <th className="px-4 py-3 text-sm font-semibold">Status</th>
              </tr>
            </thead>

            <tbody>
              {varianceData.map((item) => {
                const styles = getStatusStyles(item.status);

                return (
                  <tr
                    key={item.ingredient}
                    className="border-b border-neutral-100"
                  >
                    <td className="px-4 py-4 font-medium">{item.ingredient}</td>

                    <td className="px-4 py-4">{item.theoretical}</td>

                    <td className="px-4 py-4">{item.actual}</td>

                    <td
                      className={`px-4 py-4 font-bold ${
                        item.variance > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {item.variance > 0 ? "+" : ""}
                      {item.variance}
                    </td>

                    <td className="px-4 py-4 font-bold">
                      {item.variancePercentage}%
                    </td>

                    <td className="px-4 py-4">
                      <div
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${styles.className}`}
                      >
                        {styles.icon}

                        {item.status}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
