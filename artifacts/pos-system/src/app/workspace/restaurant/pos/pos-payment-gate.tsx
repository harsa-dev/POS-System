import { Banknote, Building2, CreditCard, QrCode } from "lucide-react";

import { formatCurrency } from "@/lib/utils/format";

import type {
  CreateOrderPayloadValidationIssue,
  CreateOrderPaymentMethod,
} from "./pos-order-payload";

type PosPaymentGateProps = {
  amountPaidInput: string;
  isReady: boolean;
  paymentMethod: CreateOrderPaymentMethod;
  readinessErrors: CreateOrderPayloadValidationIssue[];
  previewTotal: number;
  warningCount: number;
  onAmountPaidInputChange: (value: string) => void;
  onPaymentMethodChange: (method: CreateOrderPaymentMethod) => void;
};

const paymentMethods = [
  { id: "CASH", label: "Cash", icon: Banknote },
  { id: "QRIS", label: "QRIS", icon: QrCode },
  { id: "CARD", label: "Card", icon: CreditCard },
  { id: "TRANSFER", label: "Transfer", icon: Building2 },
] as const satisfies ReadonlyArray<{
  id: CreateOrderPaymentMethod;
  label: string;
  icon: typeof Banknote;
}>;

export function PosPaymentGate({
  amountPaidInput,
  isReady,
  paymentMethod,
  readinessErrors,
  previewTotal,
  warningCount,
  onAmountPaidInputChange,
  onPaymentMethodChange,
}: PosPaymentGateProps) {
  const isCash = paymentMethod === "CASH";

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-neutral-950">
            Submit Readiness
          </h3>
          <p className="mt-1 text-xs text-neutral-500">
            Local payment gate only
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            isReady
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {isReady ? "Ready" : "Blocked"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = paymentMethod === method.id;

          return (
            <button
              aria-pressed={isSelected}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-semibold transition ${
                isSelected
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
              }`}
              key={method.id}
              onClick={() => onPaymentMethodChange(method.id)}
              type="button"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {method.label}
            </button>
          );
        })}
      </div>

      {isCash ? (
        <label className="mt-4 block text-xs font-semibold text-neutral-600">
          Amount Paid
          <input
            className="mt-2 h-11 w-full rounded-2xl border border-neutral-200 px-3 text-sm font-semibold text-neutral-950 outline-none transition focus:border-neutral-400"
            inputMode="numeric"
            min={0}
            onChange={(event) => onAmountPaidInputChange(event.target.value)}
            placeholder="Enter cash amount"
            type="number"
            value={amountPaidInput}
          />
        </label>
      ) : (
        <div className="mt-4 rounded-2xl bg-neutral-50 p-3 text-xs text-neutral-600">
          Non-cash preview uses exact payment:
          <span className="ml-1 font-bold text-neutral-950">
            {formatCurrency(previewTotal)}
          </span>
        </div>
      )}

      <div className="mt-4 space-y-2 text-xs">
        <div className="flex justify-between rounded-2xl bg-neutral-50 px-3 py-2">
          <span className="font-semibold text-neutral-500">Blocking Rules</span>
          <span className="font-bold text-neutral-950">
            {readinessErrors.length}
          </span>
        </div>
        <div className="flex justify-between rounded-2xl bg-neutral-50 px-3 py-2">
          <span className="font-semibold text-neutral-500">Warnings</span>
          <span className="font-bold text-neutral-950">{warningCount}</span>
        </div>
      </div>

      <button
        className={`mt-4 flex h-10 w-full cursor-not-allowed items-center justify-center rounded-2xl border text-sm font-semibold ${
          isReady
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-neutral-200 bg-neutral-100 text-neutral-500"
        }`}
        disabled
        type="button"
      >
        {isReady ? "Ready to submit - not wired yet" : "Submit blocked locally"}
      </button>
    </section>
  );
}
