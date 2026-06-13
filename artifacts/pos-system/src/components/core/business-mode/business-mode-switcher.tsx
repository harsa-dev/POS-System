"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Lock,
  Store,
  UtensilsCrossed,
  Warehouse,
  Wrench,
} from "lucide-react";

import {
  businessModeRegistry,
  getBusinessModeConfig,
} from "./business-mode-registry";
import {
  getCurrentBusinessMode,
  setCurrentBusinessMode,
  subscribeToBusinessModeChanges,
} from "./business-mode-storage";
import type { BusinessModeConfig, BusinessModeId } from "./business-mode.types";

const modeIcons: Record<BusinessModeId, typeof UtensilsCrossed> = {
  restaurant: UtensilsCrossed,
  retail: Store,
  "raw-material": Warehouse,
  "custom-business": Wrench,
};

function getModeButtonLabel(mode: BusinessModeConfig) {
  if (mode.isSelectable) return `Switch to ${mode.shortLabel}`;
  return `${mode.shortLabel} mode is ${mode.status}`;
}

export function BusinessModeSwitcher() {
  const [, setLocation] = useLocation();
  const [activeModeId, setActiveModeId] = useState<BusinessModeId>(() =>
    getCurrentBusinessMode(),
  );

  useEffect(() => {
    setActiveModeId(getCurrentBusinessMode());

    return subscribeToBusinessModeChanges((detail) => {
      setActiveModeId(detail.mode);
    });
  }, []);

  const activeMode = useMemo(
    () => getBusinessModeConfig(activeModeId),
    [activeModeId],
  );

  const ActiveIcon = modeIcons[activeMode.id] ?? Building2;

  function handleSelectMode(mode: BusinessModeConfig) {
    if (!mode.isSelectable) return;

    const isChanged = setCurrentBusinessMode(mode.id, "switcher");

    if (!isChanged) {
      setActiveModeId(getCurrentBusinessMode());
      return;
    }

    setLocation(mode.route);
  }

  return (
    <div className="relative hidden min-w-0 shrink-0 sm:block">
      <details className="group">
        <summary className="flex h-11 cursor-pointer list-none items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 text-left text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 [&::-webkit-details-marker]:hidden">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <ActiveIcon className="h-4 w-4" aria-hidden="true" />
          </span>

          <span className="hidden min-w-0 xl:block">
            <span className="block truncate text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              Business mode
            </span>
            <span className="block truncate text-sm text-neutral-900">
              {activeMode.shortLabel}
            </span>
          </span>

          <ChevronDown
            className="h-4 w-4 shrink-0 text-neutral-400 transition group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>

        <div className="absolute right-0 z-[80] mt-3 w-[22rem] overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl shadow-neutral-900/10">
          <div className="border-b border-neutral-100 px-4 py-3">
            <p className="text-sm font-bold text-neutral-950">Business mode</p>
            <p className="mt-1 text-xs leading-5 text-neutral-500">
              Restaurant / F&amp;B is the only active workspace for now. Other
              modes are planned and intentionally locked.
            </p>
          </div>

          <div className="max-h-[28rem] overflow-y-auto p-2">
            {businessModeRegistry.map((mode) => {
              const Icon = modeIcons[mode.id] ?? Building2;
              const isActive = mode.id === activeMode.id;
              const isLocked = !mode.isSelectable;

              return (
                <button
                  key={mode.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleSelectMode(mode)}
                  className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition enabled:hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
                  aria-label={getModeButtonLabel(mode)}
                  title={mode.unavailableReason ?? getModeButtonLabel(mode)}
                >
                  <span
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-neutral-950">
                        {mode.label}
                      </span>

                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
                          mode.status === "available"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {mode.badgeLabel}
                      </span>
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-neutral-500">
                      {mode.description}
                    </span>

                    {mode.plannedModules.length > 0 ? (
                      <span className="mt-2 block text-[11px] font-semibold text-neutral-500">
                        Planned: {mode.plannedModules.slice(0, 3).join(", ")}
                        {mode.plannedModules.length > 3 ? "…" : ""}
                      </span>
                    ) : null}
                  </span>

                  <span className="mt-1 shrink-0 text-neutral-400">
                    {isActive ? (
                      <CheckCircle2
                        className="h-5 w-5 text-blue-600"
                        aria-label="Active mode"
                      />
                    ) : isLocked ? (
                      <Lock className="h-4 w-4" aria-label="Planned mode" />
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </details>
    </div>
  );
}
