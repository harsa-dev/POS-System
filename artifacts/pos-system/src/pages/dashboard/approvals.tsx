import { ApprovalExtras } from "@/features/shared/workforce-operations/workforce-operation-extras";
import { ApprovalDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";

export default function ApprovalsPage() {
  return (
    <RetailSharedDashboardBridge dashboardId="approvals">
      <ApprovalDashboard />
      <ApprovalExtras />
    </RetailSharedDashboardBridge>
  );
}
