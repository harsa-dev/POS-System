import type { ElementType } from "react";

export type DashboardTone = "blue" | "green" | "amber" | "rose" | "red" | "slate";

export type StatMetric = {
  label: string;
  value: string;
  note?: string;
  icon: ElementType;
  tone?: DashboardTone;
};

export type AnalyticsDataPoint = {
  label: string;
  value: number;
};

export type DateRangeOption =
  | "Today"
  | "This Week"
  | "This Month"
  | "Custom Range";
