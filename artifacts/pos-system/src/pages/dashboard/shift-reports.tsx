import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { ShiftReportsExtras } from "@/features/shared/workforce-operations/workforce-operation-extras";
import { ShiftReportsDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function ShiftReportsPage() {
  return (
    <RetailSharedDashboardBridge dashboardId="shift-reports">
      <ShiftReportsDashboard />
      <ShiftReportsExtras />
    </RetailSharedDashboardBridge>
  );
}
