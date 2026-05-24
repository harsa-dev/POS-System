"use client";

import { useQuery } from "@tanstack/react-query";

import { Pie, PieChart, Cell } from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { formatCurrency } from "@/lib/utils/format";

type PaymentMethodData = {
  paymentMethod: string;
  totalOrders: number;
  revenue: number;
};

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6"];

export function PaymentMethodChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["payment-methods"],

    queryFn: async () => {
      const res = await fetch("/api/analytics/payment-method", { credentials: "include" });

      if (!res.ok) {
        throw new Error("Failed to fetch payment analytics");
      }

      return res.json();
    },

    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,

    refetchOnWindowFocus: false,
  });

  const chartData: PaymentMethodData[] = data?.data ?? [];

  return (
    <Card className="rounded-3xl border border-neutral-200 shadow-sm">
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>

        <CardDescription>Customer payment preferences</CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex min-h-[280px] items-center justify-center text-sm text-neutral-500">
            Loading payment analytics...
          </div>
        ) : error ? (
          <div className="flex min-h-[280px] items-center justify-center text-sm text-red-500">
            Failed to load payment analytics.
          </div>
        ) : (
          <>
            <ChartContainer config={{}} className="mx-auto min-h-[280px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />

                <Pie
                  data={chartData}
                  dataKey="totalOrders"
                  nameKey="paymentMethod"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.paymentMethod}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            <div className="mt-6 space-y-3">
              {chartData.map((item, index) => (
                <div
                  key={item.paymentMethod}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />

                    <div>
                      <p className="text-sm font-semibold">
                        {item.paymentMethod}
                      </p>

                      <p className="text-xs text-neutral-500">
                        {item.totalOrders} orders
                      </p>
                    </div>
                  </div>

                  <p className="text-sm font-bold">
                    {formatCurrency(item.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
