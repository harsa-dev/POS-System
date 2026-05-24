"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  RefreshCw,
  Wallet,
  XCircle,
} from "lucide-react";

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

const STATUS_STYLES: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  PAID: {
    label: "Paid",
    className: "bg-green-100 text-green-700",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  PENDING: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700",
    icon: <Clock className="h-3 w-3" />,
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-100 text-red-700",
    icon: <XCircle className="h-3 w-3" />,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-neutral-100 text-neutral-500",
    icon: <XCircle className="h-3 w-3" />,
  },
};

const METHOD_ICONS: Record<string, React.ReactNode> = {
  CASH: <Banknote className="h-4 w-4" />,
  CARD: <CreditCard className="h-4 w-4" />,
  QRIS: <Wallet className="h-4 w-4" />,
  TRANSFER: <Wallet className="h-4 w-4" />,
};

function getStatusInfo(status: string) {
  return (
    STATUS_STYLES[status.toUpperCase()] ?? {
      label: status,
      className: "bg-neutral-100 text-neutral-500",
      icon: null,
    }
  );
}

function getMethodIcon(method: string) {
  return METHOD_ICONS[method.toUpperCase()] ?? (
    <CreditCard className="h-4 w-4" />
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PaymentsManager() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  async function fetchPayments() {
    setIsFetching(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/payments", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setPayments(data.data);
      } else {
        setFetchError(data.message || "Failed to load payments");
      }
    } catch {
      setFetchError("Network error — could not load payments");
    } finally {
      setIsFetching(false);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <section className="shrink-0 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Payments
        </h1>
        <p className="mt-2 text-sm text-neutral-500 sm:text-base">
          Review transaction history, methods, and payment statuses.
        </p>
      </section>

      {/* Transaction list */}
      <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-6 py-5">
          <h2 className="text-xl font-bold tracking-tight">
            Transaction History
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            All recorded payments across orders.
          </p>
        </div>

        {fetchError && (
          <div className="flex items-center gap-3 border-b border-red-100 bg-red-50 px-6 py-4">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <p className="flex-1 text-sm text-red-700">{fetchError}</p>
            <button
              type="button"
              onClick={fetchPayments}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        )}

        {isFetching ? (
          <div className="divide-y divide-neutral-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-5">
                <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : payments.length === 0 && !fetchError ? (
          <EmptyState
            icon={CreditCard}
            title="No payments yet"
            description="Completed orders with payments will appear here."
          />
        ) : (
          <div className="divide-y divide-neutral-100">
            {payments.map((payment) => {
              const statusInfo = getStatusInfo(payment.status);
              const methodIcon = getMethodIcon(payment.method);
              const displayDate = payment.paidAt ?? payment.createdAt;

              return (
                <div
                  key={payment.id}
                  className="flex items-center gap-4 px-6 py-5 transition hover:bg-neutral-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600">
                    {methodIcon}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="truncate font-semibold text-neutral-900">
                      Receipt #
                      {String(payment.order.orderNumber).padStart(6, "0")}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
                      <span className="capitalize">{payment.method}</span>
                      {payment.provider &&
                        payment.provider !== payment.method && (
                          <>
                            <span>·</span>
                            <span>{payment.provider}</span>
                          </>
                        )}
                      <span>·</span>
                      <span>{formatDate(displayDate)}</span>
                      <span>{formatTime(displayDate)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <p className="font-bold text-neutral-900">
                      Rp {payment.order.total.toLocaleString()}
                    </p>
                    <StatusBadge className={statusInfo.className}>
                      {statusInfo.icon}
                      {statusInfo.label}
                    </StatusBadge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
