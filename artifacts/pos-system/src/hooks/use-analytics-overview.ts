"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: [
      "analytics-overview",
    ],

    queryFn: () => analyticsApi.overview(),

    staleTime: 1000 * 60,

    gcTime: 1000 * 60 * 10,

    refetchOnWindowFocus: false,
  });
}