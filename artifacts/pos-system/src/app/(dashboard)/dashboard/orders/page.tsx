import { OrdersManager } from "@/components/orders/orders-manager";
import { requireRole } from "@/lib/auth/require-role";

export default async function OrdersPage() {
  await requireRole(["OWNER", "MANAJER", "CASHIER"]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="mt-2 text-neutral-600">View transaction history.</p>
      </div>

      <OrdersManager />
    </section>
  );
}
