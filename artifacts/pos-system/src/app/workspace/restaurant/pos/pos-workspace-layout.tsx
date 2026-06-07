import { useMemo, useState } from "react";

import { PosCategoryRail } from "./pos-category-rail";
import { PosBackendPayloadPreview } from "./pos-backend-payload-preview";
import { PosOpenOrdersPanel } from "./pos-open-orders-panel";
import { buildPosOrderDraft } from "./pos-order-draft";
import { PosOrderDraftPreview } from "./pos-order-draft-preview";
import {
  buildCreateOrderPayloadPreview,
  type CreateOrderPaymentMethod,
} from "./pos-order-payload";
import { PosOrderPanel } from "./pos-order-panel";
import { PosPaymentGate } from "./pos-payment-gate";
import { PosPaymentSummary } from "./pos-payment-summary";
import { PosProductGrid } from "./pos-product-grid";
import { PosQuickActions } from "./pos-quick-actions";
import { PosTableStatusPanel } from "./pos-table-status-panel";
import { PosWorkspaceHeader } from "./pos-workspace-header";
import { usePosMenuCatalog } from "./use-pos-menu-catalog";
import { usePosOpenOrders } from "./use-pos-open-orders";
import { usePosTables } from "./use-pos-tables";
import type {
  PosCartItem,
  PosCartTotals,
  PosOrderType,
  PosProductItem,
} from "./pos-workspace-types";

const previewServiceRate = 5;
const previewTaxRate = 10;
const previewOrderType: PosOrderType = "DINE_IN";
const previewOrderNotes = "";

export function PosWorkspaceLayout() {
  const catalog = usePosMenuCatalog();
  const tableCatalog = usePosTables();
  const openOrders = usePosOpenOrders();
  const [cartItems, setCartItems] = useState<PosCartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] =
    useState<CreateOrderPaymentMethod>("CASH");
  const [amountPaidInput, setAmountPaidInput] = useState("0");
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const hasActiveFilters = selectedCategory !== null || normalizedSearchQuery !== "";

  const filteredProducts = useMemo(
    () =>
      catalog.products.filter((product) => {
        const matchesCategory =
          selectedCategory === null || product.category === selectedCategory;
        const matchesSearch =
          normalizedSearchQuery === "" ||
          product.name.toLowerCase().includes(normalizedSearchQuery) ||
          product.category.toLowerCase().includes(normalizedSearchQuery);

        return matchesCategory && matchesSearch;
      }),
    [catalog.products, normalizedSearchQuery, selectedCategory],
  );

  const selectedTable = useMemo(
    () =>
      tableCatalog.tables.find((table) => table.id === selectedTableId) ?? null,
    [selectedTableId, tableCatalog.tables],
  );

  const cartTotals = useMemo<PosCartTotals>(() => {
    const subtotal = cartItems.reduce(
      (total, item) => total + item.unitPrice * item.quantity,
      0,
    );
    const serviceAmount = Math.round(subtotal * (previewServiceRate / 100));
    const taxAmount = Math.round(subtotal * (previewTaxRate / 100));

    return {
      subtotal,
      serviceAmount,
      taxAmount,
      total: subtotal + serviceAmount + taxAmount,
      serviceRate: previewServiceRate,
      taxRate: previewTaxRate,
    };
  }, [cartItems]);

  const orderDraft = useMemo(
    () =>
      buildPosOrderDraft({
        cartItems,
        selectedTable,
        totals: cartTotals,
        orderType: previewOrderType,
        notes: previewOrderNotes,
      }),
    [cartItems, cartTotals, selectedTable],
  );

  const cashAmountPaid =
    amountPaidInput.trim() === "" ? Number.NaN : Number(amountPaidInput);
  const previewAmountPaid =
    paymentMethod === "CASH" ? cashAmountPaid : cartTotals.total;

  const orderPayloadPreview = useMemo(
    () =>
      buildCreateOrderPayloadPreview({
        draft: orderDraft,
        paymentMethod,
        amountPaid: previewAmountPaid,
      }),
    [orderDraft, paymentMethod, previewAmountPaid],
  );

  function handleAddProduct(product: PosProductItem) {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.productId === product.id,
      );

      if (existingItem) {
        return currentItems.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...currentItems,
        {
          productId: product.id,
          name: product.name,
          category: product.category,
          unitPrice: product.priceValue,
          unitPriceLabel: product.price,
          quantity: 1,
        },
      ];
    });
  }

  function handleIncreaseQuantity(productId: string) {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }

  function handleDecreaseQuantity(productId: string) {
    setCartItems((currentItems) =>
      currentItems.flatMap((item) => {
        if (item.productId !== productId) {
          return [item];
        }

        if (item.quantity <= 1) {
          return [];
        }

        return [{ ...item, quantity: item.quantity - 1 }];
      }),
    );
  }

  function handleRemoveItem(productId: string) {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.productId !== productId),
    );
  }

  function handleClearCart() {
    setCartItems([]);
  }

  return (
    <div className="space-y-4">
      <PosWorkspaceHeader
        onSearchQueryChange={setSearchQuery}
        searchQuery={searchQuery}
        selectedTable={selectedTable}
        tableStatus={tableCatalog.status}
      />
      <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_360px]">
        <PosCategoryRail
          categories={catalog.categories}
          onSelectCategory={setSelectedCategory}
          selectedCategory={selectedCategory}
        />
        <PosProductGrid
          emptyMessage={
            hasActiveFilters
              ? "No menu items match the current search or category filter."
              : "No menu items are available for this workspace preview yet."
          }
          errorMessage={catalog.errorMessage}
          isUsingFallback={catalog.isUsingFallback}
          onAddProduct={handleAddProduct}
          products={filteredProducts}
          status={catalog.status}
        />
        <aside className="space-y-4">
          <PosTableStatusPanel
            errorMessage={tableCatalog.errorMessage}
            isUsingFallback={tableCatalog.isUsingFallback}
            onSelectTable={setSelectedTableId}
            selectedTableId={selectedTableId}
            status={tableCatalog.status}
            summary={tableCatalog.summary}
            tables={tableCatalog.tables}
          />
          <PosOrderPanel
            cartItems={cartItems}
            onDecreaseQuantity={handleDecreaseQuantity}
            onIncreaseQuantity={handleIncreaseQuantity}
            onRemoveItem={handleRemoveItem}
            selectedTable={selectedTable}
          />
          <PosOpenOrdersPanel
            errorMessage={openOrders.errorMessage}
            isUsingFallback={openOrders.isUsingFallback}
            onSelectOrder={setSelectedOrderId}
            orders={openOrders.orders}
            selectedOrderId={selectedOrderId}
            status={openOrders.status}
          />
          <PosPaymentSummary totals={cartTotals} />
          <PosPaymentGate
            amountPaidInput={amountPaidInput}
            isReady={orderPayloadPreview.isReady}
            onAmountPaidInputChange={setAmountPaidInput}
            onPaymentMethodChange={setPaymentMethod}
            paymentMethod={paymentMethod}
            previewTotal={cartTotals.total}
            readinessErrors={orderPayloadPreview.errors}
            warningCount={orderDraft.warnings.length}
          />
          <PosOrderDraftPreview draft={orderDraft} />
          <PosBackendPayloadPreview
            amountPaid={previewAmountPaid}
            paymentMethod={paymentMethod}
            preview={orderPayloadPreview}
          />
        </aside>
      </div>
      <PosQuickActions
        hasCartItems={cartItems.length > 0}
        onClearCart={handleClearCart}
      />
    </div>
  );
}
