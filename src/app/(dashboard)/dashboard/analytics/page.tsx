"use client";

import { AnalyticsFocusDashboard } from "@/components/analytics/analytics-focus-dashboard";

export default function AnalyticsPage() {
  return (
    <section className="flex h-[calc(100vh-80px)] flex-col overflow-hidden">

      <div className="mt-6 min-h-0 flex-1 overflow-hidden">
        <AnalyticsFocusDashboard />
      </div>
    </section>
  );
}
