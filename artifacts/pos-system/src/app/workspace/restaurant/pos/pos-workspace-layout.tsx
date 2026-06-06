import { useMemo, useState } from "react";

import { PosCategoryRail } from "./pos-category-rail";
import { PosOpenOrdersPanel } from "./pos-open-orders-panel";
import { PosOrderPanel } from "./pos-order-panel";
import { PosPaymentSummary } from "./pos-payment-summary";
import { PosProductGrid } from "./pos-product-grid";
import { PosQuickActions } from "./pos-quick-actions";
import { PosTableStatusPanel } from "./pos-table-status-panel";
import { PosWorkspaceHeader } from "./pos-workspace-header";
import { usePosMenuCatalog } from "./use-pos-menu-catalog";
import { usePosOpenOrders } from "./use-pos-open-orders";
import { usePosTables } from "./use-pos-tables";

export function PosWorkspaceLayout() {
  const catalog = usePosMenuCatalog();
  const tableCatalog = usePosTables();
  const openOrders = usePosOpenOrders();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
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
          <PosOrderPanel selectedTable={selectedTable} />
          <PosOpenOrdersPanel
            errorMessage={openOrders.errorMessage}
            isUsingFallback={openOrders.isUsingFallback}
            onSelectOrder={setSelectedOrderId}
            orders={openOrders.orders}
            selectedOrderId={selectedOrderId}
            status={openOrders.status}
          />
          <PosPaymentSummary />
        </aside>
      </div>
      <PosQuickActions />
    </div>
  );
}
