import { getCurrentBusinessMode } from "@/components/core/business-mode/business-mode-storage";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { renderRetailDashboardMode } from "@/features/shared/retail-bridge/retail-mode-renderer";
import { EmployeeAttendanceDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function EmployeeAttendancePage() {
  if (getCurrentBusinessMode() === "retail") {
    return renderRetailDashboardMode({ dashboardId: "employee-attendance", mode: "skip", children: null });
  }

  return (
    <RawMaterialSharedDashboardBridge dashboardId="team-management">
      <RetailSharedDashboardBridge dashboardId="team-management">
        <EmployeeAttendanceDashboard />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
