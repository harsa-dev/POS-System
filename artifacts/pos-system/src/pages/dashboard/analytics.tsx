import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { SalesAnalyticsDashboard } from "@/features/shared/sales";

export default function AnalyticsPage() {
  return (
    <RetailSharedDashboardBridge dashboardId="sales">
      <SalesAnalyticsDashboard />
    </RetailSharedDashboardBridge>
  );
}
