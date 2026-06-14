import {
  Boxes,
  ClipboardList,
  Factory,
  PackageSearch,
  Scale,
  Sprout,
  Truck,
  type LucideIcon,
} from "lucide-react";

import type { RawMaterialWorkspaceModuleId } from "@/features/raw-material/core-system";

export const rawMaterialModuleIcons: Record<RawMaterialWorkspaceModuleId, LucideIcon> = {
  intake: Truck,
  weighing: Scale,
  batches: ClipboardList,
  storage: Boxes,
  processing: Factory,
  kandang: Sprout,
  suppliers: PackageSearch,
};

export const rawMaterialQualityStatusTone = {
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inspection: "border-amber-200 bg-amber-50 text-amber-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
} as const;

export const rawMaterialProcessStatusTone = {
  planned: "border-neutral-200 bg-neutral-50 text-neutral-600",
  running: "border-blue-200 bg-blue-50 text-blue-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
} as const;

export const rawMaterialHealthStatusTone = {
  stable: "border-emerald-200 bg-emerald-50 text-emerald-700",
  monitoring: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-rose-200 bg-rose-50 text-rose-700",
} as const;

export const rawMaterialQualityFilterOptions = [
  "all",
  "accepted",
  "inspection",
  "rejected",
] as const;

export const rawMaterialSupplierCategoryOptions = [
  "all",
  "Feed",
  "Livestock",
  "Packaging",
  "Raw Goods",
] as const;
