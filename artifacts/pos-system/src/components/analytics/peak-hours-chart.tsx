"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type PeakHour = {
  hour: string;
  total: number;
};

export function PeakHoursChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["peak-hours"],

    queryFn: () => analyticsApi.peakHours(),

    staleTime: 1000 * 60,

    gcTime: 1000 * 60 * 10,

    refetchOnWindowFocus: false,
  });

  const chartData: PeakHour[] = data?.data ?? [];

  return (
    <section className="flex h-full flex-col overflow-hidden">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Peak Hours</h2>

        <p className="text-sm text-neutral-500">Customer traffic by hour</p>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          Loading peak hour analytics...
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center text-sm text-red-500">
          Failed to load peak hour analytics.
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden">
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
                  dataKey="hour"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />

                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />

                <Bar dataKey="total" radius={10} fill="var(--chart-2)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}
    </section>
  );
}
