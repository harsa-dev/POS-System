import { PaymentsManager } from "@/components/payments/payments-manager";
import { requireRole } from "@/lib/auth/require-role";

export default async function PaymentsPage() {
  await requireRole(["OWNER", "MANAGER"]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>

        <p className="mt-2 text-neutral-600">
          Monitor paid and pending transactions.
        </p>
      </div>

      <PaymentsManager />
    </section>
  );
}
