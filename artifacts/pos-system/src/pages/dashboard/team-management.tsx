import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import * as WorkforceExtras from "@/features/shared/workforce-operations/workforce-operation-extras";
import * as WorkforceDashboards from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function TeamManagementPage() {
  return (
    <RetailSharedDashboardBridge dashboardId="team-management">
      <WorkforceDashboards.TeamManagementDashboard />
      <WorkforceExtras.TeamManagementExtras />
    </RetailSharedDashboardBridge>
  );
}
