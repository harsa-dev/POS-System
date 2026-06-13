import { BusinessOverviewDashboard } from "@/features/shared/business-overview";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";

export default function BusinessOverviewPage() {
  return (
    <RetailSharedDashboardBridge dashboardId="overview">
      <BusinessOverviewDashboard />
    </RetailSharedDashboardBridge>
  );
}
