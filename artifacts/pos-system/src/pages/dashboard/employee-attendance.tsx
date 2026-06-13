import { EmployeeAttendanceExtras } from "@/features/shared/workforce-operations/workforce-operation-extras";
import { EmployeeAttendanceDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";

export default function EmployeeAttendancePage() {
  return (
    <RetailSharedDashboardBridge dashboardId="team-management">
      <EmployeeAttendanceDashboard />
      <EmployeeAttendanceExtras />
    </RetailSharedDashboardBridge>
  );
}
