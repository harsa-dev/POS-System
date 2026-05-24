"use client";

import { useEffect, useMemo, useState } from "react";

import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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

  const [lastSummary, setLastSummary] = useState<CloseShiftSummary | null>(null);
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

    setOpeningCash("0");
    refreshAll();
  }

  function closeShift(shiftId: string) {
    if (!closingCash) {
      toast.error("Closing cash is required");
      return;
    }

    setConfirmState({
      title: "Close this shift?",
      description: "Cash totals will be finalized and the shift will be locked.",
      variant: "destructive",
      onConfirm: async () => {
        setIsLoading(true);
        const res = await fetch(`/api/shifts/${shiftId}/close`, {
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
        setLastSummary(data.data.summary ?? null);
        setClosingCash("");
        refreshAll();
      },
    });
  }

  const activeCashSales = useMemo(() => {
    if (!currentShift?.orders) return 0;
    return currentShift.orders
      .filter(
        (order) =>
          order.paymentMethod === "CASH" &&
          order.status !== "CANCELLED" &&
          order.status !== "PENDING_PAYMENT",
      )
      .reduce((acc, order) => acc + order.total, 0);
  }, [currentShift]);

  const activeExpectedCash = currentShift
    ? currentShift.openingCash + activeCashSales
    : 0;

  useEffect(() => {
    refreshAll();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shifts</h1>
        <p className="mt-2 text-neutral-500">
          Open and close your cashier shift, and review shift history.
        </p>
      </div>

      {lastSummary && (
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Last Closing Summary</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm text-neutral-500">Opening Cash</p>
              <p className="mt-1 font-bold">{formatCurrency(lastSummary.openingCash)}</p>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm text-neutral-500">Cash Sales</p>
              <p className="mt-1 font-bold">{formatCurrency(lastSummary.cashSales)}</p>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm text-neutral-500">Expected</p>
              <p className="mt-1 font-bold">{formatCurrency(lastSummary.expectedCash)}</p>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm text-neutral-500">Closing Cash</p>
              <p className="mt-1 font-bold">{formatCurrency(lastSummary.closingCash)}</p>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm text-neutral-500">Difference</p>
              <p className={`mt-1 font-bold ${lastSummary.cashDifference < 0 ? "text-red-600" : "text-green-700"}`}>
                {formatCurrency(lastSummary.cashDifference)}
              </p>
            </div>
          </div>
        </div>
      )}

      {!currentShift && (
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Open Shift</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Start your cashier operational session.
          </p>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium">Opening Cash</label>
            <input
              type="number"
              min={0}
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              className="w-full rounded-2xl border px-4 py-3"
            />
          </div>

          <button
            type="button"
            onClick={openShift}
            disabled={isLoading}
            className="mt-4 w-full rounded-2xl bg-black py-3 font-semibold text-white disabled:opacity-50"
          >
            {isLoading ? "Opening..." : "Open Shift"}
          </button>
        </div>
      )}

      {currentShift && (
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Active Shift</h2>
              <p className="mt-1 text-sm text-neutral-500">Shift currently running.</p>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              OPEN
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm text-neutral-500">Cashier</p>
              <p className="mt-1 font-semibold">{currentShift.user?.name}</p>
              <p className="text-sm text-neutral-500">{currentShift.user?.email}</p>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm text-neutral-500">Opening Cash</p>
              <p className="mt-1 text-xl font-bold">{formatCurrency(currentShift.openingCash)}</p>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm text-neutral-500">Cash Sales</p>
              <p className="mt-1 text-xl font-bold">{formatCurrency(activeCashSales)}</p>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm text-neutral-500">Expected Cash</p>
              <p className="mt-1 text-xl font-bold">{formatCurrency(activeExpectedCash)}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-neutral-50 p-4">
            <p className="text-sm text-neutral-500">Opened At</p>
            <p className="mt-1 font-medium">{formatDateTime(currentShift.openedAt)}</p>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium">Closing Cash</label>
            <input
              type="number"
              min={0}
              value={closingCash}
              onChange={(e) => setClosingCash(e.target.value)}
              className="w-full rounded-2xl border px-4 py-3"
            />
          </div>

          <button
            type="button"
            onClick={() => closeShift(currentShift.id)}
            disabled={isLoading}
            className="mt-4 w-full rounded-2xl bg-red-600 py-3 font-semibold text-white disabled:opacity-50"
          >
            {isLoading ? "Closing..." : "Close Shift"}
          </button>
        </div>
      )}

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
                <th className="p-4 font-semibold">Cashier</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Opening</th>
                <th className="p-4 font-semibold">Expected</th>
                <th className="p-4 font-semibold">Closing</th>
                <th className="p-4 font-semibold">Difference</th>
                <th className="p-4 font-semibold">Opened</th>
                <th className="p-4 font-semibold">Closed</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr key={shift.id} className="border-b border-neutral-100 hover:bg-neutral-50/60">
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{shift.user.name}</p>
                      <p className="text-xs text-neutral-500">{shift.user.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${shift.status === "OPEN" ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-700"}`}>
                      {shift.status}
                    </span>
                  </td>
                  <td className="p-4">{formatCurrency(shift.openingCash)}</td>
                  <td className="p-4">{formatCurrency(shift.expectedCash)}</td>
                  <td className="p-4">
                    {shift.closingCash !== null && shift.closingCash !== undefined
                      ? formatCurrency(shift.closingCash)
                      : "-"}
                  </td>
                  <td className="p-4">
                    {shift.cashDifference !== null && shift.cashDifference !== undefined ? (
                      <span className={shift.cashDifference < 0 ? "font-semibold text-red-600" : "font-semibold text-green-700"}>
                        {formatCurrency(shift.cashDifference)}
                      </span>
                    ) : "-"}
                  </td>
                  <td className="p-4 text-neutral-500">{formatDateTime(shift.openedAt)}</td>
                  <td className="p-4 text-neutral-500">
                    {shift.closedAt ? formatDateTime(shift.closedAt) : "-"}
                  </td>
                </tr>
              ))}

              {shifts.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-neutral-500">
                    No shifts yet.
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
