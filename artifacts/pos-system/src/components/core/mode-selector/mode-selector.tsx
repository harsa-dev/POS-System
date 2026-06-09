import {
  CheckCircle2,
  ChefHat,
  Package,
  Scissors,
  ShoppingBag,
} from "lucide-react";
import { useLocation } from "wouter";

import { ROUTES } from "@/constants/routes";
import {
  businessModeOptions,
  setStoredBusinessMode,
  type BusinessMode,
} from "@/components/core/route-guard";

const modeIcons: Record<BusinessMode, typeof ChefHat> = {
  fnb: ChefHat,
  retail: ShoppingBag,
  service: Scissors,
  warehouse: Package,
};

export function ModeSelector() {
  const [, setLocation] = useLocation();

  function handleSelectMode(mode: BusinessMode) {
    setStoredBusinessMode(mode);
    setLocation(ROUTES.ANALYTICS);
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col justify-center">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
            POS System V3
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
            Select business mode
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600 sm:text-base">
            Shared dashboards are available in every mode. Restaurant / F&B also
            enables the current operational core modules.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {businessModeOptions.map((mode) => {
            const Icon = modeIcons[mode.id];

            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleSelectMode(mode.id)}
                className="group flex min-h-44 flex-col justify-between rounded-lg border border-neutral-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-md"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800 group-hover:bg-blue-100 group-hover:text-blue-700">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <CheckCircle2
                    className="h-5 w-5 text-neutral-300 group-hover:text-blue-600"
                    aria-hidden="true"
                  />
                </span>

                <span>
                  <span className="block text-lg font-bold text-neutral-950">
                    {mode.label}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-neutral-600">
                    {mode.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
