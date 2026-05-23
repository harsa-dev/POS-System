import { ServingBoard } from "@/components/serving/serving-board";
import { requireRole } from "@/lib/auth/require-role";

export default async function ServingPage() {
  await requireRole(["OWNER", "MANAGER", "CASHIER", "SERVER"]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Serving</h1>

        <p className="mt-2 text-neutral-600">
          Manage ready orders and complete service.
        </p>
      </div>

      <ServingBoard />
    </section>
  );
}
