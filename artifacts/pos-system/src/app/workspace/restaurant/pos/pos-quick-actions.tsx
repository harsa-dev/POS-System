import { CreditCard, Pause, Printer, Trash2 } from "lucide-react";

const posQuickActions = [
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

export function PosQuickActions() {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {posQuickActions.map((action) => {
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
