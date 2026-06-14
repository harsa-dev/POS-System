import { StatCard } from "@/features/shared/cards";
import type { DashboardTone } from "@/features/shared/types";
import type { LucideIcon } from "lucide-react";

const statusTone: Record<string, DashboardTone> = {
  Active: "green",
  Pending: "amber",
  Suspended: "rose",
  Locked: "slate",
  Custom: "blue",
  Draft: "amber",
  "Job Preset": "green",
};

export function getStatusTone(status: string): DashboardTone {
  return statusTone[status] ?? "slate";
}

export function MiniStat({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone: DashboardTone;
}) {
  return <StatCard label={label} value={value} note={note} icon={Icon} tone={tone} />;
}
