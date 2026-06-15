import { getCurrentBusinessMode } from "@/components/core/business-mode/business-mode-storage";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { renderRetailDashboardMode } from "@/features/shared/retail-bridge/retail-mode-renderer";
import { SalesAnalyticsWorkspace } from "@/features/shared/sales";

export default function AnalyticsPage() {
  if (getCurrentBusinessMode() === "retail") {
    return renderRetailDashboardMode({
      dashboardId: "sales",
      mode: "replace",
      children: null,
    });
  }

  return (
    <RawMaterialSharedDashboardBridge dashboardId="sales">
      <RetailSharedDashboardBridge dashboardId="sales">
        <SalesAnalyticsWorkspace />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
