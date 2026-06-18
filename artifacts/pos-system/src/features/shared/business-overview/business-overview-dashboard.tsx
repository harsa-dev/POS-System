"use client";

import {
  BarChart3,
  Banknote,
  Box,
  ChevronRight,
  FileText,
  Handshake,
  Receipt,
  ShoppingCart,
  Users,
  Warehouse,
  Wrench,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { Link } from "wouter";

import { businessModeRegistry } from "@/components/core/business-mode/business-mode-registry";
import { StatusPill } from "@/features/shared/cards";
import {
  DashboardPanel,
  DashboardShell,
} from "@/features/shared/dashboard";
import { ROUTES } from "@/constants/routes";
import type { BusinessModeConfig } from "@/config/business-modes";
import type { DashboardTone } from "@/features/shared/types";

// ─── Mode status helpers ────────────────────────────────────────────────────

const modeToneMap: Record<string, DashboardTone> = {
  available: "green",
  planned: "slate",
  disabled: "rose",
};

const modeBadgeMap: Record<string, string> = {
  available: "Available",
  planned: "Planned",
  disabled: "Disabled",
};

const modeIconMap: Record<string, LucideIcon> = {
  restaurant: UtensilsCrossed,
  retail: ShoppingCart,
  "raw-material": Warehouse,
  "custom-business": Wrench,
};

// ─── Shared module directory ─────────────────────────────────────────────────
// These are real navigation entries — each route exists and is registered in
// the module registry. This list is a curated navigation index, not mock data.

type SharedModuleEntry = {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: LucideIcon;
};

const SHARED_MODULE_DIRECTORY: SharedModuleEntry[] = [
  {
    id: "analytics",
    name: "Sales Analytics",
    description: "Revenue trend, order volume, product performance, and profit margin.",
    route: ROUTES.ANALYTICS,
    icon: BarChart3,
  },
  {
    id: "customers",
    name: "Customers & Partners",
    description: "Customer CRM, supplier contacts, loyalty tiers, and sales sync.",
    route: ROUTES.CUSTOMERS,
    icon: Handshake,
  },
  {
    id: "inventory",
    name: "Inventory",
    description: "Stock levels, movement history, cost snapshots, and anomaly review.",
    route: ROUTES.INVENTORY,
    icon: Box,
  },
  {
    id: "cashflow",
    name: "Cashflow",
    description: "Income, expenses, account balances, and daily cash movement.",
    route: ROUTES.CASHFLOW,
    icon: Banknote,
  },
  {
    id: "reports",
    name: "Financial Reports",
    description: "P&L, gross margin, receivables, cashflow summary, and PDF export.",
    route: ROUTES.FINANCIAL_REPORTS,
    icon: FileText,
  },
  {
    id: "invoice",
    name: "Invoice Generator",
    description: "Draft, save, and track invoices with follow-up analytics.",
    route: ROUTES.INVOICE_GENERATOR,
    icon: Receipt,
  },
  {
    id: "cashier-shifts",
    name: "Cashier Shift Reports",
    description: "Shift performance, expected vs actual cash, and sync status.",
    route: ROUTES.CASHIER_SHIFT_REPORTS,
    icon: Receipt,
  },
  {
    id: "team",
    name: "Team Management",
    description: "Roles, permissions, and member status across the business.",
    route: ROUTES.TEAM_MANAGEMENT,
    icon: Users,
  },
];

// ─── Components ──────────────────────────────────────────────────────────────

function ModeCard({ mode }: { mode: BusinessModeConfig }) {
  const Icon = modeIconMap[mode.id] ?? Wrench;
  const tone = modeToneMap[mode.status] ?? "slate";
  const badge = modeBadgeMap[mode.status] ?? mode.status;

  return (
    <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{mode.label}</h3>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{mode.description}</p>
          </div>
        </div>
        <StatusPill tone={tone}>{badge}</StatusPill>
      </div>

      {mode.primaryModules.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Modules
          </p>
          <div className="flex flex-wrap gap-1.5">
            {mode.primaryModules.map((mod) => (
              <span
                key={mod}
                className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
              >
                {mod}
              </span>
            ))}
            {mode.plannedModules.length > 0 &&
              mode.plannedModules.map((mod) => (
                <span
                  key={mod}
                  className="rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground/60"
                >
                  {mod}
                </span>
              ))}
          </div>
        </div>
      )}
    </article>
  );
}

function SharedModuleCard({ entry }: { entry: SharedModuleEntry }) {
  const Icon = entry.icon;
  return (
    <Link
      href={entry.route}
      className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm transition hover:border-primary/40 hover:bg-muted/40"
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted transition group-hover:bg-primary/10">
        <Icon className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-foreground group-hover:text-primary">{entry.name}</h3>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition group-hover:text-primary" aria-hidden="true" />
        </div>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">{entry.description}</p>
      </div>
    </Link>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function BusinessOverviewDashboard() {
  const availableModes = businessModeRegistry.filter((m) => m.status === "available");
  const plannedModes = businessModeRegistry.filter((m) => m.status === "planned");

  return (
    <DashboardShell
      title="Shared Business Dashboard"
      description="Cross-mode overview of active business workspaces and shared modules available across all modes."
    >
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card px-5 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Active Modes</p>
          <p className="mt-1.5 text-3xl font-bold text-foreground">{availableModes.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">of {businessModeRegistry.length} total business modes</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-5 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Shared Modules</p>
          <p className="mt-1.5 text-3xl font-bold text-foreground">{SHARED_MODULE_DIRECTORY.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">reusable dashboards across all modes</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-5 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Planned Modes</p>
          <p className="mt-1.5 text-3xl font-bold text-foreground">{plannedModes.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">modes in development roadmap</p>
        </div>
      </div>

      <DashboardPanel
        title="Business Modes"
        description="Each mode is a fully isolated workspace. Shared modules below are available regardless of active mode."
      >
        <div className="grid gap-4 p-4 lg:grid-cols-2">
          {businessModeRegistry.map((mode) => (
            <ModeCard key={mode.id} mode={mode} />
          ))}
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="Shared Modules"
        description="These dashboards work across business modes. Select a module to open it."
      >
        <div className="grid gap-3 p-4 md:grid-cols-2">
          {SHARED_MODULE_DIRECTORY.map((entry) => (
            <SharedModuleCard key={entry.id} entry={entry} />
          ))}
        </div>
      </DashboardPanel>
    </DashboardShell>
  );
}
