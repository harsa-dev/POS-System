import { getCurrentBusinessMode } from "@/components/core/business-mode/business-mode-storage";
import { FinancialReportsDashboard } from "@/features/shared/financial-reports";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { renderRetailDashboardMode } from "@/features/shared/retail-bridge/retail-mode-renderer";

export default function FinancialReportsPage() {
  if (getCurrentBusinessMode() === "retail") {
    return renderRetailDashboardMode({ dashboardId: "financial-reports", mode: "replace", children: null });
  }

  return (
    <RawMaterialSharedDashboardBridge dashboardId="financial-reports">
      <RetailSharedDashboardBridge dashboardId="financial-reports">
        <FinancialReportsDashboard />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
