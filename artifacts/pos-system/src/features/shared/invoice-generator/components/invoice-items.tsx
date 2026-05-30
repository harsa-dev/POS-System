import { Plus, Trash2, Upload } from "lucide-react";

import {
  DashboardActionButton,
  DashboardActions,
} from "@/features/shared/dashboard";
import { formatCurrency } from "@/features/shared/format";
import type { InvoiceItem } from "@/features/shared/types";

type InvoiceItemsProps = {
  items: InvoiceItem[];
  onChange: (items: InvoiceItem[]) => void;
};

function createInvoiceItem(): InvoiceItem {
  return {
    id: `item-${Date.now()}`,
    description: "",
    quantity: 1,
    unitPrice: 0,
  };
}

export function InvoiceItems({ items, onChange }: InvoiceItemsProps) {
  function updateItem(id: string, updates: Partial<InvoiceItem>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }

  function deleteItem(id: string) {
    if (items.length === 1) return;
    onChange(items.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-3 py-3 font-semibold">Description / Product / Service</th>
              <th className="px-3 py-3 font-semibold">Quantity</th>
              <th className="px-3 py-3 font-semibold">Unit Price</th>
              <th className="px-3 py-3 font-semibold">Total</th>
              <th className="px-3 py-3 text-right font-semibold">Delete</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-neutral-100">
                <td className="px-3 py-3">
                  <input
                    value={item.description}
                    onChange={(event) =>
                      updateItem(item.id, { description: event.target.value })
                    }
                    placeholder="Item description"
                    className="h-10 w-full rounded-lg border border-neutral-200 px-3 outline-none focus:border-neutral-400"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    type="number"
                    min={0}
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(item.id, { quantity: Number(event.target.value) })
                    }
                    className="h-10 w-24 rounded-lg border border-neutral-200 px-3 outline-none focus:border-neutral-400"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(event) =>
                      updateItem(item.id, { unitPrice: Number(event.target.value) })
                    }
                    className="h-10 w-36 rounded-lg border border-neutral-200 px-3 outline-none focus:border-neutral-400"
                  />
                </td>
                <td className="px-3 py-3 font-semibold text-neutral-950">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </td>
                <td className="px-3 py-3 text-right">
                  <button
                    type="button"
                    aria-label="Delete invoice item"
                    onClick={() => deleteItem(item.id)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DashboardActions>
        <DashboardActionButton
          icon={Plus}
          variant="primary"
          onClick={() => onChange([...items, createInvoiceItem()])}
        >
          Add Item
        </DashboardActionButton>
        <DashboardActionButton icon={Upload}>Import From Receivables</DashboardActionButton>
      </DashboardActions>
    </div>
  );
}
