"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

import { Cart } from "@/components/pos/cart";
import { CheckoutModal } from "@/components/pos/checkout-modal";
import { MenuGrid } from "@/components/pos/menu-grid";

type MenuItem = {
  id: string;
  name: string;
  price: number;

  imageUrl?: string | null;

  availabilityStatus:
    | "AVAILABLE"
    | "OUT_OF_STOCK"
    | "NO_RECIPE";
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

    if (data.success) {
      setMenuItems(data.data);
    }
  }

  async function fetchTables() {
    const res = await fetch("/api/tables", { credentials: "include" });
    const data = await res.json();

    if (data.success) {
      setTables(data.data);
    }
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
          item.menuItemId === menuItem.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...prev,
        {
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
        },
      ];
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
        .map((item) =>
          item.menuItemId === menuItemId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(menuItemId: string) {
    setCart((prev) => prev.filter((item) => item.menuItemId !== menuItemId));
  }

  function openCheckout() {
    if (!cart.length) {
      alert("Cart is empty");
      return;
    }

    setIsCheckoutOpen(true);
  }

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  const taxAmount = Math.round(subtotal * (taxRate / 100));
  const serviceAmount = Math.round(subtotal * (serviceRate / 100));
  const total = subtotal + taxAmount + serviceAmount;

  async function completeCheckout(
    paymentMethod: string,
    amountPaid: number,
    orderType: OrderType,
    tableId: string | null,
  ) {
    if (!cart.length) {
      alert("Cart is empty");
      return;
    }

    if (orderType === "DINE_IN" && !tableId) {
      alert("Please select a table for dine-in order");
      return;
    }

    if (paymentMethod === "CASH" && amountPaid < total) {
      alert("Amount paid is not enough");
      return;
    }

    setIsLoading(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      credentials: "include",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        paymentMethod,
        amountPaid,
        orderType,
        tableId,

        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      }),
    });

    const data = await res.json();

    if (!data.success) {
      setIsLoading(false);

      alert(data.message || "Checkout failed");
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

      navigate(`/dashboard/orders/${orderId}`);

      return;
    }

    const paymentRes = await fetch("/api/payments/create-transaction", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        orderId: data.data.id,
        total: data.data.total,
        customerName: "Customer",
      }),
    });

    const paymentData = await paymentRes.json();

    setIsLoading(false);

    if (!paymentData.success) {
      alert("Failed to create payment transaction");
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
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <MenuGrid
          menuItems={menuItems}
          currency={currency}
          onAddToCart={addToCart}
        />

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
