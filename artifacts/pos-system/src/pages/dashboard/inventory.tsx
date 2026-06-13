import { InventoryManagementDashboard } from "@/features/shared/inventory";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";

export default function InventoryPage() {
  return (
    <RawMaterialSharedDashboardBridge dashboardId="inventory">
      <RetailSharedDashboardBridge dashboardId="inventory">
        <InventoryManagementDashboard />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
