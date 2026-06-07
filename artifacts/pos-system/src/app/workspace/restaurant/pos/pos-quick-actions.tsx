import { CreditCard, Pause, Printer, Trash2 } from "lucide-react";

type PosQuickActionsProps = {
  hasCartItems: boolean;
  onClearCart: () => void;
};

const posQuickActions = [
  {
    label: "Hold order",
    icon: Pause,
    disabled: true,
    className: "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
  },
  {
    label: "Clear cart",
    icon: Trash2,
    disabled: false,
    className: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  },
  {
    label: "Print bill",
    icon: Printer,
    disabled: true,
    className: "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
  },
  {
    label: "Go to payment",
    icon: CreditCard,
    disabled: true,
    className: "border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800",
  },
] as const;

export function PosQuickActions({
  hasCartItems,
  onClearCart,
}: PosQuickActionsProps) {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {posQuickActions.map((action) => {
          const Icon = action.icon;
          const isClearCart = action.label === "Clear cart";
          const isDisabled = isClearCart ? !hasCartItems : action.disabled;

          return (
            <button
              aria-disabled={isDisabled}
              className={`flex h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${action.className}`}
              disabled={isDisabled}
              key={action.label}
              onClick={isClearCart ? onClearCart : undefined}
              title={isClearCart ? undefined : "Preview action, not wired yet"}
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
