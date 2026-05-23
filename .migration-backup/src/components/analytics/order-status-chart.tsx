"use client";

import { useQuery } from "@tanstack/react-query";

import {
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type StatusData = {
  status: string;
  total: number;
};

const STATUS_COLORS: Record<
  string,
  string
> = {
  PENDING_PAYMENT: "#f59e0b",
  PREPARING: "#3b82f6",
  READY: "#8b5cf6",
  SERVED: "#22c55e",
  COMPLETED: "#16a34a",
  CANCELLED: "#ef4444",
  PAID: "#06b6d4",
};

export function OrderStatusChart() {
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "order-status-chart",
    ],

    queryFn: async () => {
      const res = await fetch(
        "/api/analytics/order-status",
      );

      if (!res.ok) {
        throw new Error(
          "Failed to fetch order status analytics",
        );
      }

      return res.json();
    },

    staleTime:
      1000 * 60,

    gcTime:
      1000 *
      60 *
      10,

    refetchOnWindowFocus:
      false,
  });

  const chartData: StatusData[] =
    data?.data ?? [];

  const visibleData =
    chartData.filter(
      (item) => item.total > 0,
    );

  const totalOrders =
    visibleData.reduce(
      (acc, item) =>
        acc + item.total,
      0,
    );

  return (
    <section className="flex h-full flex-col overflow-hidden">
      <div className="mb-4 shrink-0">
        <h2 className="text-lg font-semibold">
          Order Status
        </h2>

        <p className="text-sm text-neutral-500">
          Current operational
          flow
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          Loading order
          analytics...
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center text-sm text-red-500">
          Failed to load
          order analytics.
        </div>
      ) : visibleData.length ===
        0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          No order analytics
          available.
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[1fr_260px] gap-6 overflow-hidden">
          {/* CHART */}
          <div className="min-h-0">
            <ChartContainer
              config={{}}
              className="h-full w-full"
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent />
                    }
                  />

                  <Pie
                    data={
                      visibleData
                    }
                    dataKey="total"
                    nameKey="status"
                    innerRadius={
                      90
                    }
                    outerRadius={
                      140
                    }
                    paddingAngle={
                      4
                    }
                    cornerRadius={
                      10
                    }
                  >
                    {visibleData.map(
                      (
                        entry,
                      ) => (
                        <Cell
                          key={
                            entry.status
                          }
                          fill={
                            STATUS_COLORS[
                              entry
                                .status
                            ] ??
                            "#6b7280"
                          }
                        />
                      ),
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* LEGEND */}
          <div className="flex flex-col justify-center gap-4">
            {visibleData.map(
              (item) => {
                const percentage =
                  Math.round(
                    (item.total /
                      totalOrders) *
                      100,
                  );

                return (
                  <div
                    key={
                      item.status
                    }
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            STATUS_COLORS[
                              item
                                .status
                            ] ??
                            "#6b7280",
                        }}
                      />

                      <span className="text-sm font-medium">
                        {item.status.replaceAll(
                          "_",
                          " ",
                        )}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {
                          item.total
                        }
                      </p>

                      <p className="text-xs text-neutral-500">
                        {
                          percentage
                        }
                        %
                      </p>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}
    </section>
  );
}