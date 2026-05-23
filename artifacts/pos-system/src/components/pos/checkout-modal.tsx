"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Banknote,
  Building2,
  CreditCard,
  QrCode,
  ShoppingBag,
  UtensilsCrossed,
  X,
} from "lucide-react";

import { formatCurrency } from "@/lib/utils/format";

type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
};

type DiningTable = {
  id: string;
  name: string;
  capacity: number;
  status: string;
  isActive: boolean;
};

type OrderType = "DINE_IN" | "TAKEAWAY";

type CheckoutModalProps = {
  open: boolean;
  onClose: () => void;

  items: CartItem[];
  tables: DiningTable[];

  subtotal: number;
  taxAmount: number;
  serviceAmount: number;
  total: number;

  currency: string;
  timezone: string;
  orderPrefix: string;

  paymentSettings: {
    cashEnabled: boolean;
    qrisEnabled: boolean;
    cardEnabled: boolean;
    transferEnabled: boolean;
    midtransEnabled: boolean;
  };

  isLoading: boolean;

  onConfirm: (
    paymentMethod: string,
    amountPaid: number,
    orderType: OrderType,
    tableId: string | null,
  ) => void;
};

const methods = [
  {
    id: "CASH",
    label: "Cash",
    icon: Banknote,
  },
  {
    id: "QRIS",
    label: "QRIS",
    icon: QrCode,
  },
  {
    id: "CARD",
    label: "Card",
    icon: CreditCard,
  },
  {
    id: "TRANSFER",
    label: "Transfer",
    icon: Building2,
  },
];

