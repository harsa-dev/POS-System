import { ShiftsManager } from "@/components/shifts/shifts-manager";

import { requireRole } from "@/lib/auth/require-role";

export default async function ShiftsPage() {
  await requireRole(["OWNER", "MANAGER", "CASHIER"]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shifts</h1>

        <p className="mt-2 text-neutral-600">
          Manage cashier shifts and cash closing.
        </p>
      </div>

      <ShiftsManager />
    </section>
  );
}
