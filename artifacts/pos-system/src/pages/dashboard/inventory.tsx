import { InventoryManagementDashboard } from "@/features/shared/inventory";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";

export default function InventoryPage() {
  return (
    <RetailSharedDashboardBridge dashboardId="inventory">
      <InventoryManagementDashboard />
    </RetailSharedDashboardBridge>
  );
}
