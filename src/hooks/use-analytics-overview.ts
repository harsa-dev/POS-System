"use client";

import { useQuery } from "@tanstack/react-query";

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: [
      "analytics-overview",
    ],

    queryFn: async () => {
      const res = await fetch(
        "/api/analytics/overview",
      );

      if (!res.ok) {
        throw new Error(
          "Failed to fetch analytics overview",
        );
      }

      return res.json();
    },

    staleTime: 1000 * 60,

    gcTime: 1000 * 60 * 10,

    refetchOnWindowFocus: false,
  });
}