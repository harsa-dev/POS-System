import { getCurrentBusinessMode } from "@/components/core/business-mode/business-mode-storage";
import { CashflowDashboard } from "@/features/shared/cashflow";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { renderRetailDashboardMode } from "@/features/shared/retail-bridge/retail-mode-renderer";

export default function CashflowPage() {
  if (getCurrentBusinessMode() === "retail") {
    return renderRetailDashboardMode({ dashboardId: "cashflow", mode: "replace", children: null });
  }

  return (
    <RawMaterialSharedDashboardBridge dashboardId="cashflow">
      <RetailSharedDashboardBridge dashboardId="cashflow">
        <CashflowDashboard />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
