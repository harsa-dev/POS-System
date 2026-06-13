import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { EmployeePerformanceExtras } from "@/features/shared/workforce-operations/workforce-operation-extras";
import { EmployeePerformanceDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function EmployeePerformancePage() {
  return (
    <RawMaterialSharedDashboardBridge dashboardId="employee-performance">
      <RetailSharedDashboardBridge dashboardId="employee-performance">
        <EmployeePerformanceDashboard />
        <EmployeePerformanceExtras />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
