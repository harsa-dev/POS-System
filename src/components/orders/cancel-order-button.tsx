"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CancelOrderButtonProps = {
  orderId: string;
};

export function CancelOrderButton({ orderId }: CancelOrderButtonProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  async function handleCancel() {
    const reason = prompt("Reason for cancellation:");
    const cleanReason = reason?.trim();

    if (!cleanReason) {
      return;
    }

    const confirmed = confirm("Are you sure you want to cancel this order?");

    if (!confirmed) {
      return;
    }

    try {
      setIsLoading(true);

      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "CANCELLED",
          cancelReason: cleanReason,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Failed to cancel order");
        return;
      }

      router.refresh();
      router.push("/dashboard/orders");
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={isLoading}
      style={{
        display: "block",
        width: "100%",
        backgroundColor: "#dc2626",
        color: "#ffffff",
        border: "none",
        borderRadius: "0.75rem",
        padding: "0.75rem 1rem",
        fontSize: "0.875rem",
        fontWeight: 700,
        textAlign: "center",
        cursor: isLoading ? "not-allowed" : "pointer",
        opacity: isLoading ? 0.5 : 1,
      }}
    >
      {isLoading ? "Cancelling..." : "Cancel Order"}
    </button>
  );
}
