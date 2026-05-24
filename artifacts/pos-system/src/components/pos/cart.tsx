"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

import { formatCurrency } from "@/lib/utils/format";

import { Button } from "@/components/ui/button";

type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
};

type CartProps = {
  items: CartItem[];
  total: number;
  currency: string;
  isLoading: boolean;
  onIncrease: (menuItemId: string) => void;
  onDecrease: (menuItemId: string) => void;
  onRemove: (menuItemId: string) => void;
  onCheckout: () => void;
  /**
   * drawerMode: true when rendered inside the mobile bottom-sheet drawer.
   * Removes the card chrome (border/shadow/rounded) since the drawer panel
   * already provides the visual container. Also removes the internal "Cart"
   * heading since the drawer has its own header.
   */
  drawerMode?: boolean;
};

export function Cart({
  items,
  total,
  currency,
  isLoading,
  onIncrease,
  onDecrease,
  onRemove,
  onCheckout,
  drawerMode = false,
}: CartProps) {
  const itemList = (
    <>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-500">
          No menu items in cart
        </p>
      ) : (
        <div
          className={
            drawerMode
              ? /* In drawer: no fixed cap — drawer container bounds height */
                "space-y-3"
              : /* Desktop sidebar: cap items so card doesn't grow unbounded */
                "max-h-[40vh] space-y-3 overflow-y-auto"
          }
        >
          {items.map((item) => (
            <div
              key={item.menuItemId}
              className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>

                <p className="text-xs text-neutral-500">
                  {formatCurrency(item.price, currency)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  onClick={() => onDecrease(item.menuItemId)}
                  className="flex h-11 w-11 items-center justify-center rounded-md border bg-white"
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <span className="w-8 text-center text-sm font-medium">
                  {item.quantity}
                </span>

                <Button
                  type="button"
                  onClick={() => onIncrease(item.menuItemId)}
                  className="flex h-11 w-11 items-center justify-center rounded-md border bg-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  onClick={() => onRemove(item.menuItemId)}
                  className="flex h-11 w-11 items-center justify-center rounded-md text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const footer = (
    <div className={drawerMode ? "border-t p-4" : "border-t p-4"}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-500">Total</p>

        <p className="text-2xl font-bold">
          {formatCurrency(total, currency)}
        </p>
      </div>

      <Button
        type="button"
        onClick={onCheckout}
        disabled={items.length === 0 || isLoading}
        className="w-full rounded-2xl bg-black py-4 font-semibold text-white disabled:opacity-50"
      >
        {isLoading ? "Processing..." : "Checkout"}
      </Button>
    </div>
  );

  /* ── Drawer mode: flat layout, no card chrome ──────────────────────────
     The drawer panel in checkout-manager already provides the visual frame.
     We render items + footer directly without an extra border/shadow card. */
  if (drawerMode) {
    return (
      <div className="flex flex-col">
        <div className="p-4">{itemList}</div>
        {footer}
      </div>
    );
  }

  /* ── Default / desktop sidebar mode: full card ─────────────────────── */
  return (
    <div className="w-full">
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Cart</h2>
        </div>

        <div className="space-y-3 p-4">{itemList}</div>

        {footer}
      </div>
    </div>
  );
}
