import { getCurrentBusinessMode } from "@/components/core/business-mode/business-mode-storage";
import { CashierShiftReportsDashboard } from "@/features/shared/cashier-shift-reports";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { renderRetailDashboardMode } from "@/features/shared/retail-bridge/retail-mode-renderer";

export default function CashierShiftReportsPage() {
  if (getCurrentBusinessMode() === "retail") {
    return renderRetailDashboardMode({ dashboardId: "shift-reports", mode: "replace", children: null });
  }

  return (
    <RawMaterialSharedDashboardBridge dashboardId="shift-reports">
      <RetailSharedDashboardBridge dashboardId="shift-reports">
        <CashierShiftReportsDashboard />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
