import { Braces } from "lucide-react";

import { formatCurrency } from "@/lib/utils/format";

import type {
  CreateOrderPayload,
  CreateOrderPayloadPreview,
  CreateOrderPaymentMethod,
} from "./pos-order-payload";

type PosBackendPayloadPreviewProps = {
  amountPaid: number;
  paymentMethod: CreateOrderPaymentMethod;
  preview: CreateOrderPayloadPreview;
};

function stringifyPreviewPayload(payload: CreateOrderPayload) {
  return JSON.stringify(
    payload,
    (_, value: unknown) =>
      typeof value === "number" && !Number.isFinite(value)
        ? "INVALID_NUMBER"
        : value,
    2,
  );
}

export function PosBackendPayloadPreview({
  amountPaid,
  paymentMethod,
  preview,
}: PosBackendPayloadPreviewProps) {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-neutral-950">
            Backend Payload Preview
          </h3>
          <p className="mt-1 text-xs text-neutral-500">
            Future API body only, no request is sent
          </p>
        </div>
        <Braces className="h-4 w-4 text-neutral-400" aria-hidden="true" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="font-semibold text-neutral-500">Payment</p>
          <p className="mt-1 font-bold text-neutral-950">{paymentMethod}</p>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="font-semibold text-neutral-500">Amount Paid</p>
          <p className="mt-1 font-bold text-neutral-950">
            {Number.isFinite(amountPaid)
              ? formatCurrency(amountPaid)
              : "Invalid amount"}
          </p>
        </div>
      </div>

      {preview.errors.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-bold text-amber-900">Payload Readiness</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-800">
            {preview.errors.map((error) => (
              <li key={error.code}>{error.message}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
          Payload shape is locally ready. Submit is still disabled.
        </div>
      )}

      <pre className="mt-4 max-h-64 overflow-auto rounded-2xl bg-neutral-950 p-3 text-[11px] leading-5 text-neutral-50">
        {stringifyPreviewPayload(preview.payload)}
      </pre>

      <button
        className="mt-4 flex h-10 w-full cursor-not-allowed items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100 text-sm font-semibold text-neutral-500"
        disabled
        type="button"
      >
        Submit not wired yet
      </button>
    </section>
  );
}
