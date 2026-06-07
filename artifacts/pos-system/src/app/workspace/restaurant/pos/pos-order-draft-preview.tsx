import { ClipboardList } from "lucide-react";

import { formatCurrency } from "@/lib/utils/format";

import type { PosOrderDraft } from "./pos-workspace-types";

type PosOrderDraftPreviewProps = {
  draft: PosOrderDraft;
};

function formatOrderType(orderType: PosOrderDraft["orderType"]) {
  return orderType === "DINE_IN" ? "Dine in" : "Takeaway";
}

export function PosOrderDraftPreview({ draft }: PosOrderDraftPreviewProps) {
  const itemCount = draft.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-neutral-950">
            Order Draft Preview
          </h3>
          <p className="mt-1 text-xs text-neutral-500">
            Local payload summary only
          </p>
        </div>
        <ClipboardList className="h-4 w-4 text-neutral-400" aria-hidden="true" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="font-semibold text-neutral-500">Order Type</p>
          <p className="mt-1 font-bold text-neutral-950">
            {formatOrderType(draft.orderType)}
          </p>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="font-semibold text-neutral-500">Table</p>
          <p className="mt-1 font-bold text-neutral-950">
            {draft.table?.name ?? "Not selected"}
          </p>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="font-semibold text-neutral-500">Items</p>
          <p className="mt-1 font-bold text-neutral-950">{itemCount}</p>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="font-semibold text-neutral-500">Total</p>
          <p className="mt-1 font-bold text-neutral-950">
            {formatCurrency(draft.totals.total)}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-neutral-50 p-3 text-xs">
        <p className="font-semibold text-neutral-500">Notes</p>
        <p className="mt-1 font-semibold text-neutral-800">
          {draft.notes.trim() === "" ? "No notes yet" : draft.notes}
        </p>
      </div>

      {draft.errors.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-bold text-amber-900">Validation</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-800">
            {draft.errors.map((error) => (
              <li key={error.code}>{error.message}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
          Draft is locally valid. Backend order flow is still not wired.
        </div>
      )}

      {draft.warnings.length > 0 ? (
        <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs font-bold text-blue-900">Warnings</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-blue-800">
            {draft.warnings.map((warning) => (
              <li key={warning.code}>{warning.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        className="mt-4 flex h-10 w-full cursor-not-allowed items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100 text-sm font-semibold text-neutral-500"
        disabled
        type="button"
      >
        Not wired yet
      </button>
    </section>
  );
}
