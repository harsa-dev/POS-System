import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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
import { PosPaymentGate, type PosPaymentStep } from "./pos-payment-gate";
import { PosPaymentSummary } from "./pos-payment-summary";
import { PosProductGrid } from "./pos-product-grid";
import { PosQuickActions } from "./pos-quick-actions";
import { PosTableStatusPanel } from "./pos-table-status-panel";
import { PosWorkspaceHeader } from "./pos-workspace-header";
import { usePosMenuCatalog } from "./use-pos-menu-catalog";
import { usePosOpenOrders } from "./use-pos-open-orders";
import { usePosTables } from "./use-pos-tables";
import { getApiErrorMessage, orderApi, paymentsApi } from "@/lib/api";
import type {
  PosCartItem,
  PosCartTotals,
  PosOrderType,
  PosProductItem,
} from "./pos-workspace-types";

const previewServiceRate = 5;
const previewTaxRate = 10;
const previewOrderNotes = "";

type CreateOrderResponse = {
  id: string;
  total: number;
  orderNumber?: number;
  status?: string;
};

type PendingPaymentOrder = {
  orderId: string;
  total: number;
  orderNumber?: number;
  paymentMethod: Exclude<CreateOrderPaymentMethod, "CASH">;
  errorMessage: string | null;
};

function isNonCashPaymentMethod(
  paymentMethod: CreateOrderPaymentMethod,
): paymentMethod is Exclude<CreateOrderPaymentMethod, "CASH"> {
  return paymentMethod !== "CASH";
}

