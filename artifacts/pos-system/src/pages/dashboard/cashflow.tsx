import { CashflowDashboard } from "@/features/shared/cashflow";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";

export default function CashflowPage() {
  return (
    <RawMaterialSharedDashboardBridge dashboardId="cashflow">
      <RetailSharedDashboardBridge dashboardId="cashflow">
        <CashflowDashboard />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
