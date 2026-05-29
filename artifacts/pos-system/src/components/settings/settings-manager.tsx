"use client";

import { useEffect, useState } from "react"
import { settingsApi } from "@/lib/api";
import { toast } from "sonner";

type RestaurantSettings = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  taxRate: number;
  serviceRate: number;
  logoUrl: string | null;

  currency: string;
  timezone: string;
  receiptFooter: string | null;
  autoPrint: boolean;
  orderPrefix: string;
  cashEnabled: boolean;
  qrisEnabled: boolean;
  cardEnabled: boolean;
  transferEnabled: boolean;
  midtransEnabled: boolean;
};

const currencies = [
  { value: "IDR", label: "IDR - Indonesian Rupiah" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
  { value: "MYR", label: "MYR - Malaysian Ringgit" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "AUD", label: "AUD - Australian Dollar" },
];

const timezones = [
  { value: "Asia/Jakarta", label: "Asia/Jakarta - WIB" },
  { value: "Asia/Makassar", label: "Asia/Makassar - WITA" },
  { value: "Asia/Jayapura", label: "Asia/Jayapura - WIT" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "Asia/Kuala_Lumpur", label: "Asia/Kuala Lumpur" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
  { value: "UTC", label: "UTC" },
];

export function SettingsManager() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function fetchSettings() {
    const data = await settingsApi.get();

    if (data.success) {
      setSettings(data.data as RestaurantSettings);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!settings) return;

    setIsLoading(true);

    const data = await settingsApi.update(settings as unknown as Record<string, unknown>);

    setIsLoading(false);

    if (!data.success) {
      toast.error(data.message || "Failed to update settings");
      return;
    }

    toast.success("Settings updated");
    setSettings(data.data as RestaurantSettings);
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  if (!settings) {
    return <p>Loading settings...</p>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid max-w-2xl gap-6 rounded-lg border bg-white p-4"
    >
      <div className="space-y-1">
        <h2 className="font-semibold">Restaurant Settings</h2>
        <p className="text-sm text-neutral-500">
          Basic restaurant profile shown on receipts and dashboard.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Restaurant Name
        </label>
        <input
          value={settings.name}
          onChange={(e) =>
            setSettings({
              ...settings,
              name: e.target.value,
            })
          }
          className="w-full rounded-md border px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Address</label>
        <input
          value={settings.address ?? ""}
          onChange={(e) =>
            setSettings({
              ...settings,
              address: e.target.value,
            })
          }
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Phone</label>
        <input
          value={settings.phone ?? ""}
          onChange={(e) =>
            setSettings({
              ...settings,
              phone: e.target.value,
            })
          }
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Logo URL</label>
        <input
          value={settings.logoUrl ?? ""}
          onChange={(e) =>
            setSettings({
              ...settings,
              logoUrl: e.target.value,
            })
          }
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div className="border-t pt-4">
        <div className="mb-4 space-y-1">
          <h2 className="font-semibold">Checkout Settings</h2>
          <p className="text-sm text-neutral-500">
            Tax and service calculation used when creating orders.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Tax Rate (%)
            </label>
            <input
              type="number"
              min="0"
              value={settings.taxRate}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  taxRate: Number(e.target.value),
                })
              }
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Service Rate (%)
            </label>
            <input
              type="number"
              min="0"
              value={settings.serviceRate}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  serviceRate: Number(e.target.value),
                })
              }
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="mb-4 space-y-1">
          <h2 className="font-semibold">Operational Settings</h2>
          <p className="text-sm text-neutral-500">
            Reusable configuration for receipt, order display, and localization.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Currency</label>
            <select
              value={settings.currency}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  currency: e.target.value,
                })
              }
              className="w-full rounded-md border px-3 py-2"
            >
              {currencies.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  timezone: e.target.value,
                })
              }
              className="w-full rounded-md border px-3 py-2"
            >
              {timezones.map((timezone) => (
                <option key={timezone.value} value={timezone.value}>
                  {timezone.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium">Order Prefix</label>
          <input
            value={settings.orderPrefix}
            onChange={(e) =>
              setSettings({
                ...settings,
                orderPrefix: e.target.value,
              })
            }
            className="w-full rounded-md border px-3 py-2"
            placeholder="ORD"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Example: ORD-000001, POS-000001, or OKL-000001.
          </p>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium">
            Receipt Footer
          </label>
          <textarea
            value={settings.receiptFooter ?? ""}
            onChange={(e) =>
              setSettings({
                ...settings,
                receiptFooter: e.target.value,
              })
            }
            className="min-h-24 w-full rounded-md border px-3 py-2"
            placeholder="Thank you for your order."
          />
        </div>

        <label className="mt-4 flex items-center gap-3 rounded-md border p-3">
          <input
            type="checkbox"
            checked={settings.autoPrint}
            onChange={(e) =>
              setSettings({
                ...settings,
                autoPrint: e.target.checked,
              })
            }
          />

          <div>
            <p className="text-sm font-medium">Auto print receipt</p>
            <p className="text-xs text-neutral-500">
              Automatically open print dialog after checkout later.
            </p>
          </div>
        </label>
      </div>

      <div className="border-t pt-4">
        <div className="mb-4 space-y-1">
          <h2 className="font-semibold">Payment Settings</h2>

          <p className="text-sm text-neutral-500">
            Control available payment methods for checkout.
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Cash Payment</p>

              <p className="text-xs text-neutral-500">
                Enable cash transactions.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.cashEnabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  cashEnabled: e.target.checked,
                })
              }
            />
          </label>

          <label className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">QRIS</p>

              <p className="text-xs text-neutral-500">Enable QRIS payment.</p>
            </div>

            <input
              type="checkbox"
              checked={settings.qrisEnabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  qrisEnabled: e.target.checked,
                })
              }
            />
          </label>

          <label className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Card Payment</p>

              <p className="text-xs text-neutral-500">
                Enable debit/credit card.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.cardEnabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  cardEnabled: e.target.checked,
                })
              }
            />
          </label>

          <label className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Bank Transfer</p>

              <p className="text-xs text-neutral-500">Enable bank transfer.</p>
            </div>

            <input
              type="checkbox"
              checked={settings.transferEnabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  transferEnabled: e.target.checked,
                })
              }
            />
          </label>

          <label className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Midtrans Gateway</p>

              <p className="text-xs text-neutral-500">
                Enable online payment gateway.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.midtransEnabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  midtransEnabled: e.target.checked,
                })
              }
            />
          </label>
        </div>
      </div>

      <button
        disabled={isLoading}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
