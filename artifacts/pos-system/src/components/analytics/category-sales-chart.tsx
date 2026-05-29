"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type CategoryData = {
  category: string;
  revenue: number;
  quantity: number;
};

export function CategorySalesChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["category-sales"],

    queryFn: () => analyticsApi.categorySales(),

    staleTime: 1000 * 60,

    refetchOnWindowFocus: false,
  });

  const chartData: CategoryData[] = data?.data ?? [];

  return (
    <section className="flex h-full flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Revenue by Category</h2>

        <p className="text-sm text-neutral-500">
          Category performance overview
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          Loading category analytics...
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center text-sm text-red-500">
          Failed to load category analytics.
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          No category analytics yet.
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <ChartContainer config={{}} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 0,
                }}
              >
                <CartesianGrid vertical={false} />

                <XAxis
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />

                <YAxis tickLine={false} axisLine={false} />

                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />

                <Bar dataKey="revenue" radius={8} fill="var(--chart-3)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}
    </section>
  );
}
