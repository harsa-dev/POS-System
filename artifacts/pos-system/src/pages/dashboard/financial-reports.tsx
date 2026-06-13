import { FinancialReportsDashboard } from "@/features/shared/financial-reports";
import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";

export default function FinancialReportsPage() {
  return (
    <RawMaterialSharedDashboardBridge dashboardId="financial-reports">
      <RetailSharedDashboardBridge dashboardId="financial-reports">
        <FinancialReportsDashboard />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
