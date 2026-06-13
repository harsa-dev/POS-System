import { getCurrentBusinessMode } from "@/components/core/business-mode/business-mode-storage";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { renderRetailDashboardMode } from "@/features/shared/retail-bridge/retail-mode-renderer";
import { EmployeePerformanceDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function EmployeePerformancePage() {
  if (getCurrentBusinessMode() === "retail") {
    return renderRetailDashboardMode({ dashboardId: "employee-performance", mode: "replace", children: null });
  }

  return (
    <RawMaterialSharedDashboardBridge dashboardId="employee-performance">
      <RetailSharedDashboardBridge dashboardId="employee-performance">
        <EmployeePerformanceDashboard />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
