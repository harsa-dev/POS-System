import { formatCurrency, formatNumber } from "@/features/shared/format";
import type { CashierShift } from "@/features/shared/types";

export function ShiftDetailDrawer({
  shift,
  onClose,
}: {
  shift: CashierShift | null;
  onClose: () => void;
}) {
  if (!shift) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <aside className="h-full w-full max-w-md overflow-auto bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-950">
              Shift Detail
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Future detail structure for {shift.cashierName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold hover:bg-neutral-50"
          >
            Close
          </button>
        </div>

        <dl className="mt-6 grid gap-3 text-sm">
          <div className="flex justify-between gap-3 rounded-lg bg-neutral-50 p-3">
            <dt className="text-neutral-500">Starting Cash</dt>
            <dd className="font-semibold text-neutral-950">
              {formatCurrency(shift.startingCash)}
            </dd>
          </div>
          <div className="flex justify-between gap-3 rounded-lg bg-neutral-50 p-3">
            <dt className="text-neutral-500">Ending Cash</dt>
            <dd className="font-semibold text-neutral-950">
              {formatCurrency(shift.endingCash)}
            </dd>
          </div>
          <div className="flex justify-between gap-3 rounded-lg bg-neutral-50 p-3">
            <dt className="text-neutral-500">Cash Out</dt>
            <dd className="font-semibold text-neutral-950">
              {formatCurrency(shift.cashOut)}
            </dd>
          </div>
          <div className="flex justify-between gap-3 rounded-lg bg-neutral-50 p-3">
            <dt className="text-neutral-500">Transactions</dt>
            <dd className="font-semibold text-neutral-950">
              {formatNumber(shift.transactionCount)}
            </dd>
          </div>
          <div className="flex justify-between gap-3 rounded-lg bg-neutral-50 p-3">
            <dt className="text-neutral-500">Cash Difference</dt>
            <dd className="font-semibold text-neutral-950">
              {formatCurrency(shift.cashDifference)}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
