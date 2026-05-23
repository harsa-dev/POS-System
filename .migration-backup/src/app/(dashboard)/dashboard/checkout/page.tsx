import { CheckoutManager } from "@/components/pos/checkout-manager";
import { requireRole } from "@/lib/auth/require-role";

export default async function CheckoutPage() {
  await requireRole(["OWNER", "MANAGER", "CASHIER"]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Checkout</h1>

        <p className="mt-2 text-neutral-600">
          Create customer orders and manage cart.
        </p>
      </div>

      <CheckoutManager />
    </section>
  );
}
