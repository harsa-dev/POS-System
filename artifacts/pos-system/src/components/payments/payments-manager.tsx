"use client";

import { useEffect, useState } from "react";

type Payment = {
  id: string;
  provider: string;
  method: string;
  status: string;
  createdAt: string;
  paidAt?: string | null;
  order: {
    orderNumber: number;
    total: number;
  };
};

export function PaymentsManager() {
  const [payments, setPayments] = useState<Payment[]>([]);

  async function fetchPayments() {
    const res = await fetch("/api/payments");
    const data = await res.json();

    if (data.success) {
      setPayments(data.data);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div className="rounded-2xl border bg-white">
      <div className="border-b p-4">
        <h2 className="font-semibold">Payment History</h2>
      </div>

      <div className="divide-y">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-center justify-between p-4"
          >
            <div>
              <p className="font-semibold">
                Receipt #{String(payment.order.orderNumber).padStart(6, "0")}
              </p>

              <p className="text-sm text-neutral-500">
                Via {payment.method} 
              </p>
            </div>

            <div className="text-right">
              <p className="font-bold">
                Rp {payment.order.total.toLocaleString()}
              </p>

              <p className="text-sm">{payment.status}</p>
            </div>
          </div>
        ))}

        {payments.length === 0 && (
          <div className="p-6 text-center text-neutral-500">
            No payments yet.
          </div>
        )}
      </div>
    </div>
  );
}