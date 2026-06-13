import { AuditLogExtras } from "@/features/shared/workforce-operations/workforce-operation-extras";
import { AuditLogDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function AuditLogPage() {
  return (
    <>
      <AuditLogDashboard />
      <AuditLogExtras />
    </>
  );
}
