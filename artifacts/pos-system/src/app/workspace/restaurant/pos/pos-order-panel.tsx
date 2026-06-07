import { Minus, Plus, Trash2 } from "lucide-react";

import { formatCurrency } from "@/lib/utils/format";

import type { PosCartItem, PosTableItem } from "./pos-workspace-types";

type PosOrderPanelProps = {
  cartItems: PosCartItem[];
  selectedTable: PosTableItem | null;
  onDecreaseQuantity: (productId: string) => void;
  onIncreaseQuantity: (productId: string) => void;
  onRemoveItem: (productId: string) => void;
};

export function PosOrderPanel({
  cartItems,
  selectedTable,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onRemoveItem,
}: PosOrderPanelProps) {
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-neutral-950">Current Order</h3>
          <p className="mt-1 text-xs text-neutral-500">
            {selectedTable
              ? `${selectedTable.name}, dine in placeholder`
              : "No table selected, dine in placeholder"}
          </p>
        </div>
        <span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
          {itemCount} items
        </span>
      </div>

      {cartItems.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-center text-sm text-neutral-500">
          Cart is empty. Select a product to add it locally.
        </div>
      ) : null}

      {cartItems.length > 0 ? (
        <div className="mt-4 space-y-3">
          {cartItems.map((item) => (
            <div
              className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
              key={item.productId}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-950">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {item.category} - {item.unitPriceLabel}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-neutral-950">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center rounded-full border border-neutral-200 bg-white">
                  <button
                    aria-label={`Decrease ${item.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100"
                    onClick={() => onDecreaseQuantity(item.productId)}
                    type="button"
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <span className="min-w-8 text-center text-sm font-semibold text-neutral-900">
                    {item.quantity}
                  </span>
                  <button
                    aria-label={`Increase ${item.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100"
                    onClick={() => onIncreaseQuantity(item.productId)}
                    type="button"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>

                <button
                  aria-label={`Remove ${item.name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-red-600 transition hover:bg-red-50"
                  onClick={() => onRemoveItem(item.productId)}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
