import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CreditCard,
  Package,
  ReceiptText,
  ShoppingCart,
  TrendingUp,
  Utensils,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

type AnalyticsOverview = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  activeOrders: number;
  lowStockItems: number;
};

function StatSkeleton() {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm animate-pulse">
      <div className="h-4 w-24 rounded bg-neutral-100" />
      <div className="mt-3 h-8 w-32 rounded-lg bg-neutral-200" />
      <div className="mt-2 h-3 w-20 rounded bg-neutral-100" />
    </div>
  );
}

export default function DashboardHome() {
  const { data, isLoading } = useQuery<{ success: boolean; data: AnalyticsOverview }>({
    queryKey: ["analytics-overview"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/overview", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    staleTime: 1000 * 30,
  });

  const overview = data?.data;

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

  const stats = overview
    ? [
        {
          label: "Total Revenue",
          value: formatCurrency(overview.totalRevenue, "IDR"),
          icon: TrendingUp,
          color: "text-green-600",
          bg: "bg-green-50",
        },
        {
          label: "Total Orders",
          value: overview.totalOrders.toLocaleString(),
          icon: ReceiptText,
          color: "text-blue-600",
          bg: "bg-blue-50",
        },
        {
          label: "Active Orders",
          value: overview.activeOrders.toLocaleString(),
          icon: Activity,
          color: "text-orange-600",
          bg: "bg-orange-50",
        },
        {
          label: "Low Stock Items",
          value: overview.lowStockItems.toLocaleString(),
          icon: AlertTriangle,
          color: overview.lowStockItems > 0 ? "text-red-600" : "text-neutral-600",
          bg: overview.lowStockItems > 0 ? "bg-red-50" : "bg-neutral-100",
        },
      ]
    : null;

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-neutral-500">Restaurant POS System</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="mt-4 max-w-2xl text-neutral-600">
          Manage transactions, menus, payments, and restaurant performance from one dashboard.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : stats?.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-3xl border bg-white p-6 shadow-sm">
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <p className="mt-4 text-sm text-neutral-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">{stat.value}</p>
                </div>
              );
            })}
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
              <p className="mt-2 text-sm text-neutral-500">{item.description}</p>
            </Link>
          );
        })}
      </div>

      <div className="rounded-3xl border bg-gradient-to-br from-primary to-primary/80 p-8 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
            <Utensils className="h-5 w-5 text-white" />
          </div>
          <p className="text-sm text-neutral-300">System Status</p>
        </div>
        <h2 className="mt-4 text-3xl font-bold">POS System Operational</h2>
        <p className="mt-3 max-w-2xl text-neutral-400">
          Orders, analytics, inventory, and payment integrations are connected and ready for restaurant operations.
        </p>
      </div>
    </section>
  );
}
