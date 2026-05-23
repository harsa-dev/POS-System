"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CloseOrderButtonProps = {
  orderId: string;
};

export function CloseOrderButton({ orderId }: CloseOrderButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function closeOrder() {
    setIsLoading(true);

    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "COMPLETED",
      }),
    });

    const data = await res.json();

    setIsLoading(false);

    if (!data.success) {
      alert(data.message || "Failed to close order");
      return;
    }

    router.refresh();
  }

  return (
    <button
      onClick={closeOrder}
      disabled={isLoading}
      className="w-full rounded-md bg-green-600 py-3 text-white print:hidden disabled:opacity-60"
    >
      {isLoading ? "Closing..." : "Close Order"}
    </button>
  );
}