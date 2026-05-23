import { TablesManager } from "@/components/tables/tables-manager";

import { requireRole } from "@/lib/auth/require-role";

export default async function TablesPage() {
  await requireRole(["OWNER", "MANAGER"]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tables</h1>

        <p className="mt-2 text-neutral-600">
          Manage restaurant dining tables.
        </p>
      </div>

      <TablesManager />
    </section>
  );
}
