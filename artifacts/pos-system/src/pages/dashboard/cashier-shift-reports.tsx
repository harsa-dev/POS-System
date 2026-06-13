import { CashierShiftReportsDashboard } from "@/features/shared/cashier-shift-reports";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";

export default function CashierShiftReportsPage() {
  return (
    <RetailSharedDashboardBridge dashboardId="shift-reports">
      <CashierShiftReportsDashboard />
    </RetailSharedDashboardBridge>
  );
}
