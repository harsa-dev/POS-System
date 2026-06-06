import { useMemo, useState } from "react";

import { PosCategoryRail } from "./pos-category-rail";
import { PosOpenOrdersPanel } from "./pos-open-orders-panel";
import { PosOrderPanel } from "./pos-order-panel";
import { PosPaymentSummary } from "./pos-payment-summary";
import { PosProductGrid } from "./pos-product-grid";
import { PosQuickActions } from "./pos-quick-actions";
import { PosWorkspaceHeader } from "./pos-workspace-header";
import { usePosMenuCatalog } from "./use-pos-menu-catalog";

export function PosWorkspaceLayout() {
  const catalog = usePosMenuCatalog();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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

  return (
    <div className="space-y-4">
      <PosWorkspaceHeader
        onSearchQueryChange={setSearchQuery}
        searchQuery={searchQuery}
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
          <PosOrderPanel />
          <PosOpenOrdersPanel />
          <PosPaymentSummary />
        </aside>
      </div>
      <PosQuickActions />
    </div>
  );
}
