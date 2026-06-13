import { EmployeePerformanceExtras } from "@/features/shared/workforce-operations/workforce-operation-extras";
import { EmployeePerformanceDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";

export default function EmployeePerformancePage() {
  return (
    <RetailSharedDashboardBridge dashboardId="employee-performance">
      <EmployeePerformanceDashboard />
      <EmployeePerformanceExtras />
    </RetailSharedDashboardBridge>
  );
}
