import { getCurrentBusinessMode } from "@/components/core/business-mode/business-mode-storage";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { renderRetailDashboardMode } from "@/features/shared/retail-bridge/retail-mode-renderer";
import { ShiftReportsDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function ShiftReportsPage() {
  if (getCurrentBusinessMode() === "retail") {
    return renderRetailDashboardMode({ dashboardId: "shift-reports", mode: "replace", children: null });
  }

  return (
    <RawMaterialSharedDashboardBridge dashboardId="shift-reports">
      <RetailSharedDashboardBridge dashboardId="shift-reports">
        <ShiftReportsDashboard />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