export function PosWorkspaceLayout() {
  const catalog = usePosMenuCatalog();
  const tableCatalog = usePosTables();
  const openOrders = usePosOpenOrders();
  const [cartItems, setCartItems] = useState<PosCartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<PosOrderType>("TAKEAWAY");
  const [paymentMethod, setPaymentMethod] =
    useState<CreateOrderPaymentMethod>("CASH");
  const [amountPaidInput, setAmountPaidInput] = useState("0");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [paymentStep, setPaymentStep] = useState<PosPaymentStep>("idle");
  const [pendingPaymentOrder, setPendingPaymentOrder] =
    useState<PendingPaymentOrder | null>(null);
  const isCreateOrderInFlightRef = useRef(false);
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
        orderType,
        notes: previewOrderNotes,
      }),
    [cartItems, cartTotals, orderType, selectedTable],
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

  function handleOrderTypeChange(nextOrderType: PosOrderType) {
    setOrderType(nextOrderType);

    if (nextOrderType === "TAKEAWAY") {
      setSelectedTableId(null);
    }
  }

  async function createPaymentTransactionForOrder(
    pendingOrder: PendingPaymentOrder,
  ) {
    try {
      if (import.meta.env.DEV) {
        console.debug("[pos-v3] create payment transaction payload", {
          orderId: pendingOrder.orderId,
          total: pendingOrder.total,
          customerName: "Customer",
        });
      }

      const result = await paymentsApi.createTransactionWithResult({
        orderId: pendingOrder.orderId,
        total: pendingOrder.total,
        customerName: "Customer",
      });

      if (import.meta.env.DEV) {
        console.debug("[pos-v3] create payment transaction response", {
          status: result.status,
          ok: result.ok,
          body: result.body,
        });
      }

      const redirectUrl = result.body.redirectUrl;

      if (!result.ok || !result.body.success || !redirectUrl) {
        const errorMessage =
          result.body.message ||
          `Failed to create payment transaction (${result.status})`;

        setPendingPaymentOrder({
          ...pendingOrder,
          errorMessage,
        });
        setPaymentStep("payment-error");
        toast.error("Payment link failed", { description: errorMessage });

        return false;
      }

      setPaymentStep("redirecting");
      setPendingPaymentOrder(null);
      toast.success("Payment link created", {
        description: "Redirecting to payment page.",
      });
      window.location.href = redirectUrl;

      return true;
    } catch (error) {
      const errorMessage = getApiErrorMessage(
        error,
        "Failed to create payment transaction",
      );

      if (import.meta.env.DEV) {
        console.error("[pos-v3] create payment transaction error", error);
      }

      setPendingPaymentOrder({
        ...pendingOrder,
        errorMessage,
      });
      setPaymentStep("payment-error");
      toast.error("Payment link failed", { description: errorMessage });

      return false;
    }
  }

  async function handleRetryPaymentTransaction() {
    if (!pendingPaymentOrder) {
      return;
    }

    if (isCreateOrderInFlightRef.current) {
      if (import.meta.env.DEV) {
        console.debug("[pos-v3] duplicate payment retry blocked");
      }

      return;
    }

    isCreateOrderInFlightRef.current = true;
    setIsSubmittingOrder(true);
    setPaymentStep("creating-payment");

    let didStartRedirect = false;

    try {
      didStartRedirect =
        await createPaymentTransactionForOrder(pendingPaymentOrder);
    } finally {
      if (!didStartRedirect) {
        isCreateOrderInFlightRef.current = false;
        setIsSubmittingOrder(false);
      }
    }
  }

  async function handleCreateOrder() {
    if (isCreateOrderInFlightRef.current) {
      if (import.meta.env.DEV) {
        console.debug("[pos-v3] duplicate create order submit blocked");
      }

      return;
    }

    if (pendingPaymentOrder) {
      toast.warning("Payment retry required", {
        description:
          "This order already exists. Retry the payment link instead of creating a new order.",
      });
      return;
    }

    if (!orderPayloadPreview.isReady) {
      toast.warning("Order is not ready", {
        description:
          orderPayloadPreview.errors[0]?.message ??
          "Please resolve the local validation rules first.",
      });
      return;
    }

    isCreateOrderInFlightRef.current = true;
    setIsSubmittingOrder(true);
    setPaymentStep("creating-order");
    setPendingPaymentOrder(null);

    let didStartRedirect = false;

    try {
      if (import.meta.env.DEV) {
        console.debug(
          "[pos-v3] create order payload",
          orderPayloadPreview.payload,
        );
      }

      const result = await orderApi.createOrderWithResult<CreateOrderResponse>(
        orderPayloadPreview.payload,
      );

      if (import.meta.env.DEV) {
        console.debug("[pos-v3] create order response", {
          status: result.status,
          ok: result.ok,
          body: result.body,
        });
      }

      if (!result.ok || !result.body.success || !result.body.data) {
        toast.error(
          result.body.message || `Failed to create order (${result.status})`,
        );
        setPaymentStep("idle");
        return;
      }

      tableCatalog.reload();
      openOrders.reload();

      if (isNonCashPaymentMethod(paymentMethod)) {
        const pendingOrder: PendingPaymentOrder = {
          orderId: result.body.data.id,
          total: result.body.data.total,
          orderNumber: result.body.data.orderNumber,
          paymentMethod,
          errorMessage: null,
        };

        setPendingPaymentOrder(pendingOrder);
        setPaymentStep("creating-payment");
        didStartRedirect = await createPaymentTransactionForOrder(pendingOrder);

        return;
      }

      setCartItems([]);
      setSelectedTableId(null);
      setSelectedOrderId(null);
      setAmountPaidInput("0");
      setPendingPaymentOrder(null);
      setPaymentStep("idle");

      toast.success("Order created successfully", {
        description: "Local cart was cleared and workspace data is refreshing.",
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[pos-v3] create order error", error);
      }

      setPaymentStep("idle");
      toast.error(getApiErrorMessage(error, "Failed to create order"));
    } finally {
      if (!didStartRedirect) {
        isCreateOrderInFlightRef.current = false;
        setIsSubmittingOrder(false);
      }
    }
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
            isRefreshing={tableCatalog.isRefreshing}
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
            isRefreshing={openOrders.isRefreshing}
            onSelectOrder={setSelectedOrderId}
            orders={openOrders.orders}
            selectedOrderId={selectedOrderId}
            status={openOrders.status}
          />
          <PosPaymentSummary totals={cartTotals} />
          <PosPaymentGate
            amountPaidInput={amountPaidInput}
            hasPendingPaymentOrder={pendingPaymentOrder !== null}
            isReady={orderPayloadPreview.isReady}
            isSubmitting={isSubmittingOrder}
            onAmountPaidInputChange={setAmountPaidInput}
            onOrderTypeChange={handleOrderTypeChange}
            onPaymentMethodChange={setPaymentMethod}
            onRetryPayment={handleRetryPaymentTransaction}
            onSubmit={handleCreateOrder}
            orderType={orderType}
            paymentErrorMessage={pendingPaymentOrder?.errorMessage ?? null}
            paymentMethod={paymentMethod}
            paymentStep={paymentStep}
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
