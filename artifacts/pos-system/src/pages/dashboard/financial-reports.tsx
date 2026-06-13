import { FinancialReportsDashboard } from "@/features/shared/financial-reports";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";

export default function FinancialReportsPage() {
  return (
    <RetailSharedDashboardBridge dashboardId="financial-reports">
      <FinancialReportsDashboard />
    </RetailSharedDashboardBridge>
  );
}
