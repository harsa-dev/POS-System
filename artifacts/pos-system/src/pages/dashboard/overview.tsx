import { BusinessOverviewDashboard } from "@/features/shared/business-overview";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";

export default function BusinessOverviewPage() {
  return (
    <RawMaterialSharedDashboardBridge dashboardId="overview">
      <RetailSharedDashboardBridge dashboardId="overview">
        <BusinessOverviewDashboard />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
