"use client";

import { useQuery } from "@tanstack/react-query";

import { ClipboardList } from "lucide-react";

type StatusData = {
  status: string;
  total: number;
};

export function OrderStatusCompact() {
  const { data, isLoading } = useQuery({
    queryKey: ["order-status-chart"],

    queryFn: async () => {
      const res = await fetch("/api/analytics/order-status");

      if (!res.ok) {
        throw new Error("Failed to fetch order status analytics");
      }

      return res.json();
    },

    staleTime: 1000 * 60,

    refetchOnWindowFocus: false,
  });

  const statuses: StatusData[] = data?.data ?? [];

  const totalOrders = statuses.reduce((acc, item) => acc + item.total, 0);

  const activeStatuses = statuses.filter((item) => item.status !== "COMPLETED");

  const activeOrders = activeStatuses.reduce(
    (acc, item) => acc + item.total,
    0,
  );

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Orders</p>

          <h2 className="mt-2 text-2xl font-bold">
            {isLoading ? "..." : activeOrders}
          </h2>
        </div>

        <div className="rounded-2xl bg-blue-100 p-3">
          <ClipboardList className="h-5 w-5 text-blue-600" />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-neutral-500">
          {isLoading ? "Loading..." : `${totalOrders} total transactions`}
        </p>
      </div>
    </div>
  );
}
