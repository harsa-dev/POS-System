"use client";

import { useState } from "react";
import { orderApi } from "@/lib/api";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { CheckCircle, Loader2 } from "lucide-react";

type CloseOrderButtonProps = {
  orderId: string;
};

export function CloseOrderButton({ orderId }: CloseOrderButtonProps) {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  async function closeOrder() {
    setIsLoading(true);
    const data = await orderApi.updateStatus(orderId, { status: "COMPLETED" });
    setIsLoading(false);
    if (!data.success) {
      toast.error(data.message || "Failed to close order");
      return;
    }
    toast.success("Order completed successfully");
    navigate(window.location.pathname);
  }

  return (
    <button
      onClick={closeOrder}
      disabled={isLoading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700 print:hidden disabled:opacity-60"
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4" />Close Order</>}
    </button>
  );
}
