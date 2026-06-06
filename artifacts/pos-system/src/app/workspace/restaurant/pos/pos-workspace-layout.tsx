import { PosCategoryRail } from "./pos-category-rail";
import { PosOpenOrdersPanel } from "./pos-open-orders-panel";
import { PosOrderPanel } from "./pos-order-panel";
import { PosPaymentSummary } from "./pos-payment-summary";
import { PosProductGrid } from "./pos-product-grid";
import { PosQuickActions } from "./pos-quick-actions";
import { PosWorkspaceHeader } from "./pos-workspace-header";

export function PosWorkspaceLayout() {
  return (
    <div className="space-y-4">
      <PosWorkspaceHeader />
      <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_360px]">
        <PosCategoryRail />
        <PosProductGrid />
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
