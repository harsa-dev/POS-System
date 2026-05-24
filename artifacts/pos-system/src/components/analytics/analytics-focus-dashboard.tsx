"use client";

import { useCallback, useMemo, useState, Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { analyticsRegistry } from "./analytics-registry";
import { AnalyticsShell } from "./analytics-shell";

function CompactSkeleton() {
  return (
    <div className="flex h-full flex-col justify-between animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-neutral-200" />
          <div className="h-6 w-24 rounded bg-neutral-200" />
        </div>
        <div className="h-11 w-11 rounded-2xl bg-neutral-200" />
      </div>
      <div className="h-3 w-28 rounded bg-neutral-200" />
    </div>
  );
}

function MainSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 animate-pulse p-1">
      <div className="h-5 w-40 rounded bg-neutral-200" />
      <div className="h-3 w-56 rounded bg-neutral-200" />
      <div className="flex-1 rounded-2xl bg-neutral-100" />
    </div>
  );
}

export function AnalyticsFocusDashboard() {
  const [selectedId, setSelectedId] = useState("sales");
  const [carouselIndex, setCarouselIndex] = useState(0);

  const selectedAnalytics = analyticsRegistry.find((item) => item.id === selectedId);

  const compactAnalytics = useMemo(() => {
    const filtered = analyticsRegistry.filter((item) => item.id !== selectedId);
    const rotated = [...filtered.slice(carouselIndex), ...filtered.slice(0, carouselIndex)];
    return rotated.slice(0, 3);
  }, [selectedId, carouselIndex]);

  const filteredLength = useMemo(
    () => analyticsRegistry.filter((item) => item.id !== selectedId).length,
    [selectedId],
  );

  const handleNext = useCallback(
    () => setCarouselIndex((prev) => (prev + 1) % filteredLength),
    [filteredLength],
  );

  const handlePrev = useCallback(
    () => setCarouselIndex((prev) => (prev === 0 ? filteredLength - 1 : prev - 1)),
    [filteredLength],
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setCarouselIndex(0);
  }, []);

  if (!selectedAnalytics) return null;

  const ActiveMainComponent = selectedAnalytics.mainComponent;

  return (
    <section className="flex h-full flex-col gap-4 overflow-hidden lg:gap-5">
      {/* MAIN PANEL */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <AnalyticsShell>
          <div className="h-full overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="h-full"
              >
                <Suspense fallback={<MainSkeleton />}>
                  <ActiveMainComponent />
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </AnalyticsShell>
      </div>

      {/* CAROUSEL */}
      <div className="relative flex shrink-0 items-center justify-center">
        {/* LEFT */}
        <button
          onClick={handlePrev}
          aria-label="Previous analytics"
          className="absolute left-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm transition-all duration-200 hover:-translate-x-0.5 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
        >
          <ChevronLeft className="h-4 w-4 text-neutral-600" />
        </button>

        {/* CARDS */}
        <div className="grid w-full max-w-5xl grid-cols-1 gap-3 px-12 sm:grid-cols-3 sm:px-14">
          {compactAnalytics.map((analytics, i) => {
            const CompactComponent = analytics.compactComponent;
            return (
              <motion.button
                key={analytics.id}
                onClick={() => handleSelect(analytics.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, delay: i * 0.04, ease: "easeOut" }}
                className="h-[120px] overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 sm:h-[145px] sm:rounded-3xl"
              >
                <p className="mb-1 text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                  {analytics.title}
                </p>
                <Suspense fallback={<CompactSkeleton />}>
                  <CompactComponent />
                </Suspense>
              </motion.button>
            );
          })}
        </div>

        {/* RIGHT */}
        <button
          onClick={handleNext}
          aria-label="Next analytics"
          className="absolute right-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm transition-all duration-200 hover:translate-x-0.5 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
        >
          <ChevronRight className="h-4 w-4 text-neutral-600" />
        </button>
      </div>
    </section>
  );
}
