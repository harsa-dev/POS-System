import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { EmployeeAttendanceExtras } from "@/features/shared/workforce-operations/workforce-operation-extras";
import { EmployeeAttendanceDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function EmployeeAttendancePage() {
  return (
    <RawMaterialSharedDashboardBridge dashboardId="team-management">
      <RetailSharedDashboardBridge dashboardId="team-management">
        <EmployeeAttendanceDashboard />
        <EmployeeAttendanceExtras />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
