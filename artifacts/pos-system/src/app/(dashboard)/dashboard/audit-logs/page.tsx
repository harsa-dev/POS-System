import { AuditLogsManager } from "@/components/audit-logs/audit-logs-manager";
import { requireRole } from "@/lib/auth/require-role";

export default async function AuditLogsPage() {
  await requireRole(["OWNER", "MANAGER"]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>

        <p className="mt-2 text-neutral-600">
          Track important system activities.
        </p>
      </div>

      <AuditLogsManager />
    </section>
  );
}
