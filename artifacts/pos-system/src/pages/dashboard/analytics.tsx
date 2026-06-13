import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { SalesAnalyticsDashboard } from "@/features/shared/sales";

export default function AnalyticsPage() {
  return (
    <RawMaterialSharedDashboardBridge dashboardId="sales">
      <RetailSharedDashboardBridge dashboardId="sales">
        <SalesAnalyticsDashboard />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
