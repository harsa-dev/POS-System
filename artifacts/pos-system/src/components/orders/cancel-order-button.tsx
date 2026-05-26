"use client";

import { useState } from "react";
import { useLocation } from "wouter";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type CancelOrderButtonProps = {
  orderId: string;
};

export function CancelOrderButton({ orderId }: CancelOrderButtonProps) {
  const [, navigate] = useLocation();

  const [isLoading, setIsLoading] = useState(false);

  const [cancelReason, setCancelReason] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  function openDialog() {
    setCancelReason("");
    setShowDialog(true);
  }

  async function handleCancel() {
    if (!cancelReason.trim()) {
      toast.warning("Please enter a cancellation reason");
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiFetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED", cancelReason: cancelReason.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Failed to cancel order");
        return;
      }
      toast.success("Order cancelled");
      setShowDialog(false);
      navigate("/dashboard/orders");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel Order"}
      </button>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold">Cancel Order</h2>
            <p className="mt-1 text-sm text-neutral-500">Please provide a reason for cancellation.</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              rows={3}
              className="mt-4 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-200"
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="flex-1 rounded-xl border py-2.5 text-sm font-semibold transition hover:bg-neutral-50"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading || !cancelReason.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
