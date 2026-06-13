import { RawMaterialSharedDashboardBridge } from "@/features/shared/raw-material-bridge";
import { RetailSharedDashboardBridge } from "@/features/shared/retail-bridge";
import { AuditLogExtras } from "@/features/shared/workforce-operations/workforce-operation-extras";
import { AuditLogDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function AuditLogPage() {
  return (
    <RawMaterialSharedDashboardBridge dashboardId="approvals">
      <RetailSharedDashboardBridge dashboardId="approvals">
        <AuditLogDashboard />
        <AuditLogExtras />
      </RetailSharedDashboardBridge>
    </RawMaterialSharedDashboardBridge>
  );
}
