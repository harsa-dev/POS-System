"use client";

import { Banknote, Building2, CreditCard, QrCode } from "lucide-react";

type PaymentSelectorProps = {
  total: number;
  paymentMethod: string;
  amountPaid: string;
  onPaymentMethodChange: (value: string) => void;
  onAmountPaidChange: (value: string) => void;
};

const methods = [
  { id: "CASH", label: "Cash", icon: Banknote },
  { id: "QRIS", label: "QRIS", icon: QrCode },
  { id: "CARD", label: "Card", icon: CreditCard },
  { id: "TRANSFER", label: "Transfer", icon: Building2 },
];

export function PaymentSelector({
  total,
  paymentMethod,
  amountPaid,
  onPaymentMethodChange,
  onAmountPaidChange,
}: PaymentSelectorProps) {
  const paid = Number(amountPaid || 0);
  const change = Math.max(0, paid - total);
  const isInsufficient = paid < total;

  return (
    <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Payment</h2>
        <p className="text-sm text-neutral-500">
          Select payment method and confirm amount.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {methods.map((method) => {
          const Icon = method.icon;
          const active = paymentMethod === method.id;

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onPaymentMethodChange(method.id)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-white hover:bg-neutral-50"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{method.label}</span>
            </button>
          );
        })}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Amount Paid</label>
        <input
          type="number"
          value={amountPaid}
          onChange={(e) => onAmountPaidChange(e.target.value)}
          placeholder="Amount paid"
          className="w-full rounded-xl border px-3 py-2"
        />
      </div>

      <div className="space-y-2 rounded-xl bg-neutral-50 p-3 text-sm">
        <div className="flex justify-between">
          <span>Total</span>
          <span>Rp {total.toLocaleString()}</span>
        </div>

        <div className="flex justify-between">
          <span>Paid</span>
          <span>Rp {paid.toLocaleString()}</span>
        </div>

        <div
          className={`flex justify-between border-t pt-2 font-semibold ${
            isInsufficient ? "text-red-600" : "text-green-700"
          }`}
        >
          <span>{isInsufficient ? "Remaining" : "Change"}</span>
          <span>
            Rp {Math.abs(paid - total).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}