import { getCurrentBusinessMode } from "@/components/core/business-mode/business-mode-storage";
import {
  InventoryCostSnapshotRepairPanel,
  InventoryManagementDashboard,
} from "@/features/shared/inventory";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { renderRetailDashboardMode } from "@/features/shared/retail-bridge/retail-mode-renderer";

export default function InventoryPage() {
  if (getCurrentBusinessMode() === "retail") {
    return renderRetailDashboardMode({ dashboardId: "inventory", mode: "replace", children: null });
  }

  return (
    <RawMaterialSharedDashboardBridge dashboardId="inventory">
      <RetailSharedDashboardBridge dashboardId="inventory">
        <InventoryCostSnapshotRepairPanel />
        <InventoryManagementDashboard />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
