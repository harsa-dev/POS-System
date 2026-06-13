import { getCurrentBusinessMode } from "@/components/core/business-mode/business-mode-storage";
import { CustomersPartnersDashboard } from "@/features/shared/customers";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { renderRetailDashboardMode } from "@/features/shared/retail-bridge/retail-mode-renderer";

export default function CustomersPage() {
  if (getCurrentBusinessMode() === "retail") {
    return renderRetailDashboardMode({ dashboardId: "customers", mode: "replace", children: null });
  }

  return (
    <RawMaterialSharedDashboardBridge dashboardId="customers">
      <RetailSharedDashboardBridge dashboardId="customers">
        <CustomersPartnersDashboard />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
