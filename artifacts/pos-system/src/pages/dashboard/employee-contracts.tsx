import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import * as WorkforceExtras from "@/features/shared/workforce-operations/workforce-operation-extras";
import * as WorkforceDashboards from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function EmployeeContractsPage() {
  return (
    <RawMaterialSharedDashboardBridge dashboardId="team-management">
      <RetailSharedDashboardBridge dashboardId="team-management">
        <WorkforceDashboards.EmployeeContractsDashboard />
        <WorkforceExtras.EmployeeContractsExtras />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
