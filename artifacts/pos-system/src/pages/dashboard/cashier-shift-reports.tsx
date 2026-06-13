import { CashierShiftReportsDashboard } from "@/features/shared/cashier-shift-reports";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";

export default function CashierShiftReportsPage() {
  return (
    <RawMaterialSharedDashboardBridge dashboardId="shift-reports">
      <RetailSharedDashboardBridge dashboardId="shift-reports">
        <CashierShiftReportsDashboard />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
