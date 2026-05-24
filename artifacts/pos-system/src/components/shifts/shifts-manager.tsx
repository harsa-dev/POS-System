"use client";

import { useEffect, useMemo, useState } from "react";

import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Clock } from "lucide-react";

type Order = {
  id: string;
  total: number;
  paymentMethod: string;
  status: string;
};

type Shift = {
  id: string;
  status: "OPEN" | "CLOSED";
  openingCash: number;
  closingCash?: number | null;
  expectedCash: number;
  cashDifference?: number | null;
  openedAt: string;
  closedAt?: string | null;
  orders?: Order[];
  user: {
    name: string;
    email: string;
  };
};

type CloseShiftSummary = {
  openingCash: number;
  cashSales: number;
  expectedCash: number;
  closingCash: number;
  cashDifference: number;
  orderCount: number;
};

export function ShiftsManager() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);

  const [openingCash, setOpeningCash] = useState("0");
  const [closingCash, setClosingCash] = useState("");

  const [lastSummary, setLastSummary] = useState<CloseShiftSummary | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
  } | null>(null);

  async function fetchCurrentShift() {
    const res = await fetch("/api/shifts/current", { credentials: "include" });
    const data = await res.json();
    setCurrentShift(data.success && data.data ? data.data : null);
  }

  async function fetchShifts() {
    const res = await fetch("/api/shifts", { credentials: "include" });
    const data = await res.json();
    if (data.success) setShifts(data.data);
  }

  async function refreshAll() {
    await Promise.all([fetchCurrentShift(), fetchShifts()]);
  }

  async function openShift() {
    setIsLoading(true);
    setLastSummary(null);

    const res = await fetch("/api/shifts/open", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openingCash: Number(openingCash) }),
    });

    const data = await res.json();
    setIsLoading(false);

    if (!data.success) {
      toast.error(data.message || "Failed to open shift");
      return;
    }

    toast.success("Shift opened");
    refreshAll();
  }

  async function closeShift(id: string) {
    if (!closingCash && closingCash !== "0") {
      toast.error("Please enter the closing cash amount");
      return;
    }

    setConfirmState({
      title: "Close this shift?",
      description:
        "This will finalize the cashier session and record the cash difference.",
      variant: "destructive",
      onConfirm: async () => {
        setIsLoading(true);

        const res = await fetch(`/api/shifts/${id}/close`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ closingCash: Number(closingCash) }),
        });

        const data = await res.json();
        setIsLoading(false);

        if (!data.success) {
          toast.error(data.message || "Failed to close shift");
          return;
        }

        if (data.data?.summary) {
          setLastSummary(data.data.summary);
        }

        setClosingCash("");
        toast.success("Shift closed");
        refreshAll();
      },
    });
  }

  const activeCashSales = useMemo(() => {
    if (!currentShift?.orders) return 0;
    return currentShift.orders
      .filter(
        (o) =>
          o.status !== "CANCELLED" &&
          o.paymentMethod?.toUpperCase() === "CASH",
      )
      .reduce((sum, o) => sum + o.total, 0);
  }, [currentShift]);

  const activeExpectedCash = useMemo(() => {
    if (!currentShift) return 0;
    return currentShift.openingCash + activeCashSales;
  }, [currentShift, activeCashSales]);

  useEffect(() => {
    refreshAll();
  }, []);

  return (
    <div className="space-y-6">
      {/* Last summary */}
      {lastSummary && (
        <div className="rounded-3xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-green-800">Shift Closed</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              {
                label: "Opening Cash",
                value: formatCurrency(lastSummary.openingCash),
              },
              {
                label: "Cash Sales",
                value: formatCurrency(lastSummary.cashSales),
              },
              {
                label: "Expected Cash",
                value: formatCurrency(lastSummary.expectedCash),
              },
              {
                label: "Closing Cash",
                value: formatCurrency(lastSummary.closingCash),
              },
              {
                label: "Difference",
                value: formatCurrency(lastSummary.cashDifference),
                highlight:
                  lastSummary.cashDifference < 0
                    ? "text-red-700"
                    : "text-green-700",
              },
              { label: "Total Orders", value: lastSummary.orderCount },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-white p-4">
                <p className="text-sm text-neutral-500">{item.label}</p>
                <p
                  className={`mt-1 text-lg font-bold ${"highlight" in item ? item.highlight : ""}`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open shift panel */}
      {!currentShift && (
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Open Shift</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Enter the opening cash amount to start a new cashier session.
          </p>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Opening Cash
            </label>
            <input
              type="number"
              min={0}
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              className="h-11 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-400"
            />
          </div>

          <button
            type="button"
            onClick={openShift}
            disabled={isLoading}
            className="mt-4 flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? "Opening..." : "Open Shift"}
          </button>
        </div>
      )}

      {/* Active shift panel */}
      {currentShift && (
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Active Shift</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Shift currently running.
              </p>
            </div>
            <StatusBadge className="bg-green-100 text-green-700">
              OPEN
            </StatusBadge>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm text-neutral-500">Cashier</p>
              <p className="mt-1 font-semibold">{currentShift.user?.name}</p>
              <p className="text-sm text-neutral-500">
                {currentShift.user?.email}
              </p>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm text-neutral-500">Opening Cash</p>
              <p className="mt-1 text-xl font-bold">
                {formatCurrency(currentShift.openingCash)}
              </p>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm text-neutral-500">Cash Sales</p>
              <p className="mt-1 text-xl font-bold">
                {formatCurrency(activeCashSales)}
              </p>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm text-neutral-500">Expected Cash</p>
              <p className="mt-1 text-xl font-bold">
                {formatCurrency(activeExpectedCash)}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-neutral-50 p-4">
            <p className="text-sm text-neutral-500">Opened At</p>
            <p className="mt-1 font-medium">
              {formatDateTime(currentShift.openedAt)}
            </p>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Closing Cash
            </label>
            <input
              type="number"
              min={0}
              value={closingCash}
              onChange={(e) => setClosingCash(e.target.value)}
              className="h-11 w-full rounded-2xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-400"
            />
          </div>

          <button
            type="button"
            onClick={() => closeShift(currentShift.id)}
            disabled={isLoading}
            className="mt-4 flex h-11 w-full items-center justify-center rounded-2xl bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? "Closing..." : "Close Shift"}
          </button>
        </div>
      )}

      {/* Shift history table */}
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 p-5">
          <h2 className="text-lg font-bold">Shift History</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Review cashier shift cash accountability.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="p-4 font-medium text-neutral-500">Cashier</th>
                <th className="p-4 font-medium text-neutral-500">Status</th>
                <th className="p-4 font-medium text-neutral-500">Opening</th>
                <th className="p-4 font-medium text-neutral-500">Expected</th>
                <th className="p-4 font-medium text-neutral-500">Closing</th>
                <th className="p-4 font-medium text-neutral-500">Difference</th>
                <th className="p-4 font-medium text-neutral-500">Opened</th>
                <th className="p-4 font-medium text-neutral-500">Closed</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr
                  key={shift.id}
                  className="border-b border-neutral-100 transition hover:bg-neutral-50"
                >
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{shift.user.name}</p>
                      <p className="text-xs text-neutral-500">
                        {shift.user.email}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <StatusBadge
                      className={
                        shift.status === "OPEN"
                          ? "bg-green-100 text-green-700"
                          : "bg-neutral-100 text-neutral-600"
                      }
                    >
                      {shift.status}
                    </StatusBadge>
                  </td>
                  <td className="p-4">{formatCurrency(shift.openingCash)}</td>
                  <td className="p-4">{formatCurrency(shift.expectedCash)}</td>
                  <td className="p-4">
                    {shift.closingCash != null
                      ? formatCurrency(shift.closingCash)
                      : "—"}
                  </td>
                  <td className="p-4">
                    {shift.cashDifference != null ? (
                      <span
                        className={
                          shift.cashDifference < 0
                            ? "font-semibold text-red-600"
                            : "font-semibold text-green-700"
                        }
                      >
                        {formatCurrency(shift.cashDifference)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-4 text-neutral-500">
                    {formatDateTime(shift.openedAt)}
                  </td>
                  <td className="p-4 text-neutral-500">
                    {shift.closedAt ? formatDateTime(shift.closedAt) : "—"}
                  </td>
                </tr>
              ))}

              {shifts.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={Clock}
                      title="No shifts yet"
                      description="Open your first shift to start tracking cashier sessions."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title ?? ""}
        description={confirmState?.description}
        variant={confirmState?.variant}
        onConfirm={() => {
          const action = confirmState?.onConfirm;
          setConfirmState(null);
          action?.();
        }}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}
