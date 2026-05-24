"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";

type PaymentMethodData = {
  paymentMethod: string;
  totalOrders: number;
  revenue: number;
};

export function PaymentMethodCompact() {
  const { data, isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/payment-method", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch payment analytics");
      return res.json();
    },
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  const methods: PaymentMethodData[] = data?.data ?? [];
  const totalTransactions = methods.reduce((acc, item) => acc + item.totalOrders, 0);
  const dominantMethod = methods[0];
  const percentage =
    dominantMethod && totalTransactions > 0
      ? Math.round((dominantMethod.totalOrders / totalTransactions) * 100)
      : 0;

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">Payments</p>
          <h2 className="mt-2 text-xl font-bold">
            {isLoading ? "..." : (dominantMethod?.paymentMethod ?? "-")}
          </h2>
        </div>
        <div className="rounded-2xl bg-green-100 p-3">
          <CreditCard className="h-5 w-5 text-green-600" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-neutral-500">
          {isLoading ? "Loading..." : `${percentage}% of transactions`}
        </p>
      </div>
    </div>
  );
}
