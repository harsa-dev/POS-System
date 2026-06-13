import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { ShiftOverviewExtras } from "@/features/shared/workforce-operations/workforce-operation-extras";
import { ShiftOverviewDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function RosterOverviewPage() {
  return (
    <RawMaterialSharedDashboardBridge dashboardId="team-management">
      <RetailSharedDashboardBridge dashboardId="team-management">
        <ShiftOverviewDashboard />
        <ShiftOverviewExtras />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
