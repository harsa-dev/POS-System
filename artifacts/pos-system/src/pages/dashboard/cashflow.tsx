import { CashflowDashboard } from "@/features/shared/cashflow";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";

export default function CashflowPage() {
  return (
    <RetailSharedDashboardBridge dashboardId="cashflow">
      <CashflowDashboard />
    </RetailSharedDashboardBridge>
  );
}
