import {
  CheckCircle2,
  ChefHat,
  Clock3,
  Lock,
  Package,
  Scissors,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

import {
  businessModeRegistry,
  getCurrentBusinessMode,
  repairBusinessModeStorage,
  setCurrentBusinessMode,
  subscribeToBusinessModeChanges,
  type BusinessModeConfig,
  type BusinessModeId,
} from "@/components/core/business-mode";

const modeIcons: Record<BusinessModeId, typeof ChefHat> = {
  restaurant: ChefHat,
  retail: ShoppingBag,
  "raw-material": Package,
  "custom-business": Scissors,
};

const statusTone: Record<BusinessModeConfig["status"], string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  planned: "border-amber-200 bg-amber-50 text-amber-700",
  disabled: "border-neutral-200 bg-neutral-100 text-neutral-500",
};

function getModeActionLabel(mode: BusinessModeConfig) {
  if (mode.isSelectable) return "Enter workspace";
  if (mode.status === "planned") return "Coming soon";
  return "Unavailable";
}

function getModeStatusIcon(mode: BusinessModeConfig) {
  if (mode.isSelectable) return CheckCircle2;
  if (mode.status === "planned") return Clock3;
  return Lock;
}

export function ModeSelector() {
  const [, setLocation] = useLocation();
  const [currentMode, setCurrentMode] = useState<BusinessModeId>(() =>
    getCurrentBusinessMode(),
  );

  useEffect(() => {
    setCurrentMode(repairBusinessModeStorage("select-mode"));

    return subscribeToBusinessModeChanges((detail) => {
      setCurrentMode(detail.mode);
    });
  }, []);

  function handleSelectMode(mode: BusinessModeConfig) {
    if (!mode.isSelectable) return;

    const changed = setCurrentBusinessMode(mode.id, "select-mode");

    if (!changed) {
      setCurrentMode(getCurrentBusinessMode());
    }

    setLocation(mode.route);
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
            POS System V3
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
            Select business mode
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600 sm:text-base">
            Choose the workspace context for this session. Restaurant / F&amp;B is
            the main operational workspace, while Raw Material / Livestock is
            enabled as a controlled preview so route, sidebar, API header, and
            tenant-scope bugs can be found before real production workflows are
            added.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {businessModeRegistry.map((mode) => {
            const Icon = modeIcons[mode.id];
            const StatusIcon = getModeStatusIcon(mode);
            const isActive = currentMode === mode.id;
            const actionLabel = getModeActionLabel(mode);

            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleSelectMode(mode)}
                disabled={!mode.isSelectable}
                title={!mode.isSelectable ? mode.unavailableReason : undefined}
                className="group flex min-h-64 flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-sm transition enabled:hover:border-blue-300 enabled:hover:bg-blue-50/40 enabled:hover:shadow-md disabled:cursor-not-allowed disabled:opacity-80"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800 group-enabled:group-hover:bg-blue-100 group-enabled:group-hover:text-blue-700">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>

                  <span className="flex flex-wrap items-center justify-end gap-2">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Active
                      </span>
                    ) : null}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone[mode.status]}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      {mode.badgeLabel}
                    </span>
                  </span>
                </span>

                <span className="mt-5 block">
                  <span className="block text-lg font-bold text-neutral-950">
                    {mode.label}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-neutral-600">
                    {mode.description}
                  </span>
                </span>

                <span className="mt-5 grid gap-3">
                  {mode.primaryModules.length > 0 ? (
                    <span className="block">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                        Core modules
                      </span>
                      <span className="mt-2 flex flex-wrap gap-2">
                        {mode.primaryModules.slice(0, 6).map((module) => (
                          <span
                            key={module}
                            className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600"
                          >
                            {module}
                          </span>
                        ))}
                      </span>
                    </span>
                  ) : null}

                  {mode.plannedModules.length > 0 ? (
                    <span className="block">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                        Planned workflow
                      </span>
                      <span className="mt-2 flex flex-wrap gap-2">
                        {mode.plannedModules.slice(0, 6).map((module) => (
                          <span
                            key={module}
                            className="rounded-full border border-dashed border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
                          >
                            {module}
                          </span>
                        ))}
                      </span>
                    </span>
                  ) : null}
                </span>

                <span className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4 text-sm font-semibold">
                  <span
                    className={
                      mode.isSelectable
                        ? "text-blue-700 group-enabled:group-hover:text-blue-800"
                        : "text-neutral-400"
                    }
                  >
                    {actionLabel}
                  </span>
                  {!mode.isSelectable ? (
                    <Lock className="h-4 w-4 text-neutral-300" aria-hidden="true" />
                  ) : (
                    <CheckCircle2
                      className="h-4 w-4 text-blue-600"
                      aria-hidden="true"
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-6 max-w-3xl text-xs leading-5 text-neutral-500">
          Business mode selection is a frontend workspace preference for this
          stage. Backend permission, tenant scope, and data ownership remain the
          real source of truth for protected operations.
        </p>
      </div>
    </main>
  );
}
