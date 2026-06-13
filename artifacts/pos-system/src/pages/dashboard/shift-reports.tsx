import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { ShiftReportsExtras } from "@/features/shared/workforce-operations/workforce-operation-extras";
import { ShiftReportsDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function ShiftReportsPage() {
  return (
    <RawMaterialSharedDashboardBridge dashboardId="shift-reports">
      <RetailSharedDashboardBridge dashboardId="shift-reports">
        <ShiftReportsDashboard />
        <ShiftReportsExtras />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
