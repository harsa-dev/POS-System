"use client";

import { Award, FileUp, Search, Sparkles, UploadCloud, UserCheck, UsersRound } from "lucide-react";

import { DashboardPanel } from "@/features/shared/dashboard";

const shortcuts = [
  {
    href: "#customers-sales-sync",
    icon: UploadCloud,
    title: "Sync from paid invoices",
    description: "Build or update customer profiles from paid invoice history.",
  },
  {
    href: "#customers-csv-import",
    icon: FileUp,
    title: "Import CSV contacts",
    description: "Preview customer or supplier CSV rows before saving backend records.",
  },
  {
    href: "#customers-loyalty-tiers",
    icon: Sparkles,
    title: "Manage loyalty tiers",
    description: "Adjust tier thresholds, period labels, and discount settings.",
  },
  {
    href: "#customers-tier-assignment",
    icon: UserCheck,
    title: "Assign customer tiers",
    description: "Apply tier settings to customer profiles based on backend spending totals.",
  },
  {
    href: "#customers-tier-directory",
    icon: Award,
    title: "Review assigned tiers",
    description: "Inspect which tier is currently stored on every customer profile.",
  },
  {
    href: "#customers-detail-lookup",
    icon: Search,
    title: "View contact detail",
    description: "Pick a customer or supplier row, then open a backend detail record.",
  },
  {
    href: "#customers-directory",
    icon: UsersRound,
    title: "Manage directory",
    description: "Create, edit, delete, search, and export backend-backed contacts.",
  },
] as const;

export function CustomersPartnersWorkflowShortcuts() {
  return (
    <DashboardPanel
      title="Customers & Partners Workflow"
      description="Use the workflow panels before editing the directory. Import, sales sync, loyalty tiers, tier assignment, and detail view are backend-backed workflows. Civilization trembles."
    >
      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
        {shortcuts.map((item) => {
          const Icon = item.icon;

          return (
            <a
              key={item.href}
              href={item.href}
              className="group rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 hover:bg-neutral-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 group-hover:bg-neutral-200">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-neutral-950">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-neutral-600">{item.description}</p>
            </a>
          );
        })}
      </div>
    </DashboardPanel>
  );
}
