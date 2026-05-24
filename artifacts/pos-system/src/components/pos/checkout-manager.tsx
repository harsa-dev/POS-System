"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ShoppingCart, X } from "lucide-react";

import { Cart } from "@/components/pos/cart";
import { CheckoutModal } from "@/components/pos/checkout-modal";
import { MenuGrid } from "@/components/pos/menu-grid";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  availabilityStatus: "AVAILABLE" | "OUT_OF_STOCK" | "NO_RECIPE";
};

type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
};

type PaymentSettings = {
  cashEnabled: boolean;
  qrisEnabled: boolean;
  cardEnabled: boolean;
  transferEnabled: boolean;
  midtransEnabled: boolean;
};

type DiningTable = {
  id: string;
  name: string;
  capacity: number;
  status: string;
  isActive: boolean;
};

type OrderType = "DINE_IN" | "TAKEAWAY";

export function CheckoutManager() {
  const [, navigate] = useLocation();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [currency, setCurrency] = useState("IDR");
  const [timezone, setTimezone] = useState("Asia/Makassar");
  const [orderPrefix, setOrderPrefix] = useState("ORD");

  const [taxRate, setTaxRate] = useState(0);
  const [serviceRate, setServiceRate] = useState(0);

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    cashEnabled: true,
    qrisEnabled: false,
    cardEnabled: false,
    transferEnabled: false,
    midtransEnabled: false,
  });

  async function fetchMenuItems() {
    const res = await fetch("/api/menu-items", { credentials: "include" });
    const data = await res.json();
    if (data.success) setMenuItems(data.data);
  }

  async function fetchTables() {
    const res = await fetch("/api/tables", { credentials: "include" });
    const data = await res.json();
    if (data.success) setTables(data.data);
  }

  async function fetchSettings() {
    const res = await fetch("/api/settings", { credentials: "include" });
    const data = await res.json();
    if (data.success) {
      setTaxRate(data.data.taxRate ?? 0);
      setServiceRate(data.data.serviceRate ?? 0);
      setCurrency(data.data.currency ?? "IDR");
      setTimezone(data.data.timezone ?? "Asia/Makassar");
      setOrderPrefix(data.data.orderPrefix ?? "ORD");
      setPaymentSettings({
        cashEnabled: data.data.cashEnabled ?? true,
        qrisEnabled: data.data.qrisEnabled ?? false,
        cardEnabled: data.data.cardEnabled ?? false,
        transferEnabled: data.data.transferEnabled ?? false,
        midtransEnabled: data.data.midtransEnabled ?? false,
      });
    }
  }

  function addToCart(menuItem: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((item) => item.menuItemId === menuItem.id);
      if (existing) {
        return prev.map((item) =>
          item.menuItemId === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1 }];
    });
  }

  function increaseQuantity(menuItemId: string) {
    const menuItem = menuItems.find((item) => item.id === menuItemId);
    if (!menuItem) return;
    addToCart(menuItem);
  }

  function decreaseQuantity(menuItemId: string) {
    setCart((prev) =>
      prev
        .map((item) => (item.menuItemId === menuItemId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(menuItemId: string) {
    setCart((prev) => prev.filter((item) => item.menuItemId !== menuItemId));
  }

  function openCheckout() {
    if (!cart.length) {
      toast.warning("Cart is empty", { description: "Add items before checking out." });
      return;
    }
    setIsCheckoutOpen(true);
  }

  function openCheckoutFromDrawer() {
    setIsCartOpen(false);
    openCheckout();
  }

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.price * item.quantity, 0), [cart]);
  const taxAmount = Math.round(subtotal * (taxRate / 100));
  const serviceAmount = Math.round(subtotal * (serviceRate / 100));
  const total = subtotal + taxAmount + serviceAmount;

  const totalItemCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart],
  );

  async function completeCheckout(
    paymentMethod: string,
    amountPaid: number,
    orderType: OrderType,
    tableId: string | null,
  ) {
    if (!cart.length) {
      toast.error("Cart is empty");
      return;
    }

    if (orderType === "DINE_IN" && !tableId) {
      toast.error("Please select a table for dine-in order");
      return;
    }

    if (paymentMethod === "CASH" && amountPaid < total) {
      toast.error("Insufficient payment amount", { description: `Need at least ${total.toLocaleString()}` });
      return;
    }

    setIsLoading(true);

    const orderRes = await fetch("/api/orders", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentMethod,
        amountPaid,
        orderType,
        tableId,
        items: cart.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })),
      }),
    });

    const data = await orderRes.json();

    if (!data.success) {
      setIsLoading(false);
      toast.error(data.message || "Checkout failed");
      return;
    }

    if (paymentMethod === "CASH") {
      setIsLoading(false);
      const orderId = data.data.id;
      setCart([]);
      setIsCheckoutOpen(false);
      fetchMenuItems();
      fetchSettings();
      fetchTables();
      toast.success("Order created successfully");
      navigate(`/dashboard/orders/${orderId}`);
      return;
    }

    const paymentRes = await fetch("/api/payments/create-transaction", {
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: data.data.id,
        total: data.data.total,
        customerName: "Customer",
      }),
    });

    const paymentData = await paymentRes.json();
    setIsLoading(false);

    if (!paymentData.success) {
      toast.error("Failed to create payment transaction");
      return;
    }

    window.location.href = paymentData.redirectUrl;
  }

  useEffect(() => {
    fetchMenuItems();
    fetchSettings();
    fetchTables();
  }, []);

  return (
    <>
      {/* Main layout: single column on mobile, two-column from lg (1024px) upward */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <MenuGrid menuItems={menuItems} currency={currency} onAddToCart={addToCart} />

        {/* Desktop / tablet cart — hidden below lg, shown as sidebar column from lg+ */}
        <div className="hidden lg:block">
          <Cart
            items={cart}
            total={total}
            currency={currency}
            isLoading={isLoading}
            onIncrease={increaseQuantity}
            onDecrease={decreaseQuantity}
            onRemove={removeItem}
            onCheckout={openCheckout}
          />
        </div>
      </div>

      {/* ── Mobile floating cart button ──────────────────────────────────────
          Visible only below lg. Fixed to bottom-right. Shows item count badge.
          Meets 44×44 px minimum touch target (actual size: 56×56 px). */}
      <button
        type="button"
        aria-label={`View cart, ${totalItemCount} item${totalItemCount !== 1 ? "s" : ""}`}
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:bg-primary/90 active:scale-95 lg:hidden"
      >
        <ShoppingCart className="h-6 w-6" />
        {totalItemCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white"
          >
            {totalItemCount > 99 ? "99+" : totalItemCount}
          </span>
        )}
      </button>

      {/* ── Mobile cart bottom-sheet drawer ─────────────────────────────────
          Visible only below lg. Same overlay pattern as the mobile sidebar.
          max-h-[90svh]: svh = small viewport height — safe on all mobile
          browsers regardless of dynamic address bar state. */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsCartOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <div className="absolute bottom-0 left-0 right-0 flex max-h-[90svh] flex-col rounded-t-3xl bg-white shadow-2xl">
            {/* Drawer header */}
            <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">Cart</h2>
                {totalItemCount > 0 && (
                  <p className="text-xs text-neutral-500">
                    {totalItemCount} item{totalItemCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                aria-label="Close cart"
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart content — scrollable when items overflow */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Cart
                items={cart}
                total={total}
                currency={currency}
                isLoading={isLoading}
                onIncrease={increaseQuantity}
                onDecrease={decreaseQuantity}
                onRemove={removeItem}
                onCheckout={openCheckoutFromDrawer}
                drawerMode
              />
            </div>
          </div>
        </div>
      )}

      <CheckoutModal
        open={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        tables={tables}
        subtotal={subtotal}
        taxAmount={taxAmount}
        serviceAmount={serviceAmount}
        total={total}
        currency={currency}
        timezone={timezone}
        orderPrefix={orderPrefix}
        paymentSettings={paymentSettings}
        isLoading={isLoading}
        onConfirm={completeCheckout}
      />
    </>
  );
}
