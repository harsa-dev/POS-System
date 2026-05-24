import { Link } from "wouter";
import { CircleX } from "lucide-react";

export default function PaymentErrorPage() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <CircleX className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="mt-6 text-3xl font-bold">Payment Failed</h1>
        <p className="mt-3 text-sm text-neutral-500">
          Transaction failed or was cancelled.
        </p>
        <Link
          href="/dashboard/checkout"
          className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-4 font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Back to Checkout
        </Link>
      </div>
    </section>
  );
}
