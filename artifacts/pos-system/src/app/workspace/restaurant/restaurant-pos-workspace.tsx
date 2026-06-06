import {
  Clock3,
  CreditCard,
  Pause,
  Printer,
  ReceiptText,
  Search,
  ShoppingCart,
  Sparkles,
  Table2,
  Trash2,
  Utensils,
} from "lucide-react";

import { WorkspaceShell } from "@/app/workspace/workspace-shell";
import {
  v3PosCartItems,
  v3PosCategories,
  v3PosOpenOrders,
  v3PosProducts,
} from "@/app/workspace/restaurant/pos-placeholder-data";
import { ROUTES } from "@/constants/routes";

function V3PosHeaderToolbar() {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            V3 visual skeleton
          </div>
          <h2 className="mt-3 text-xl font-bold text-neutral-950">
            POS Counter Workspace
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Static layout preview for cashier ordering, cart review, and payment handoff.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:min-w-[680px]">
          <label className="flex h-12 items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-sm text-neutral-500">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
              placeholder="Search menu item or SKU"
              type="search"
            />
          </label>

          <label className="flex h-12 items-center rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-sm text-neutral-600">
            <select
              className="w-full bg-transparent text-sm font-medium outline-none"
              defaultValue="dine-in"
            >
              <option value="dine-in">Dine In</option>
              <option value="takeaway">Takeaway</option>
              <option value="delivery">Delivery</option>
            </select>
          </label>

          <div className="flex h-12 items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-sm">
            <span className="flex items-center gap-2 font-medium text-neutral-700">
              <Table2 className="h-4 w-4 text-neutral-500" aria-hidden="true" />
              Table 8
            </span>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
              Occupied
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function V3PosCategoryRail() {
  return (
    <aside className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-950">Categories</h3>
        <Utensils className="h-4 w-4 text-neutral-400" aria-hidden="true" />
      </div>

      <div className="mt-4 space-y-2">
        {v3PosCategories.map((category) => (
          <button
            className={`flex w-full items-center justify-between rounded-2xl border border-neutral-200 px-3 py-3 text-left text-sm font-semibold transition hover:border-neutral-300 ${category.tone}`}
            key={category.label}
            type="button"
          >
            <span>{category.label}</span>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-500">
              {category.count}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-2xl bg-neutral-50 p-3 text-xs leading-5 text-neutral-500">
        Category behavior is intentionally static here. Real grouping, modifiers,
        and favorites remain future workspace wiring.
      </div>
    </aside>
  );
}

function V3PosProductGrid() {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-neutral-950">Product Grid</h3>
          <p className="mt-1 text-xs text-neutral-500">
            Static product cards only. No inventory, menu, or pricing API is connected.
          </p>
        </div>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
          6 preview items
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {v3PosProducts.map((product) => (
          <button
            className="group min-h-36 rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
            key={product.name}
            type="button"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600">
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {product.status}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-bold text-neutral-950">
                {product.name}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {product.category}
              </p>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <span className="text-base font-bold text-neutral-950">
                {product.price}
              </span>
              <span className="text-xs font-semibold text-neutral-400 group-hover:text-neutral-600">
                Add
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function V3PosCurrentOrderPanel() {
  return (
    <aside className="space-y-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-950">Current Order</h3>
            <p className="mt-1 text-xs text-neutral-500">Table 8, dine in</p>
          </div>
          <span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
            Draft
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {v3PosCartItems.map((item) => (
            <div
              className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
              key={item.name}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-950">
                    {item.quantity}x {item.name}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">{item.note}</p>
                </div>
                <p className="shrink-0 text-sm font-bold text-neutral-950">
                  {item.total}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-950">Open Orders</h3>
          <Clock3 className="h-4 w-4 text-neutral-400" aria-hidden="true" />
        </div>
        <div className="mt-4 space-y-2">
          {v3PosOpenOrders.map((order) => (
            <div
              className="flex items-center justify-between rounded-2xl bg-neutral-50 px-3 py-3 text-sm"
              key={order.code}
            >
              <div>
                <p className="font-semibold text-neutral-950">
                  {order.code} · {order.table}
                </p>
                <p className="mt-1 text-xs text-neutral-500">{order.status}</p>
              </div>
              <p className="font-bold text-neutral-800">{order.total}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-950">Payment Summary</h3>
          <ReceiptText className="h-4 w-4 text-neutral-400" aria-hidden="true" />
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-neutral-500">
            <span>Subtotal</span>
            <span className="font-semibold text-neutral-800">Rp 170.000</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Service</span>
            <span className="font-semibold text-neutral-800">Rp 8.500</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Tax</span>
            <span className="font-semibold text-neutral-800">Rp 17.000</span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between text-base font-bold text-neutral-950">
              <span>Total</span>
              <span>Rp 195.500</span>
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
}

function V3PosQuickActions() {
  const actions = [
    {
      label: "Hold order",
      icon: Pause,
      className: "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
    },
    {
      label: "Clear cart",
      icon: Trash2,
      className: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    },
    {
      label: "Print bill",
      icon: Printer,
      className: "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
    },
    {
      label: "Go to payment",
      icon: CreditCard,
      className: "border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800",
    },
  ] as const;

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              className={`flex h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition ${action.className}`}
              key={action.label}
              type="button"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {action.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function V3PosWorkspaceLayout() {
  return (
    <div className="space-y-4">
      <V3PosHeaderToolbar />
      <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_360px]">
        <V3PosCategoryRail />
        <V3PosProductGrid />
        <V3PosCurrentOrderPanel />
      </div>
      <V3PosQuickActions />
    </div>
  );
}

export default function RestaurantPosWorkspace() {
  return (
    <WorkspaceShell
      title="Restaurant POS Workspace"
      description="Skeleton route for the future V3 Restaurant POS workspace. The active cashier and checkout flow is still served by the current F&B dashboard route."
      currentRouteLabel="current Cashier route"
      currentRoutePath={ROUTES.CHECKOUT}
    >
      <V3PosWorkspaceLayout />
    </WorkspaceShell>
  );
}
