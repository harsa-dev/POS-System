"use client";

import { useMemo, useState } from "react";

import { analyticsRegistry } from "./analytics-registry";

import { AnalyticsShell } from "./analytics-shell";

export function AnalyticsFocusDashboard() {
  const [selectedId, setSelectedId] =
    useState("sales");

  const [
    carouselIndex,
    setCarouselIndex,
  ] = useState(0);

  const selectedAnalytics =
    analyticsRegistry.find(
      (item) =>
        item.id ===
        selectedId,
    );

  const compactAnalytics =
    useMemo(() => {
      const filtered =
        analyticsRegistry.filter(
          (item) =>
            item.id !==
            selectedId,
        );

      const rotated = [
        ...filtered.slice(
          carouselIndex,
        ),

        ...filtered.slice(
          0,
          carouselIndex,
        ),
      ];

      return rotated.slice(
        0,
        3,
      );
    }, [
      selectedId,
      carouselIndex,
    ]);

  if (!selectedAnalytics) {
    return null;
  }

  const ActiveMainComponent =
    selectedAnalytics.mainComponent;

  const handleNext = () => {
    const filteredLength =
      analyticsRegistry.filter(
        (item) =>
          item.id !==
          selectedId,
      ).length;

    setCarouselIndex(
      (prev) =>
        (prev + 1) %
        filteredLength,
    );
  };

  const handlePrev = () => {
    const filteredLength =
      analyticsRegistry.filter(
        (item) =>
          item.id !==
          selectedId,
      ).length;

    setCarouselIndex(
      (prev) =>
        prev === 0
          ? filteredLength - 1
          : prev - 1,
    );
  };

  return (
    <section className="grid h-full grid-rows-[minmax(0,1fr)_auto] gap-5 overflow-hidden">
      {/* MAIN PANEL */}
      <div className="min-h-0 overflow-hidden">
        <AnalyticsShell>
          <div className="h-full overflow-hidden">
            <ActiveMainComponent />
          </div>
        </AnalyticsShell>
      </div>

      {/* FLOATING CAROUSEL */}
      <div className="relative flex items-center justify-center">
        {/* LEFT BUTTON */}
        <button
          onClick={handlePrev}
          className="absolute left-0 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-x-1 hover:bg-neutral-100"
        >
          ←
        </button>

        {/* CARDS */}
        <div className="grid w-full max-w-5xl grid-cols-3 gap-4 px-20">
          {compactAnalytics.map(
            (analytics) => {
              const CompactComponent =
                analytics.compactComponent;

              const isActive =
                analytics.id ===
                selectedId;

              return (
                <button
                  key={
                    analytics.id
                  }
                  onClick={() =>
                    setSelectedId(
                      analytics.id,
                    )
                  }
                  className={`group h-[165px] overflow-hidden rounded-3xl border bg-white p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                    isActive
                      ? "border-blue-500 ring-2 ring-blue-100"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <div className="mb-4">
                    <h3 className="font-semibold">
                      {
                        analytics.title
                      }
                    </h3>

                    <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
                      {
                        analytics.description
                      }
                    </p>
                  </div>

                  <CompactComponent />
                </button>
              );
            },
          )}
        </div>

        {/* RIGHT BUTTON */}
        <button
          onClick={handleNext}
          className="absolute right-0 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:translate-x-1 hover:bg-neutral-100"
        >
          →
        </button>
      </div>
    </section>
  );
}