import { Link } from "wouter";
import { CheckCircle2 } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="mt-6 text-3xl font-bold">Payment Successful</h1>
        <p className="mt-3 text-sm text-neutral-500">
          Transaction has been completed successfully.
        </p>
        <Link
          href="/dashboard/orders"
          className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-black px-5 py-4 font-semibold text-white"
        >
          View Orders
        </Link>
      </div>
    </section>
  );
}
