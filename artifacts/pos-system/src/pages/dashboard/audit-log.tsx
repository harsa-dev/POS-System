import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { AuditLogExtras } from "@/features/shared/workforce-operations/workforce-operation-extras";
import { AuditLogDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function AuditLogPage() {
  return (
    <RetailSharedDashboardBridge dashboardId="approvals">
      <AuditLogDashboard />
      <AuditLogExtras />
    </RetailSharedDashboardBridge>
  );
}