export function CheckoutModal({
  open,
  onClose,

  items,
  tables,

  subtotal,
  taxAmount,
  serviceAmount,
  total,

  currency,

  paymentSettings,

  isLoading,
  onConfirm,
}: CheckoutModalProps) {
  const [step, setStep] = useState<"review" | "payment">("review");

  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const [amountPaid, setAmountPaid] = useState("");

  const [orderType, setOrderType] = useState<OrderType>("TAKEAWAY");

  const [tableId, setTableId] = useState<string>("");

  const enabledMethods = useMemo(() => {
    return methods.filter((method) => {
      if (method.id === "CASH") {
        return paymentSettings.cashEnabled;
      }

      if (method.id === "QRIS") {
        return paymentSettings.qrisEnabled;
      }

      if (method.id === "CARD") {
        return paymentSettings.cardEnabled;
      }

      if (method.id === "TRANSFER") {
        return paymentSettings.transferEnabled;
      }

      return false;
    });
  }, [paymentSettings]);

  const availableTables = useMemo(() => {
    return tables.filter(
      (table) => table.isActive && table.status === "AVAILABLE",
    );
  }, [tables]);

  const isCash = paymentMethod === "CASH";

  const finalAmountPaid = isCash ? Number(amountPaid || 0) : total;

  const change = isCash ? Math.max(0, finalAmountPaid - total) : 0;

  const isInsufficient = isCash && finalAmountPaid < total;

  useEffect(() => {
    if (open) {
      setStep("review");

      const firstMethod = enabledMethods[0]?.id ?? "CASH";

      setPaymentMethod(firstMethod);

      setAmountPaid(String(total));

      setOrderType("TAKEAWAY");

      setTableId("");
    }
  }, [open, total, enabledMethods]);

  if (!open) return null;

  function handleConfirm() {
    if (isCash && finalAmountPaid < total) {
      import("sonner").then(({ toast }) => toast.error("Amount paid is not enough"));
      return;
    }

    if (orderType === "DINE_IN" && !tableId) {
      import("sonner").then(({ toast }) => toast.error("Please select a table for dine-in"));
      return;
    }

    onConfirm(paymentMethod, finalAmountPaid, orderType, tableId || null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-xl font-bold">
              {step === "review" ? "Order Review" : "Payment"}
            </h2>

            <p className="text-sm text-neutral-500">
              {step === "review"
                ? "Check menu items before payment"
                : "Select payment method"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {step === "review" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrderType("TAKEAWAY")}
                  className={`flex items-center justify-center gap-2 rounded-2xl border p-4 font-medium transition ${
                    orderType === "TAKEAWAY"
                      ? "border-black bg-black text-white"
                      : "hover:bg-neutral-50"
                  }`}
                >
                  <ShoppingBag className="h-5 w-5" />
                  Takeaway
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType("DINE_IN")}
                  className={`flex items-center justify-center gap-2 rounded-2xl border p-4 font-medium transition ${
                    orderType === "DINE_IN"
                      ? "border-black bg-black text-white"
                      : "hover:bg-neutral-50"
                  }`}
                >
                  <UtensilsCrossed className="h-5 w-5" />
                  Dine In
                </button>
              </div>

              {orderType === "DINE_IN" && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Select Table
                  </label>

                  <select
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                    className="w-full rounded-2xl border px-4 py-3"
                  >
                    <option value="">Choose table</option>

                    {availableTables.map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.name} • {table.capacity} seats
                      </option>
                    ))}
                  </select>

                  {availableTables.length === 0 && (
                    <p className="mt-2 text-sm text-red-600">
                      No available tables.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="flex items-center justify-between rounded-xl bg-neutral-50 p-3"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>

                      <p className="text-sm text-neutral-500">
                        {item.quantity} × {formatCurrency(item.price, currency)}
                      </p>
                    </div>

                    <p className="font-semibold">
                      {formatCurrency(item.price * item.quantity, currency)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 rounded-2xl bg-neutral-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>

                  <span>{formatCurrency(subtotal, currency)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Tax</span>

                  <span>{formatCurrency(taxAmount, currency)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Service</span>

                  <span>{formatCurrency(serviceAmount, currency)}</span>
                </div>

                <div className="flex justify-between border-t pt-3 text-lg font-bold">
                  <span>Total</span>

                  <span>{formatCurrency(total, currency)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep("payment")}
                disabled={orderType === "DINE_IN" && !tableId}
                className="w-full rounded-2xl bg-black py-4 font-semibold text-white disabled:opacity-50"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {enabledMethods.map((method) => {
                  const Icon = method.icon;

                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex items-center gap-3 rounded-2xl border p-4 transition ${
                        paymentMethod === method.id
                          ? "border-black bg-black text-white"
                          : "hover:bg-neutral-50"
                      }`}
                    >
                      <Icon className="h-5 w-5" />

                      <span className="font-medium">{method.label}</span>
                    </button>
                  );
                })}
              </div>

              {enabledMethods.length === 0 && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                  No payment methods are enabled in settings.
                </div>
              )}

              {isCash && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Amount Paid
                  </label>

                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full rounded-2xl border px-4 py-3"
                  />

                  {isInsufficient && (
                    <p className="mt-2 text-sm text-red-600">
                      Amount paid is less than total.
                    </p>
                  )}
                </div>
              )}

              {!isCash && (
                <div className="rounded-2xl border bg-neutral-50 p-4 text-sm text-neutral-600">
                  Non-cash payment will be recorded as exact payment.
                </div>
              )}

              <div className="rounded-2xl bg-neutral-50 p-4">
                <div className="flex justify-between text-sm">
                  <span>Total</span>

                  <span>{formatCurrency(total, currency)}</span>
                </div>

                <div className="mt-2 flex justify-between text-sm">
                  <span>Paid</span>

                  <span>{formatCurrency(finalAmountPaid, currency)}</span>
                </div>

                <div className="mt-3 flex justify-between border-t pt-3 text-lg font-bold">
                  <span>Change</span>

                  <span>{formatCurrency(change, currency)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={
                  isLoading || isInsufficient || enabledMethods.length === 0
                }
                className="w-full rounded-2xl bg-black py-4 font-semibold text-white disabled:opacity-50"
              >
                {isLoading ? "Processing..." : "Complete Payment"}
              </button>

              <button
                type="button"
                onClick={() => setStep("review")}
                className="w-full rounded-2xl border py-3 font-medium"
              >
                Back to Review
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}