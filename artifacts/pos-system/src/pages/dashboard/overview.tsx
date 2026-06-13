import { getCurrentBusinessMode } from "@/components/core/business-mode/business-mode-storage";
import { BusinessOverviewDashboard } from "@/features/shared/business-overview";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { renderRetailDashboardMode } from "@/features/shared/retail-bridge/retail-mode-renderer";

export default function BusinessOverviewPage() {
  if (getCurrentBusinessMode() === "retail") {
    return renderRetailDashboardMode({
      dashboardId: "overview",
      mode: "replace",
      children: null,
    });
  }

  return (
    <RawMaterialSharedDashboardBridge dashboardId="overview">
      <RetailSharedDashboardBridge dashboardId="overview">
        <BusinessOverviewDashboard />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
