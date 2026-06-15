"use client";

import { useEffect } from "react";

import {
  publishSalesAnalyticsFilterContext,
  readSalesAnalyticsFilterContextFromDom,
} from "./sales-analytics-filter-sync";

export function SalesAnalyticsFilterSyncObserver() {
  useEffect(() => {
    let frame: number | null = null;

    const syncFilters = () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }

      frame = window.requestAnimationFrame(() => {
        publishSalesAnalyticsFilterContext(readSalesAnalyticsFilterContextFromDom());
        frame = null;
      });
    };

    syncFilters();

    document.addEventListener("change", syncFilters, true);
    document.addEventListener("input", syncFilters, true);

    const observer = new MutationObserver(syncFilters);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }

      document.removeEventListener("change", syncFilters, true);
      document.removeEventListener("input", syncFilters, true);
      observer.disconnect();
    };
  }, []);

  return null;
}
