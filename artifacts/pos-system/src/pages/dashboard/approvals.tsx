import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { ApprovalExtras } from "@/features/shared/workforce-operations/workforce-operation-extras";
import { ApprovalDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function ApprovalsPage() {
  return (
    <RawMaterialSharedDashboardBridge dashboardId="approvals">
      <RetailSharedDashboardBridge dashboardId="approvals">
        <ApprovalDashboard />
        <ApprovalExtras />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
