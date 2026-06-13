import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import * as WorkforceExtras from "@/features/shared/workforce-operations/workforce-operation-extras";
import * as WorkforceDashboards from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function EmployeeContractsPage() {
  return (
    <RetailSharedDashboardBridge dashboardId="team-management">
      <WorkforceDashboards.EmployeeContractsDashboard />
      <WorkforceExtras.EmployeeContractsExtras />
    </RetailSharedDashboardBridge>
  );
}
