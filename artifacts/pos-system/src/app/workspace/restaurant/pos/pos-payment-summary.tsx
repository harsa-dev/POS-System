import { ReceiptText } from "lucide-react";

export function PosPaymentSummary() {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-950">Payment Summary</h3>
        <ReceiptText className="h-4 w-4 text-neutral-400" aria-hidden="true" />
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between text-neutral-500">
          <span>Subtotal</span>
          <span className="font-semibold text-neutral-800">Rp 170.000</span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>Service</span>
          <span className="font-semibold text-neutral-800">Rp 8.500</span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>Tax</span>
          <span className="font-semibold text-neutral-800">Rp 17.000</span>
        </div>
        <div className="border-t pt-3">
          <div className="flex justify-between text-base font-bold text-neutral-950">
            <span>Total</span>
            <span>Rp 195.500</span>
          </div>
        </div>
      </div>
    </section>
  );
}
