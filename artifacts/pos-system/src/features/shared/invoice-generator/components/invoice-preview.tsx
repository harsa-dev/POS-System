import { InvoiceStatus } from "./invoice-status";
import { formatCurrency } from "@/features/shared/format";
import { calculateInvoiceLineTotal } from "../services/invoice-calculations";
import type { InvoiceDraft, InvoiceTotals } from "@/features/shared/types";

type InvoicePreviewProps = {
  invoice: InvoiceDraft;
  totals: InvoiceTotals;
};

export function InvoicePreview({ invoice, totals }: InvoicePreviewProps) {
  return (
    <section
      id="invoice-preview"
      className="min-h-[780px] rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-6 border-b border-neutral-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          {invoice.business.logoUrl && (
            <img
              src={invoice.business.logoUrl}
              alt="Business logo"
              className="h-16 w-16 rounded-lg object-cover"
            />
          )}
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
              {invoice.business.name || "Business Name"}
            </h2>
            <div className="mt-2 space-y-1 text-sm text-neutral-500">
              <p>{invoice.business.email}</p>
              <p>{invoice.business.phone}</p>
              <p>{invoice.business.address}</p>
            </div>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-3xl font-bold tracking-tight text-neutral-950">
            INVOICE
          </p>
          <p className="mt-2 text-sm font-semibold text-neutral-700">
            {invoice.billing.invoiceNumber}
          </p>
          <div className="mt-3">
            <InvoiceStatus status={invoice.paymentStatus} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 border-b border-neutral-200 py-6 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Bill To
          </p>
          <h3 className="mt-2 font-semibold text-neutral-950">
            {invoice.customer.name || "Customer Name"}
          </h3>
          <div className="mt-2 space-y-1 text-sm text-neutral-500">
            <p>{invoice.customer.phone}</p>
            <p>{invoice.customer.address}</p>
          </div>
        </div>
        <div className="grid gap-2 text-sm md:justify-end">
          <div className="grid grid-cols-[110px_1fr] gap-3">
            <span className="text-neutral-500">Invoice Date</span>
            <span className="font-medium text-neutral-800">
              {invoice.billing.invoiceDate}
            </span>
          </div>
          <div className="grid grid-cols-[110px_1fr] gap-3">
            <span className="text-neutral-500">Due Date</span>
            <span className="font-medium text-neutral-800">
              {invoice.billing.dueDate || "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto py-6">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500">
            <tr>
              <th className="py-3 font-semibold">Description</th>
              <th className="py-3 text-right font-semibold">Qty</th>
              <th className="py-3 text-right font-semibold">Unit Price</th>
              <th className="py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-neutral-100">
                <td className="py-4 font-medium text-neutral-950">
                  {item.description || "Item description"}
                </td>
                <td className="py-4 text-right text-neutral-600">{item.quantity}</td>
                <td className="py-4 text-right text-neutral-600">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="py-4 text-right font-semibold text-neutral-950">
                  {formatCurrency(calculateInvoiceLineTotal(item))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 border-t border-neutral-200 pt-6 md:grid-cols-[1fr_280px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Notes
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-neutral-600">
            {invoice.notes || "-"}
          </p>
        </div>
        <div className="space-y-3 rounded-lg bg-neutral-50 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-neutral-500">Subtotal</span>
            <span className="font-medium text-neutral-800">
              {formatCurrency(totals.subtotal)}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-neutral-500">Discount</span>
            <span className="font-medium text-rose-700">
              -{formatCurrency(totals.discountAmount)}
            </span>
          </div>
          <div className="flex justify-between gap-3 border-t border-neutral-200 pt-3 text-base">
            <span className="font-semibold text-neutral-950">Grand Total</span>
            <span className="font-bold text-neutral-950">
              {formatCurrency(totals.grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
