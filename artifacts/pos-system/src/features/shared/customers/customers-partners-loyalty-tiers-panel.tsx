"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Save, Sparkles } from "lucide-react";

import { DashboardActionButton, DashboardPanel } from "@/features/shared/dashboard";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import {
  customersPartnersApi,
  type LoyaltyTierDto,
  type UpdateLoyaltyTierPayload,
} from "@/lib/api/customers-partners-api";

type CustomersPartnersLoyaltyTiersPanelProps = {
  reloadSignal?: number;
  onUpdated?: () => void;
};

type TierFormState = {
  icon: string;
  calculationPeriod: string;
  minimumSpending: string;
  automaticDiscount: string;
  sortOrder: string;
};

function getApiErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function toFormState(tier: LoyaltyTierDto): TierFormState {
  return {
    icon: tier.icon,
    calculationPeriod: tier.calculationPeriod,
    minimumSpending: String(tier.minimumSpending),
    automaticDiscount: tier.automaticDiscount,
    sortOrder: String(tier.sortOrder),
  };
}

function parseTierForm(form: TierFormState): UpdateLoyaltyTierPayload {
  const minimumSpending = Number.parseInt(form.minimumSpending, 10);
  const sortOrder = Number.parseInt(form.sortOrder, 10);

  if (!form.icon.trim()) throw new Error("Icon is required.");
  if (!Number.isInteger(minimumSpending) || minimumSpending < 0) {
    throw new Error("Minimum spending must be a non-negative integer.");
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error("Sort order must be a non-negative integer.");
  }

  return {
    icon: form.icon.trim().slice(0, 4).toUpperCase(),
    calculationPeriod: form.calculationPeriod.trim() || "Last 12 months",
    minimumSpending,
    automaticDiscount: form.automaticDiscount.trim() || "0%",
    sortOrder,
  };
}

export function CustomersPartnersLoyaltyTiersPanel({
  reloadSignal = 0,
  onUpdated,
}: CustomersPartnersLoyaltyTiersPanelProps) {
  const [tiers, setTiers] = useState<LoyaltyTierDto[]>([]);
  const [canUpdate, setCanUpdate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<TierFormState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedTier = useMemo(
    () => tiers.find((tier) => tier.id === selectedId) ?? tiers[0] ?? null,
    [selectedId, tiers],
  );

  async function loadTiers() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await customersPartnersApi.getLoyaltyTiers();
      setTiers(response.data.tiers);
      setCanUpdate(response.data.canUpdate);
      setSelectedId((current) => {
        if (current && response.data.tiers.some((tier) => tier.id === current)) return current;
        return response.data.tiers[0]?.id ?? null;
      });
    } catch (loadError) {
      setTiers([]);
      setCanUpdate(false);
      setSelectedId(null);
      setError(getApiErrorMessage(loadError, "Failed to load loyalty tiers."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTiers();
  }, [reloadSignal]);

  useEffect(() => {
    setForm(selectedTier ? toFormState(selectedTier) : null);
  }, [selectedTier?.id]);

  async function handleSave() {
    if (!selectedTier || !form) return;
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = parseTierForm(form);
      const response = await customersPartnersApi.updateLoyaltyTier(selectedTier.id, payload);
      setTiers((current) =>
        current
          .map((tier) => (tier.id === response.data.id ? response.data : tier))
          .sort((a, b) => a.sortOrder - b.sortOrder || a.minimumSpending - b.minimumSpending),
      );
      setSelectedId(response.data.id);
      setMessage(`${response.data.tierName} tier updated.`);
      onUpdated?.();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Failed to update loyalty tier."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <DashboardPanel
      title="Loyalty Tiers"
      description="Manage customer tier thresholds and automatic discount settings from backend data. Finally, loyalty is not just decorative text."
    >
      <div className="space-y-4 p-4">
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
            {message}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {isLoading ? "Loading tiers..." : `${formatNumber(tiers.length)} tier settings loaded`}
          </div>
          <DashboardActionButton icon={RefreshCw} disabled={isLoading || isSaving} onClick={() => void loadTiers()}>
            Refresh
          </DashboardActionButton>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {tiers.map((tier) => {
              const selected = tier.id === selectedTier?.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  className={`rounded-xl border p-4 text-left transition ${
                    selected
                      ? "border-neutral-900 bg-neutral-950 text-white"
                      : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300 hover:bg-neutral-50"
                  }`}
                  onClick={() => setSelectedId(tier.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${selected ? "bg-white text-neutral-950" : "bg-neutral-100 text-neutral-700"}`}>
                      {tier.icon}
                    </span>
                    <span className={`text-xs font-semibold uppercase ${selected ? "text-neutral-200" : "text-neutral-500"}`}>
                      {tier.automaticDiscount}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold">{tier.tierName}</p>
                  <p className={`mt-1 text-xs ${selected ? "text-neutral-200" : "text-neutral-500"}`}>
                    Min {formatCurrency(tier.minimumSpending)} · {tier.calculationPeriod}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-neutral-950">
              {selectedTier ? `Edit ${selectedTier.tierName}` : "Select a tier"}
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Management roles can adjust thresholds and discount copy. Viewers can stare at it, which is technically still participation.
            </p>

            {form ? (
              <div className="mt-4 space-y-3">
                <label className="space-y-1 text-sm font-medium text-neutral-700">
                  Icon
                  <input
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                    value={form.icon}
                    disabled={!canUpdate || isSaving}
                    onChange={(event) => setForm((current) => current ? { ...current, icon: event.target.value } : current)}
                  />
                </label>
                <label className="space-y-1 text-sm font-medium text-neutral-700">
                  Minimum Spending
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                    value={form.minimumSpending}
                    disabled={!canUpdate || isSaving}
                    onChange={(event) => setForm((current) => current ? { ...current, minimumSpending: event.target.value } : current)}
                  />
                </label>
                <label className="space-y-1 text-sm font-medium text-neutral-700">
                  Automatic Discount
                  <input
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                    value={form.automaticDiscount}
                    disabled={!canUpdate || isSaving}
                    onChange={(event) => setForm((current) => current ? { ...current, automaticDiscount: event.target.value } : current)}
                  />
                </label>
                <label className="space-y-1 text-sm font-medium text-neutral-700">
                  Calculation Period
                  <input
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                    value={form.calculationPeriod}
                    disabled={!canUpdate || isSaving}
                    onChange={(event) => setForm((current) => current ? { ...current, calculationPeriod: event.target.value } : current)}
                  />
                </label>
                <label className="space-y-1 text-sm font-medium text-neutral-700">
                  Sort Order
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                    value={form.sortOrder}
                    disabled={!canUpdate || isSaving}
                    onChange={(event) => setForm((current) => current ? { ...current, sortOrder: event.target.value } : current)}
                  />
                </label>

                <DashboardActionButton
                  icon={Save}
                  variant="primary"
                  disabled={!canUpdate || isSaving}
                  title={canUpdate ? "Save loyalty tier" : "Management role required"}
                  onClick={() => void handleSave()}
                >
                  {isSaving ? "Saving..." : "Save Tier"}
                </DashboardActionButton>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-500">
                No tier settings loaded.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}
