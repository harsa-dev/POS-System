import { KDSBoard } from "@/components/kds/kds-board";
import { requireRole } from "@/lib/auth/require-role";

export default async function KDSPage() {
  await requireRole(["OWNER", "MANAGER", "KITCHEN"]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kitchen Display System</h1>

        <p className="mt-2 text-neutral-600">
          Monitor and complete kitchen orders.
        </p>
      </div>

      <KDSBoard />
    </section>
  );
}
