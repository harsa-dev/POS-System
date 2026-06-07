import {
  Banknote,
  Building2,
  CreditCard,
  QrCode,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";

import { formatCurrency } from "@/lib/utils/format";

import type {
  CreateOrderPayloadValidationIssue,
  CreateOrderPaymentMethod,
} from "./pos-order-payload";
import type { PosOrderType } from "./pos-workspace-types";

type PosPaymentGateProps = {
  amountPaidInput: string;
  isReady: boolean;
  isSubmitting: boolean;
  orderType: PosOrderType;
  paymentMethod: CreateOrderPaymentMethod;
  readinessErrors: CreateOrderPayloadValidationIssue[];
  previewTotal: number;
  warningCount: number;
  onAmountPaidInputChange: (value: string) => void;
  onOrderTypeChange: (orderType: PosOrderType) => void;
  onPaymentMethodChange: (method: CreateOrderPaymentMethod) => void;
  onSubmit: () => void;
};

const orderTypes = [
  { id: "TAKEAWAY", label: "Takeaway", icon: ShoppingBag },
  { id: "DINE_IN", label: "Dine in", icon: UtensilsCrossed },
] as const satisfies ReadonlyArray<{
  id: PosOrderType;
  label: string;
  icon: typeof Banknote;
}>;

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
  isSubmitting,
  orderType,
  paymentMethod,
  readinessErrors,
  previewTotal,
  warningCount,
  onAmountPaidInputChange,
  onOrderTypeChange,
  onPaymentMethodChange,
  onSubmit,
}: PosPaymentGateProps) {
  const isCash = paymentMethod === "CASH";
  const canSubmit = isReady && !isSubmitting;
  const readinessLabel = isSubmitting
    ? "Submitting"
    : isReady
      ? "Ready"
      : "Blocked";

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
            isSubmitting
              ? "bg-blue-50 text-blue-700"
              : isReady
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
          }`}
        >
          {readinessLabel}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
          Order Type
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {orderTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = orderType === type.id;

            return (
              <button
                aria-pressed={isSelected}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-semibold transition ${
                  isSelected
                    ? "border-blue-700 bg-blue-50 text-blue-700"
                    : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                }`}
                disabled={isSubmitting}
                key={type.id}
                onClick={() => onOrderTypeChange(type.id)}
                type="button"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-neutral-500">
        Payment Method
      </p>
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
              disabled={isSubmitting}
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
            disabled={isSubmitting}
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
          <p className="mt-1 text-neutral-500">
            Payment transaction flow is not wired in V3 yet.
          </p>
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
        aria-busy={isSubmitting}
        className={`mt-4 flex h-10 w-full items-center justify-center rounded-2xl border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          canSubmit
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-neutral-200 bg-neutral-100 text-neutral-500"
        }`}
        disabled={!canSubmit}
        onClick={onSubmit}
        type="button"
      >
        {isSubmitting
          ? "Creating order..."
          : canSubmit
            ? "Create order"
            : "Submit blocked locally"}
      </button>
    </section>
  );
}
