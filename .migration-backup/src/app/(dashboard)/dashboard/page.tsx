import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  Package,
  ReceiptText,
  ShoppingCart,
} from "lucide-react";

export default function DashboardPage() {
  const shortcuts = [
    {
      title: "Checkout",
      description: "Create new customer orders.",
      href: "/dashboard/checkout",
      icon: ShoppingCart,
    },
    {
      title: "Orders",
      description: "Manage transaction history.",
      href: "/dashboard/orders",
      icon: ReceiptText,
    },
    {
      title: "Menu",
      description: "Manage menu and inventory.",
      href: "/dashboard/menu",
      icon: Package,
    },
    {
      title: "Payments",
      description: "Track payment transactions.",
      href: "/dashboard/payments",
      icon: CreditCard,
    },
  ];

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-neutral-500">
          Restaurant POS System
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Dashboard Overview
        </h1>

        <p className="mt-4 max-w-2xl text-neutral-600">
          Manage transactions, menus, payments, and restaurant performance
          from one dashboard.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {shortcuts.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-neutral-100 p-3">
                  <Icon className="h-6 w-6 text-neutral-700" />
                </div>

                <ArrowRight className="h-5 w-5 text-neutral-400 transition group-hover:translate-x-1" />
              </div>

              <h2 className="mt-6 text-xl font-bold">{item.title}</h2>

              <p className="mt-2 text-sm text-neutral-500">
                {item.description}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="rounded-3xl border bg-gradient-to-br from-black to-neutral-800 p-8 text-white shadow-sm">
        <p className="text-sm text-neutral-300">System Status</p>

        <h2 className="mt-3 text-3xl font-bold">POS System Operational</h2>

        <p className="mt-3 max-w-2xl text-neutral-400">
          Orders, analytics, inventory, and payment integrations are connected
          and ready for restaurant operations.
        </p>
      </div>
    </section>
  );
}
