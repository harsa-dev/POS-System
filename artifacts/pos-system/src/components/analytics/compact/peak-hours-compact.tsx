"use client";

import { useQuery } from "@tanstack/react-query";

import { Clock3 } from "lucide-react";

type PeakHour = {
  hour: string;
  total: number;
};

export function PeakHoursCompact() {
  const { data, isLoading } = useQuery({
    queryKey: ["peak-hours"],

    queryFn: async () => {
      const res = await fetch("/api/analytics/peak-hours", { credentials: "include" });

      if (!res.ok) {
        throw new Error("Failed to fetch peak hours analytics");
      }

      return res.json();
    },

    staleTime: 1000 * 60,

    refetchOnWindowFocus: false,
  });

  const peakHours: PeakHour[] = data?.data ?? [];

  const topHour = peakHours.reduce<PeakHour | undefined>((highest, current) => {
    if (!highest) {
      return current;
    }

    return current.total > highest.total ? current : highest;
  }, undefined);

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Peak Hours</p>

          <h2 className="mt-2 text-2xl font-bold">
            {isLoading ? "..." : (topHour?.hour ?? "-")}
          </h2>
        </div>

        <div className="rounded-2xl bg-orange-100 p-3">
          <Clock3 className="h-5 w-5 text-orange-600" />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-neutral-500">
          {isLoading
            ? "Loading..."
            : topHour
              ? `${topHour.total} active orders`
              : "No traffic data"}
        </p>
      </div>
    </div>
  );
}
