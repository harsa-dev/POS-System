"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: [
      "analytics-overview",
    ],

    queryFn: async () => {
      const res = await apiFetch(
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