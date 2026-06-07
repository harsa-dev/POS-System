import { ReceiptText } from "lucide-react";

import { formatCurrency } from "@/lib/utils/format";

import type { PosCartTotals } from "./pos-workspace-types";

type PosPaymentSummaryProps = {
  totals: PosCartTotals;
};

export function PosPaymentSummary({ totals }: PosPaymentSummaryProps) {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-neutral-950">Payment Summary</h3>
          <p className="mt-1 text-xs text-neutral-500">Preview calculation only</p>
        </div>
        <ReceiptText className="h-4 w-4 text-neutral-400" aria-hidden="true" />
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between text-neutral-500">
          <span>Subtotal</span>
          <span className="font-semibold text-neutral-800">
            {formatCurrency(totals.subtotal)}
          </span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>Service ({totals.serviceRate}%)</span>
          <span className="font-semibold text-neutral-800">
            {formatCurrency(totals.serviceAmount)}
          </span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>Tax ({totals.taxRate}%)</span>
          <span className="font-semibold text-neutral-800">
            {formatCurrency(totals.taxAmount)}
          </span>
        </div>
        <div className="border-t pt-3">
          <div className="flex justify-between text-base font-bold text-neutral-950">
            <span>Total</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
