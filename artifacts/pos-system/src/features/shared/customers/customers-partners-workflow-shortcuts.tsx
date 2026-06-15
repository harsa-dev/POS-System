"use client";

import { FileUp, Search, UploadCloud, UsersRound } from "lucide-react";

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
    href: "#customers-detail",
    icon: Search,
    title: "View contact detail",
    description: "Review one customer or supplier profile, value, activity, and contact data.",
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
      description="Use the workflow panels before editing the directory. Import, sales sync, and detail view are backend-backed workflows."
    >
      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
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
